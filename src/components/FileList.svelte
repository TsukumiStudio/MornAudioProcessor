<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import { downloadBlob } from "$lib/commands";
  import FileListItem from "./FileListItem.svelte";
  import OutputFileItem from "./OutputFileItem.svelte";

  const state = getAppState();

  function downloadAll() {
    for (const entry of state.outputFiles) {
      if (entry.resultBlob) {
        downloadBlob(entry.resultBlob, entry.outputName);
      }
    }
  }
</script>

{#if state.files.length > 0 || state.outputFiles.length > 0}
  <div class="file-panels">
    <div class="panel">
      <div class="panel-header">
        <h3>入力ファイル ({state.files.length})</h3>
        {#if state.files.length > 0}
          <button
            class="panel-btn clear-btn"
            onclick={() => state.clearInputFiles()}
            disabled={state.isProcessing}
          >
            リストをクリア
          </button>
        {/if}
      </div>
      <div class="panel-items">
        {#if state.files.length > 0}
          {#each state.files as entry (entry.id)}
            <FileListItem
              {entry}
              onRemove={(id) => state.removeFile(id)}
              disabled={state.isProcessing}
            />
          {/each}
        {:else}
          <div class="placeholder">
            ファイルをドラッグ＆ドロップまたはクリックで追加
          </div>
        {/if}
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h3>出力ファイル ({state.outputFiles.length})</h3>
        <div class="panel-header-actions">
          {#if state.outputFiles.some((f) => f.resultBlob)}
            <button class="panel-btn download-btn" onclick={downloadAll}>
              全てダウンロード
            </button>
          {/if}
          {#if state.outputFiles.length > 0}
            <button
              class="panel-btn clear-btn"
              onclick={() => state.clearOutputFiles()}
              disabled={state.isProcessing}
            >
              リストをクリア
            </button>
          {/if}
        </div>
      </div>
      <div class="panel-items">
        {#if state.outputFiles.length > 0}
          {#each state.outputFiles as entry (entry.id)}
            <OutputFileItem {entry} />
          {/each}
        {:else}
          <div class="placeholder">
            処理を開始すると変換結果が表示されます
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .file-panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .panel-header-actions {
    display: flex;
    gap: 6px;
  }
  .panel-header h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #a3a3a3;
  }
  .panel-btn {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
    box-shadow: none;
  }
  .panel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .clear-btn {
    border: 1px solid #3f3f36;
    background: #28281f;
    color: #a3a3a3;
  }
  .clear-btn:hover:not(:disabled) {
    background: #3f3f36;
    color: #e4e4e7;
  }
  .download-btn {
    border: 1px solid #22c55e33;
    background: #22c55e22;
    color: #22c55e;
    font-weight: 600;
  }
  .download-btn:hover {
    background: #22c55e33;
  }
  .panel-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 300px;
    overflow-y: auto;
  }
  .placeholder {
    padding: 24px 14px;
    text-align: center;
    font-size: 0.8rem;
    color: #525252;
    background: #1a1a16;
    border-radius: 8px;
    border: 1px dashed #2d2d26;
  }
</style>
