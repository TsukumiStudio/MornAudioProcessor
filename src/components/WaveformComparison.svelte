<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { CompareSelection } from "$lib/types";

  const appState = getAppState();

  const TARGET_WIDTH = 800;
  const CANVAS_HEIGHT = 80;

  let canvasA: HTMLCanvasElement | undefined = $state();
  let canvasB: HTMLCanvasElement | undefined = $state();

  let peaksA = $state<Float32Array | null>(null);
  let peaksB = $state<Float32Array | null>(null);

  // キー → { peaks, source参照 } でキャッシュ（source が変わったら無効化）
  const peakCache = new Map<string, { peaks: Float32Array; source: File | Blob }>();

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

  function extractPeaks(buffer: AudioBuffer, targetWidth: number): Float32Array {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length;
    const peaks = new Float32Array(targetWidth * 2);

    const samplesPerPixel = length / targetWidth;

    for (let col = 0; col < targetWidth; col++) {
      const startSample = Math.floor(col * samplesPerPixel);
      const endSample = Math.min(Math.floor((col + 1) * samplesPerPixel), length);

      let min = 1.0;
      let max = -1.0;

      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = buffer.getChannelData(ch);
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

  async function decodePeaks(sel: CompareSelection, source: File | Blob): Promise<Float32Array | null> {
    const key = getCacheKey(sel);
    const cached = peakCache.get(key);
    // ソース参照が同じならキャッシュを使う（再処理で Blob が変わったら無効化）
    if (cached && cached.source === source) return cached.peaks;

    const arrayBuffer = await source.arrayBuffer();

    try {
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const peaks = extractPeaks(audioBuffer, TARGET_WIDTH);
      await audioCtx.close();
      peakCache.set(key, { peaks, source });
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

    canvas.width = TARGET_WIDTH;
    canvas.height = CANVAS_HEIGHT;

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
      peaksA = null;
      return;
    }
    const source = getAudioSource(sel);
    if (!source) {
      peaksA = null;
      return;
    }
    decodePeaks(sel, source).then((p) => {
      peaksA = p;
    });
  });

  // Decode B when selection or source changes
  $effect(() => {
    const sel = appState.compareB;
    if (!sel) {
      peaksB = null;
      return;
    }
    const source = getAudioSource(sel);
    if (!source) {
      peaksB = null;
      return;
    }
    decodePeaks(sel, source).then((p) => {
      peaksB = p;
    });
  });

  // Draw A when peaks or canvas change
  $effect(() => {
    if (canvasA && peaksA) {
      drawWaveform(canvasA, peaksA, "#a3a825");
    }
  });

  // Draw B when peaks or canvas change
  $effect(() => {
    if (canvasB && peaksB) {
      drawWaveform(canvasB, peaksB, "#22c55e");
    }
  });

  function clearA() {
    appState.compareA = null;
  }

  function clearB() {
    appState.compareB = null;
  }
</script>

{#if visible}
  <div class="waveform-comparison">
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
