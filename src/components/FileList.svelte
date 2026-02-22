<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import FileListItem from "./FileListItem.svelte";

  const state = getAppState();
</script>

{#if state.files.length > 0}
  <div class="file-list">
    <div class="file-list-header">
      <h3>ファイル一覧 ({state.files.length})</h3>
    </div>
    <div class="file-list-items">
      {#each state.files as entry (entry.id)}
        <FileListItem
          {entry}
          onRemove={(id) => state.removeFile(id)}
          disabled={state.isProcessing}
        />
      {/each}
    </div>
  </div>
{/if}

<style>
  .file-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .file-list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .file-list-header h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #a3a3a3;
  }
  .file-list-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 240px;
    overflow-y: auto;
  }
</style>
