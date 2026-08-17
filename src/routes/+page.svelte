<script lang="ts">
  import { onMount } from "svelte";
  import { initFFmpeg } from "$lib/commands";
  import { base } from "$app/paths";
  import { getAppState } from "$lib/stores.svelte";
  import { ingestFiles } from "$lib/file-intake";
  import {
    cancelProcessing,
    processFiles,
    resetFFmpeg,
    type ProcessingJob,
  } from "$lib/commands";
  import type { ProcessingOptions, AudioFormat, MetadataSettings } from "$lib/types";
  import { getFileExtension, replaceExtension } from "$lib/utils";
  import WaveformComparison from "../components/WaveformComparison.svelte";
  import FileDropZone from "../components/FileDropZone.svelte";
  import FileList from "../components/FileList.svelte";
  import ProcessingForm from "../components/ProcessingForm.svelte";

  const appState = getAppState();
  let loadingMessage = $state("ffmpeg.wasm を読み込み中...");
  let processingError = $state<string | null>(null);
  let cancelling = $state(false);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    appState.isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    // ウィンドウ外に出た時のみ解除
    if (
      e.relatedTarget === null ||
      !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)
    ) {
      appState.isDragging = false;
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    appState.isDragging = false;
    // エラー画面ではリストが非表示なので、受け付けると見えないエントリが積まれる
    if (appState.ffmpegError) return;
    // コア読み込み中でも受け付ける（解析は ingestFiles 側で完了を待つ）
    if (e.dataTransfer?.files) ingestFiles(e.dataTransfer.files);
  }

  function buildOutputName(inputName: string): string {
    if (appState.outputFormat !== "same") {
      return replaceExtension(inputName, appState.outputFormat);
    } else {
      const ext = getFileExtension(inputName);
      const base = inputName.substring(0, inputName.length - ext.length - 1);
      return `${base}_processed.${ext}`;
    }
  }

  function resolveMetadataForFile(
    fileId: string,
    settings: MetadataSettings | null,
  ): Record<string, string> | undefined {
    if (!settings) return undefined;
    const result: Record<string, string> = {};
    let hasValue = false;
    for (const [key, field] of Object.entries(settings)) {
      if (field.mode === "bulk") {
        const v = field.bulkValue.trim();
        if (v) {
          result[key] = v;
          hasValue = true;
        }
      } else if (field.mode === "individual") {
        const v = field.individualValues[fileId]?.trim();
        if (v) {
          result[key] = v;
          hasValue = true;
        }
      }
    }
    return hasValue ? result : undefined;
  }

  function resetSettings() {
    appState.resetSettings();
  }

  // 解析が終わっていないファイルがあると input_sample_rate が未確定で、
  // LUFS 正規化のサンプルレート復元などが効かないため処理を待たせる
  let isAnalyzing = $derived(appState.files.some((f) => f.status === "loading"));
  let canStart = $derived(
    appState.files.length > 0 &&
      !appState.isProcessing &&
      !isAnalyzing &&
      appState.ffmpegInfo !== null,
  );

  async function startProcessing() {
    if (!canStart) return;
    processingError = null;
    cancelling = false;
    appState.isProcessing = true;
    try {
      await runProcessing();
    } catch (e) {
      // コア再ロード失敗などループ外の例外を握り潰さない
      console.error("処理に失敗しました", e);
      processingError = String(e);
    } finally {
      // 例外が出てもボタンが永久に無効化されないようにする
      appState.isProcessing = false;
      cancelling = false;
    }
  }

  function requestCancel() {
    cancelling = true;
    cancelProcessing();
  }

  async function runProcessing() {
    await resetFFmpeg();

    for (const entry of appState.files) {
      entry.status = "pending";
      entry.progress = 0;
    }

    // 「高度な機能」が OFF のときは詳細タブの設定を一切適用しない。
    // UI 上どこからも確認できない設定が効き続けるのを防ぐため。
    const advanced = appState.showAdvanced;

    const jobs: ProcessingJob[] = [];
    const outputNames: string[] = [];
    const inputNames: string[] = [];

    for (const entry of appState.files) {
      const outputName = buildOutputName(entry.file.name);
      const options: ProcessingOptions = {
        input_file: entry.sourceFile,
        output_name: outputName,
        output_format:
          appState.outputFormat === "same"
            ? undefined
            : (appState.outputFormat as AudioFormat),
        volume: appState.volume ?? undefined,
        trim: appState.trim ?? undefined,
        bitrate: appState.bitrate || undefined,
        sample_rate: appState.sampleRate ?? undefined,
        silence_remove: appState.silenceRemove ?? undefined,
        noise_reduce: appState.noiseReduce ?? undefined,
        input_sample_rate: entry.file.sample_rate ? parseInt(entry.file.sample_rate, 10) : undefined,
        input_bit_depth: entry.file.bit_depth ?? undefined,
        bit_depth: appState.bitDepth || undefined,
        ogg_quality: appState.oggQuality,
        // --- ここから下は詳細タブ（高度な機能）の設定 ---
        frequency_filter: (advanced ? appState.frequencyFilter : null) ?? undefined,
        dynamics_filter: (advanced ? appState.dynamicsFilter : null) ?? undefined,
        effect_filter: (advanced ? appState.effectFilter : null) ?? undefined,
        channel_filter: (advanced ? appState.channelFilter : null) ?? undefined,
        frequency_filter_ext: (advanced ? appState.frequencyFilterExt : null) ?? undefined,
        dynamics_filter_ext: (advanced ? appState.dynamicsFilterExt : null) ?? undefined,
        effect_filter_ext: (advanced ? appState.effectFilterExt : null) ?? undefined,
        repair_filter: (advanced ? appState.repairFilter : null) ?? undefined,
        stereo_filter: (advanced ? appState.stereoFilter : null) ?? undefined,
        metadata: advanced
          ? resolveMetadataForFile(entry.id, appState.metadataSettings)
          : undefined,
        album_art: advanced
          ? (appState.albumArtMap[entry.id] ?? appState.albumArt ?? undefined)
          : undefined,
      };

      jobs.push({
        options,
        durationMs: entry.file.duration_ms || null,
        sampleRate: entry.file.sample_rate
          ? parseInt(entry.file.sample_rate, 10)
          : null,
        channels: entry.file.channels,
      });
      outputNames.push(outputName);
      inputNames.push(entry.file.name);
    }

    await processFiles(
      jobs,
      (progress) => {
        appState.updateFileProgress(
          progress.file_name,
          progress.percentage,
          progress.status === "completed" ? "completed" : "processing",
        );
      },
      (result, index) => {
        const outputName = outputNames[index];
        const inputName = inputNames[index];
        if (result.success && result.blob) {
          appState.updateFileProgress(inputName, 100, "completed");
          appState.addOutputResult(outputName, result.blob, result.outputInfo ?? null);
        } else if (result.cancelled) {
          // 中止はエラーではないので、やり直せるよう pending に戻す
          appState.updateFileProgress(inputName, 0, "pending");
        } else {
          // error が空でも processing のまま固まらせない
          appState.updateFileProgress(inputName, 0, "error");
          appState.addOutputError(outputName, result.error || "不明なエラー");
        }
      },
    );
  }

  onMount(async () => {
    try {
      loadingMessage = "コアファイルをダウンロード中...";
      appState.ffmpegInfo = await initFFmpeg((msg) => {
        loadingMessage = msg;
      });
    } catch (e: unknown) {
      appState.ffmpegError = String(e);
    }
  });
