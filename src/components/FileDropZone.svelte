<script lang="ts">
  import { open } from "@tauri-apps/plugin-dialog";
  import { getAudioInfo } from "$lib/commands";
  import { getAppState } from "$lib/stores.svelte";
  import type { FileEntry } from "$lib/types";

  const appState = getAppState();

  const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".ogg"];

  export async function addFiles(paths: string[]) {
    for (const path of paths) {
      const ext = path.substring(path.lastIndexOf(".")).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;
      if (appState.files.some((f) => f.file.path === path)) continue;

      try {
        const info = await getAudioInfo(path);
        const entry: FileEntry = {
          id: crypto.randomUUID(),
          file: info,
          status: "pending",
          progress: 0,
        };
        appState.addFile(entry);
      } catch (e) {
        console.error(`ファイル情報取得失敗: ${path}`, e);
      }
    }
  }

  async function openFileDialog() {
    const selected = await open({
      multiple: true,
      filters: [
        {
          name: "Audio",
          extensions: ["mp3", "wav", "ogg"],
        },
      ],
    });
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      await addFiles(paths);
    }
  }
</script>

<div
  class="dropzone"
  class:drag-over={appState.isDragging}
  role="button"
  tabindex="0"
  onclick={openFileDialog}
  onkeydown={(e) => {
    if (e.key === "Enter" || e.key === " ") openFileDialog();
  }}
>
  <div class="dropzone-content">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
    {#if appState.isDragging}
      <p class="main-text">ここにドロップ</p>
    {:else}
      <p class="main-text">ドラッグ&ドロップ または クリックしてファイルを選択</p>
    {/if}
    <p class="sub-text">対応形式: MP3, WAV, OGG</p>
  </div>
</div>

<style>
  .dropzone {
    border: 2px dashed #404040;
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: #1a1a16;
  }
  .dropzone:hover,
  .dropzone.drag-over {
    border-color: #a3a825;
    background: #1a1c0f;
  }
  .dropzone-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #a3a3a3;
  }
  .main-text {
    font-size: 1rem;
    font-weight: 500;
    color: #d4d4d8;
    margin: 0;
  }
  .sub-text {
    font-size: 0.8rem;
    color: #737373;
    margin: 0;
  }
</style>
