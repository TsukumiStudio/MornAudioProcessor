<script lang="ts">
  import { onMount } from "svelte";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { checkFfmpeg, getAudioInfo } from "$lib/commands";
  import { getAppState } from "$lib/stores.svelte";
  import type { FileEntry } from "$lib/types";
  import FfmpegStatus from "../components/FfmpegStatus.svelte";
  import FileDropZone from "../components/FileDropZone.svelte";
  import FileList from "../components/FileList.svelte";
  import ProcessingForm from "../components/ProcessingForm.svelte";
  import ProgressPanel from "../components/ProgressPanel.svelte";

  const state = getAppState();
  const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".ogg"];

  async function handleDroppedFiles(paths: string[]) {
    for (const path of paths) {
      const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;
      if (state.files.some((f) => f.file.path === path)) continue;

      try {
        const info = await getAudioInfo(path);
        const entry: FileEntry = {
          id: crypto.randomUUID(),
          file: info,
          status: "pending",
          progress: 0,
        };
        state.addFile(entry);
      } catch (e) {
        console.error(`ファイル情報取得失敗: ${path}`, e);
      }
    }
  }

  onMount(async () => {
    try {
      state.ffmpegInfo = await checkFfmpeg();
    } catch (e: unknown) {
      state.ffmpegError = String(e);
    }

    // Tauri ネイティブ drag-drop イベント
    const unlisten = await getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type === "over") {
        state.isDragging = true;
      } else if (event.payload.type === "drop") {
        state.isDragging = false;
        if (state.ffmpegInfo) {
          handleDroppedFiles(event.payload.paths);
        }
      } else {
        // cancel
        state.isDragging = false;
      }
    });

    return () => {
      unlisten();
    };
  });
</script>

<main class="app">
  <header>
    <div class="header-title">
      <img src="/icon.png" alt="MornAudioProcessor" class="header-icon" />
      <h1>MornAudioProcessor</h1>
    </div>
    <FfmpegStatus info={state.ffmpegInfo} error={state.ffmpegError} />
  </header>

  {#if state.ffmpegInfo}
    <div class="content">
      <FileDropZone />
      <FileList />
      <ProcessingForm />
      <ProgressPanel />
    </div>
  {:else if state.ffmpegError}
    <div class="error-container">
      <p>ffmpegがインストールされていません。上記のガイドに従ってインストールしてください。</p>
    </div>
  {:else}
    <div class="loading">
      <p>読み込み中...</p>
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
