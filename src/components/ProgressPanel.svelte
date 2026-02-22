<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  const state = getAppState();
</script>

{#if state.isProcessing || state.processingDone}
  <div class="progress-panel">
    <div class="overall">
      <div class="overall-header">
        <span class="overall-label">
          {#if state.isProcessing}
            処理中...
          {:else}
            処理完了
          {/if}
        </span>
        <span class="overall-count">
          {state.completedFiles} / {state.totalFiles}
        </span>
      </div>
      <div class="overall-bar">
        <div
          class="overall-fill"
          class:done={!state.isProcessing && state.processingDone}
          style="width: {state.overallProgress}%"
        ></div>
      </div>
    </div>
  </div>
{/if}

<style>
  .progress-panel {
    padding: 16px;
    background: #1a1a16;
    border-radius: 10px;
    border: 1px solid #2d2d26;
  }
  .overall-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .overall-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #d4d4d8;
  }
  .overall-count {
    font-size: 0.8rem;
    color: #a3a3a3;
  }
  .overall-bar {
    height: 8px;
    background: #28281f;
    border-radius: 4px;
    overflow: hidden;
  }
  .overall-fill {
    height: 100%;
    background: #a3a825;
    border-radius: 4px;
    transition: width 0.3s;
  }
  .overall-fill.done {
    background: #22c55e;
  }
</style>
