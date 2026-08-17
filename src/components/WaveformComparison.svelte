<script lang="ts" module>
  const TARGET_WIDTH = 800;
  const CANVAS_HEIGHT = 80;

  // ピーク抽出を区切る間隔（ms）。これを超えたらメインスレッドへ制御を返す
  const YIELD_INTERVAL_MS = 8;
  // ピーク抽出のチャンクあたりの列数（この単位で経過時間をチェックする）
  const CHUNK_COLUMNS = 50;
  // キャッシュ上限（LRU）。溢れた分は破棄して Blob 参照を解放する
  const PEAK_CACHE_LIMIT = 8;

  // デコード専用の AudioContext。選択のたびに生成せずモジュール内で共有する
  let sharedAudioCtx: AudioContext | null = null;

  function getSharedAudioContext(): AudioContext {
    // 一度 closed になると decodeAudioData が常に失敗するため作り直す
    // （iOS Safari の割り込みやブラウザのリソース回収で閉じられることがある）
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioContext();
    }
    return sharedAudioCtx;
  }
</script>

<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { CompareSelection } from "$lib/types";

  const appState = getAppState();

  let canvasA: HTMLCanvasElement | undefined = $state();
  let canvasB: HTMLCanvasElement | undefined = $state();

  let peaksA = $state<Float32Array | null>(null);
  let peaksB = $state<Float32Array | null>(null);

  // キー → { peaks, source参照 } でキャッシュ（source が変わったら無効化）
  // Map の挿入順を使った LRU。上限を超えたら最古のエントリを消す
  const peakCache = new Map<string, { peaks: Float32Array; source: File | Blob }>();

  // A/B それぞれの世代トークン。最新の値と一致する結果だけを state に反映する
  let generationA = 0;
  let generationB = 0;

  // 直近にデコードを開始した対象。同一対象での無駄な再デコードを防ぐ
  let lastTargetA: { key: string; source: File | Blob } | null = null;
  let lastTargetB: { key: string; source: File | Blob } | null = null;

  let visible = $derived(appState.compareA !== null || appState.compareB !== null);

  let labelA = $derived(getLabel(appState.compareA));
  let labelB = $derived(getLabel(appState.compareB));

  function getLabel(sel: CompareSelection | null): string {
    if (!sel) return "";
    if (sel.type === "input") {
      const entry = appState.files.find((f) => f.id === sel.id);
      return entry ? entry.file.name : "(不明)";
    } else {
      const entry = appState.outputFiles.find((f) => f.id === sel.id);
      return entry ? entry.outputName : "(不明)";
    }
  }

  function getCacheKey(sel: CompareSelection): string {
    return `${sel.type}:${sel.id}`;
  }

  function getAudioSource(sel: CompareSelection): File | Blob | null {
    if (sel.type === "input") {
      const entry = appState.files.find((f) => f.id === sel.id);
      return entry?.sourceFile ?? null;
    } else {
      const entry = appState.outputFiles.find((f) => f.id === sel.id);
      if (!entry || entry.status !== "completed" || !entry.resultBlob) return null;
      return entry.resultBlob;
    }
  }

  // 非表示タブでは requestAnimationFrame が発火しないため、
  // タイマーと競争させて必ず再開できるようにする（これが無いと
  // 抽出中にタブを切り替えたまま戻らないと「デコード中...」で止まる）
  function nextFrame(): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      requestAnimationFrame(finish);
      setTimeout(finish, 50);
    });
  }

  // 列単位でチャンク分割し、一定時間ごとに yield してメインスレッドを解放する
  // isCurrent が false になったら計算を打ち切って null を返す
  async function extractPeaks(
    buffer: AudioBuffer,
    targetWidth: number,
    isCurrent: () => boolean,
  ): Promise<Float32Array | null> {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const peaks = new Float32Array(targetWidth * 2);
    const channels: Float32Array[] = [];
    for (let ch = 0; ch < numChannels; ch++) {
      channels.push(buffer.getChannelData(ch));
    }

    const samplesPerPixel = length / targetWidth;
    let chunkStartTime = performance.now();

    for (let col = 0; col < targetWidth; col++) {
      if (col > 0 && col % CHUNK_COLUMNS === 0 && performance.now() - chunkStartTime >= YIELD_INTERVAL_MS) {
        await nextFrame();
        if (!isCurrent()) return null;
        chunkStartTime = performance.now();
      }

      const startSample = Math.floor(col * samplesPerPixel);
      const endSample = Math.min(Math.floor((col + 1) * samplesPerPixel), length);

      let min = 1.0;
      let max = -1.0;

      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = channels[ch];
        for (let s = startSample; s < endSample; s++) {
          const sample = channelData[s];
          if (sample < min) min = sample;
          if (sample > max) max = sample;
        }
      }

      if (min > max) {
        min = 0;
        max = 0;
      }

      peaks[col * 2] = min;
      peaks[col * 2 + 1] = max;
    }

    // サンプル値は -1.0〜1.0（0dBFS = 1.0）なのでそのまま返す
    // これにより Canvas 上下端 = 0dBFS となり、音量差が視覚的に反映される
    return peaks;
  }

  function getCachedPeaks(key: string, source: File | Blob): Float32Array | null {
    const cached = peakCache.get(key);
    // ソース参照が同じならキャッシュを使う（再処理で Blob が変わったら無効化）
    if (!cached || cached.source !== source) return null;
    // 参照されたら末尾へ移して最近使ったものとして扱う
    peakCache.delete(key);
    peakCache.set(key, cached);
    return cached.peaks;
  }

  function storePeaks(key: string, source: File | Blob, peaks: Float32Array) {
    peakCache.delete(key);
    peakCache.set(key, { peaks, source });
    while (peakCache.size > PEAK_CACHE_LIMIT) {
      const oldest = peakCache.keys().next();
      if (oldest.done) break;
      peakCache.delete(oldest.value);
    }
  }

  async function decodePeaks(
    sel: CompareSelection,
    source: File | Blob,
    isCurrent: () => boolean,
  ): Promise<Float32Array | null> {
    const key = getCacheKey(sel);
    const hit = getCachedPeaks(key, source);
    if (hit) return hit;

    try {
      const arrayBuffer = await source.arrayBuffer();
      if (!isCurrent()) return null;

      const audioBuffer = await getSharedAudioContext().decodeAudioData(arrayBuffer);
      if (!isCurrent()) return null;

      const peaks = await extractPeaks(audioBuffer, TARGET_WIDTH, isCurrent);
      if (!peaks) return null;

      storePeaks(key, source, peaks);
      return peaks;
    } catch {
      return null;
    }
  }

  function drawWaveform(
    canvas: HTMLCanvasElement,
    peaks: Float32Array,
    color: string,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // canvas の実ピクセル数を「表示幅 × devicePixelRatio」に合わせる。
    // 固定 800px を CSS で引き伸ばしていたため、Retina でなくても
    // レイアウト幅（実測 1216px）まで補間されてぼやけていた。
    // 座標系は TARGET_WIDTH × CANVAS_HEIGHT のまま使えるよう transform で伸ばす。
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cssWidth = Math.max(Math.round(canvas.getBoundingClientRect().width), 1);
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(CANVAS_HEIGHT * dpr);
    ctx.setTransform(canvas.width / TARGET_WIDTH, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, TARGET_WIDTH, CANVAS_HEIGHT);

    const centerY = CANVAS_HEIGHT / 2;

    ctx.strokeStyle = "#3f3f36";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(TARGET_WIDTH, centerY);
    ctx.stroke();

    ctx.fillStyle = color;
    const halfHeight = CANVAS_HEIGHT / 2;

    for (let col = 0; col < TARGET_WIDTH; col++) {
      const min = peaks[col * 2];
      const max = peaks[col * 2 + 1];

      const yTop = centerY - max * halfHeight;
      const yBottom = centerY - min * halfHeight;
      const height = yBottom - yTop;

      if (height > 0) {
        ctx.fillRect(col, yTop, 1, height);
      }
    }
  }

  // Decode A when selection or source changes
  $effect(() => {
    const sel = appState.compareA;
    if (!sel) {
      generationA++;
      lastTargetA = null;
      peaksA = null;
      return;
    }
    const source = getAudioSource(sel);
    if (!source) {
      generationA++;
      lastTargetA = null;
      peaksA = null;
      return;
    }
    const key = getCacheKey(sel);
    // files / outputFiles の配列が作り直されただけなら再デコードしない
    // （そのままだと進行中のデコードが毎回打ち切られてやり直しになる）
    if (lastTargetA && lastTargetA.key === key && lastTargetA.source === source) {
      return;
    }
    lastTargetA = { key, source };

    const cached = getCachedPeaks(key, source);
    if (cached) {
      generationA++;
      peaksA = cached;
      return;
    }
    // 対象が変わったので古い波形は消す（新しいラベルの下に前のファイルの波形を残さない）
    peaksA = null;

    const generation = ++generationA;
    const isCurrent = () => generationA === generation;
    decodePeaks(sel, source, isCurrent).then((p) => {
      // 途中で選択が変わっていたら古い結果を捨てる（後勝ち）
      if (!isCurrent()) return;
      peaksA = p;
    });
  });

  // Decode B when selection or source changes
  $effect(() => {
    const sel = appState.compareB;
    if (!sel) {
      generationB++;
      lastTargetB = null;
      peaksB = null;
      return;
    }
    const source = getAudioSource(sel);
    if (!source) {
      generationB++;
      lastTargetB = null;
      peaksB = null;
      return;
    }
    const key = getCacheKey(sel);
    if (lastTargetB && lastTargetB.key === key && lastTargetB.source === source) {
      return;
    }
    lastTargetB = { key, source };

    const cached = getCachedPeaks(key, source);
    if (cached) {
      generationB++;
      peaksB = cached;
      return;
    }
    peaksB = null;

    const generation = ++generationB;
    const isCurrent = () => generationB === generation;
    decodePeaks(sel, source, isCurrent).then((p) => {
      if (!isCurrent()) return;
      peaksB = p;
    });
  });

  function drawA() {
    if (canvasA && peaksA) drawWaveform(canvasA, peaksA, "#a3a825");
  }

  function drawB() {
    if (canvasB && peaksB) drawWaveform(canvasB, peaksB, "#22c55e");
  }

  // canvas の実ピクセル数を表示幅から決めているので、幅が変わったら描き直す。
  // ピークは再計算しないので、リサイズのコストは描画だけ。
  function watchWidth(el: HTMLElement) {
    if (typeof ResizeObserver === "undefined") return;
    let last = el.clientWidth;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth === last) return;
      last = el.clientWidth;
      drawA();
      drawB();
    });
    ro.observe(el);
    return { destroy: () => ro.disconnect() };
  }

  // Draw A when peaks or canvas change
  $effect(drawA);

  // Draw B when peaks or canvas change
  $effect(drawB);

  function clearA() {
    appState.compareA = null;
  }

  function clearB() {
    appState.compareB = null;
  }
