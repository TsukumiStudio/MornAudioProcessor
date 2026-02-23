<script lang="ts">
  import { onMount } from "svelte";
  import { initFFmpeg, getAudioInfo } from "$lib/commands";
  import { base } from "$app/paths";
  import { getAppState } from "$lib/stores.svelte";
  import type { FileEntry, AudioFileInfo } from "$lib/types";
  import { processFile, downloadBlob, resetFFmpeg } from "$lib/commands";
  import type { ProcessingOptions, AudioFormat, MetadataSettings } from "$lib/types";
  import { getFileExtension, replaceExtension } from "$lib/utils";
  import WaveformComparison from "../components/WaveformComparison.svelte";
  import FileDropZone from "../components/FileDropZone.svelte";
  import FileList from "../components/FileList.svelte";
  import ProcessingForm from "../components/ProcessingForm.svelte";

  const appState = getAppState();
  const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".ogg", ".flac"];
  let loadingMessage = $state("ffmpeg.wasm を読み込み中...");

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

  function makePlaceholderInfo(name: string): AudioFileInfo {
    return {
      name, duration_ms: 0, format: "", bitrate: null, sample_rate: null,
      channels: null, bit_depth: null, peak_db: null, rms_db: null, lufs: null,
      metadata: {}, albumArtUrl: null,
    };
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    appState.isDragging = false;
    if (e.dataTransfer?.files && appState.ffmpegInfo) {
      for (const file of Array.from(e.dataTransfer.files)) {
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;

        const existing = appState.files.find((f) => f.file.name === file.name);
        const entryId = existing?.id ?? crypto.randomUUID();

        if (existing) {
          appState.updateFile(entryId, { status: "loading", progress: 0 });
        } else {
          appState.addFile({
            id: entryId,
            file: makePlaceholderInfo(file.name),
            sourceFile: file,
            status: "loading",
            progress: 0,
          });
        }

        try {
          const info = await getAudioInfo(file);
          appState.updateFile(entryId, { file: info, sourceFile: file, status: "pending", progress: 0 });
        } catch (e) {
          console.error(`ファイル情報取得失敗: ${file.name}`, e);
          appState.updateFile(entryId, { status: "error", error: String(e) });
        }
      }
    }
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

  async function startProcessing() {
    if (appState.files.length === 0) return;
    appState.isProcessing = true;

    await resetFFmpeg();

    appState.files = appState.files.map((f) => ({
      ...f,
      status: "pending" as const,
      progress: 0,
    }));

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
        frequency_filter: appState.frequencyFilter ?? undefined,
        dynamics_filter: appState.dynamicsFilter ?? undefined,
        effect_filter: appState.effectFilter ?? undefined,
        channel_filter: appState.channelFilter ?? undefined,
        input_sample_rate: entry.file.sample_rate ? parseInt(entry.file.sample_rate, 10) : undefined,
        frequency_filter_ext: appState.frequencyFilterExt ?? undefined,
        dynamics_filter_ext: appState.dynamicsFilterExt ?? undefined,
        effect_filter_ext: appState.effectFilterExt ?? undefined,
        repair_filter: appState.repairFilter ?? undefined,
        stereo_filter: appState.stereoFilter ?? undefined,
        bit_depth: appState.bitDepth || undefined,
        ogg_quality: appState.oggQuality,
        metadata: resolveMetadataForFile(entry.id, appState.metadataSettings),
        album_art: appState.albumArtMap[entry.id] ?? appState.albumArt ?? undefined,
      };

      const result = await processFile(options, (progress) => {
        appState.updateFileProgress(
          progress.file_name,
          progress.percentage,
          progress.status === "completed" ? "completed" : "processing",
        );
      });

      if (result.success && result.blob) {
        appState.updateFileProgress(entry.file.name, 100, "completed");
        appState.addOutputResult(outputName, result.blob, result.outputInfo ?? null);
      } else if (result.error) {
        appState.updateFileProgress(entry.file.name, 0, "error");
        appState.addOutputError(outputName, result.error);
      }
    }

    appState.isProcessing = false;
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

  {#if appState.ffmpegInfo}
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
        <button
          class="start-btn"
          onclick={startProcessing}
          disabled={appState.files.length === 0 || appState.isProcessing}
        >
          {#if appState.isProcessing}
            処理中...
          {:else}
            処理開始
          {/if}
        </button>
      </div>
      <ProcessingForm />
    </div>
  {:else if appState.ffmpegError}
    <div class="error-container">
      <p>ffmpeg.wasm の読み込みに失敗しました。ページを再読み込みしてください。</p>
    </div>
  {:else}
    <div class="loading">
      <p>{loadingMessage}</p>
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

  .loading {
    text-align: center;
    padding: 40px;
    color: #737373;
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
