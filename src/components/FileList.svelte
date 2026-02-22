<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import FileListItem from "./FileListItem.svelte";
  import OutputFileItem from "./OutputFileItem.svelte";

  const state = getAppState();

  const outputFiles = $derived(
    state.files.filter((f) => f.status !== "pending"),
  );
</script>

{#if state.files.length > 0}
  <div class="file-panels">
    <div class="panel">
      <div class="panel-header">
        <h3>入力ファイル ({state.files.length})</h3>
      </div>
      <div class="panel-items">
        {#each state.files as entry (entry.id)}
          <FileListItem
            {entry}
            onRemove={(id) => state.removeFile(id)}
            disabled={state.isProcessing}
          />
        {/each}
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h3>出力ファイル</h3>
      </div>
      <div class="panel-items">
        {#if outputFiles.length > 0}
          {#each outputFiles as entry (entry.id)}
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
  .panel-header h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #a3a3a3;
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