</script>

<main
  class="app"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
>
  <header>
    <div class="header-title">
      <img src="{base}/icon.png" alt="MornAudioProcessor" class="header-icon" />
      <h1>MornAudioProcessor</h1>
      <span class="version">v{__APP_VERSION__}</span>
    </div>
    <a class="studio-link" href="https://tsukumistudio.com/" target="_blank" rel="noopener noreferrer">
      <img src="{base}/tsukumi-logo.png" alt="TSUKUMI STUDIO" class="studio-icon" />
      <span class="studio-name">TSUKUMI STUDIO</span>
    </a>
  </header>

  <div class="privacy-notice">
    <p>
      すべての音声処理はお使いのブラウザ上で完結します。ファイルがサーバーにアップロード・保存されることはありません。
      ソースコードは
      <a href="https://github.com/TsukumiStudio/MornAudioProcessor" target="_blank" rel="noopener noreferrer">
        GitHub
      </a>
      で完全に公開されています。
    </p>
  </div>

  {#if appState.ffmpegError}
    <div class="error-container">
      <p>ffmpeg.wasm の読み込みに失敗しました。ページを再読み込みしてください。</p>
    </div>
  {:else}
    <!-- コアの読み込み完了を待たずに UI を出す。読み込み中でもファイル投入と設定は可能 -->
    {#if !appState.ffmpegInfo}
      <div class="core-loading">
        <span class="spinner"></span>
        <p>{loadingMessage}（このまま設定やファイル追加ができます）</p>
      </div>
    {/if}
    {#if processingError}
      <div class="processing-error">
        <p>処理を中断しました: {processingError}</p>
      </div>
    {/if}
    <div class="content">
      <WaveformComparison />
      <FileDropZone />
      <FileList />
      <div class="action-bar">
        <button
          class="reset-btn"
          onclick={resetSettings}
          disabled={appState.isProcessing}
        >
          処理設定をリセット
        </button>
        {#if appState.isProcessing}
          <button class="cancel-btn" onclick={requestCancel} disabled={cancelling}>
            {cancelling ? "中止しています..." : "中止"}
          </button>
        {/if}
        <button class="start-btn" onclick={startProcessing} disabled={!canStart}>
          {#if appState.isProcessing}
            処理中...
          {:else if !appState.ffmpegInfo}
            コア読み込み中...
          {:else if isAnalyzing}
            解析中...
          {:else}
            処理開始
          {/if}
        </button>
      </div>
      <ProcessingForm />
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      sans-serif;
    background: #111110;
    color: #e4e4e7;
  }

  .app {
    max-width: 1300px;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-height: 100vh;
    box-sizing: border-box;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid #28281f;
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .studio-link {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: #a3a3a3;
    transition: color 0.15s;
  }
  .studio-link:hover {
    color: #e4e4e7;
  }
  .studio-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
  }
  .studio-name {
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .header-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
  }

  .version {
    font-size: 0.7rem;
    color: #737373;
    align-self: flex-end;
    margin-bottom: 2px;
  }

  h1 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
    background: linear-gradient(135deg, #a3a825, #c5c94b);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .privacy-notice {
    background: #1c1c17;
    border: 1px solid #28281f;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 0.8rem;
    color: #a3a3a3;
    line-height: 1.5;
  }
  .privacy-notice p {
    margin: 0;
  }
  .privacy-notice a {
    color: #c5c94b;
    text-decoration: none;
  }
  .privacy-notice a:hover {
    text-decoration: underline;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .error-container {
    text-align: center;
    padding: 40px;
    color: #a3a3a3;
  }

  .processing-error {
    background: #2a1c1c;
    border: 1px solid #5a2b2b;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 0.8rem;
    color: #f0a3a3;
  }
  .processing-error p {
    margin: 0;
  }

  .core-loading {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #1c1c17;
    border: 1px solid #28281f;
    border-radius: 8px;
    padding: 10px 16px;
    font-size: 0.8rem;
    color: #a3a3a3;
  }
  .core-loading p {
    margin: 0;
  }
  .spinner {
    width: 14px;
    height: 14px;
    flex: none;
    border: 2px solid #3f3f36;
    border-top-color: #a3a825;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .action-bar {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
  }
  .reset-btn {
    padding: 10px 20px;
    border-radius: 8px;
    border: 1px solid #3f3f36;
    background: #28281f;
    color: #a3a3a3;
    font-size: 0.9rem;
    cursor: pointer;
    box-shadow: none;
  }
  .reset-btn:hover:not(:disabled) {
    background: #3f3f36;
    color: #e4e4e7;
  }
  .reset-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .cancel-btn {
    padding: 10px 20px;
    border-radius: 8px;
    border: 1px solid #5a2b2b;
    background: #2a1c1c;
    color: #f0a3a3;
    font-size: 0.9rem;
    cursor: pointer;
    box-shadow: none;
  }
  .cancel-btn:hover:not(:disabled) {
    background: #3a2424;
    color: #ffc9c9;
  }
  .cancel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .start-btn {
    padding: 10px 32px;
    border-radius: 8px;
    border: none;
    background: #a3a825;
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: none;
  }
  .start-btn:hover:not(:disabled) {
    background: #8a8c2a;
  }
  .start-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
