<script lang="ts">
  import { onMount } from "svelte";
  import { initFFmpeg, getAudioInfo } from "$lib/commands";
  import { base } from "$app/paths";
  import { getAppState } from "$lib/stores.svelte";
  import type { FileEntry } from "$lib/types";
  import FfmpegStatus from "../components/FfmpegStatus.svelte";
  import FileDropZone from "../components/FileDropZone.svelte";
  import FileList from "../components/FileList.svelte";
  import ProcessingForm from "../components/ProcessingForm.svelte";

  const appState = getAppState();
  const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".ogg"];
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

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    appState.isDragging = false;
    if (e.dataTransfer?.files && appState.ffmpegInfo) {
      for (const file of Array.from(e.dataTransfer.files)) {
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;
        if (appState.files.some((f) => f.file.name === file.name)) continue;
        try {
          const info = await getAudioInfo(file);
          const entry: FileEntry = {
            id: crypto.randomUUID(),
            file: info,
            sourceFile: file,
            status: "pending",
            progress: 0,
          };
          appState.addFile(entry);
        } catch (e) {
          console.error(`ファイル情報取得失敗: ${file.name}`, e);
        }
      }
    }
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
    {#if !appState.ffmpegInfo}
      <FfmpegStatus info={appState.ffmpegInfo} error={appState.ffmpegError} />
    {/if}
  </header>

  {#if appState.ffmpegInfo}
    <div class="content">
      <FileDropZone />
      <FileList />
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
    max-width: 860px;
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
</style>