</script>

{#if visible}
  <div class="waveform-comparison" use:watchWidth>
    <div class="comparison-header">
      <span class="comparison-title">波形比較</span>
    </div>

    {#if appState.compareA}
      <div class="waveform-row">
        <div class="waveform-label-row">
          <span class="badge badge-a">A</span>
          <span class="waveform-filename" title={labelA}>{labelA}</span>
          <button class="clear-btn" onclick={clearA} title="クリア">&times;</button>
        </div>
        <div class="canvas-wrapper">
          {#if peaksA}
            <canvas bind:this={canvasA}></canvas>
          {:else}
            <div class="canvas-placeholder">デコード中...</div>
          {/if}
        </div>
      </div>
    {/if}

    {#if appState.compareB}
      <div class="waveform-row">
        <div class="waveform-label-row">
          <span class="badge badge-b">B</span>
          <span class="waveform-filename" title={labelB}>{labelB}</span>
          <button class="clear-btn" onclick={clearB} title="クリア">&times;</button>
        </div>
        <div class="canvas-wrapper">
          {#if peaksB}
            <canvas bind:this={canvasB}></canvas>
          {:else}
            <div class="canvas-placeholder">デコード中...</div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .waveform-comparison {
    background: #111110;
    border: 1px solid #2d2d26;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .comparison-header {
    display: flex;
    align-items: center;
  }

  .comparison-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: #a3a3a3;
  }

  .waveform-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .waveform-label-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 4px;
    line-height: 1.4;
    flex-shrink: 0;
  }

  .badge-a {
    background: #a3a82522;
    color: #a3a825;
    border: 1px solid #a3a82544;
  }

  .badge-b {
    background: #22c55e22;
    color: #22c55e;
    border: 1px solid #22c55e44;
  }

  .waveform-filename {
    font-size: 0.8rem;
    color: #e4e4e7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .clear-btn {
    background: none;
    border: none;
    color: #737373;
    font-size: 1rem;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 4px;
    box-shadow: none;
    line-height: 1;
    flex-shrink: 0;
  }

  .clear-btn:hover {
    color: #ef4444;
    background: #ef444422;
  }

  .canvas-wrapper {
    background: #1a1a16;
    border: 1px solid #2d2d26;
    border-radius: 6px;
    overflow: hidden;
    height: 80px;
  }

  .canvas-wrapper canvas {
    display: block;
    width: 100%;
    height: 80px;
  }

  .canvas-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 0.75rem;
    color: #737373;
  }
</style>
