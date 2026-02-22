<script lang="ts">
  import { open } from "@tauri-apps/plugin-dialog";
  import { getAppState } from "$lib/stores.svelte";

  const state = getAppState();

  async function selectDirectory() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "出力先フォルダを選択",
    });
    if (selected && typeof selected === "string") {
      state.outputDirectory = selected;
    }
  }
</script>

<div class="setting-group">
  <label>出力先</label>
  <div class="output-row">
    <input
      type="text"
      value={state.outputDirectory}
      placeholder="未指定（元ファイルと同じ場所）"
      readonly
      class="output-path"
    />
    <button
      onclick={selectDirectory}
      disabled={state.isProcessing}
      class="browse-btn"
    >
      選択
    </button>
    {#if state.outputDirectory}
      <button
        onclick={() => (state.outputDirectory = "")}
        disabled={state.isProcessing}
        class="clear-btn"
        title="クリア"
      >
        &times;
      </button>
    {/if}
  </div>
</div>

<style>
  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .setting-group > label:first-child {
    font-size: 0.8rem;
    font-weight: 500;
    color: #a3a3a3;
  }
  .output-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .output-path {
    flex: 1;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #a3a3a3;
    font-size: 0.85rem;
    cursor: default;
  }
  .browse-btn {
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid #3f3f36;
    background: #28281f;
    color: #e4e4e7;
    font-size: 0.85rem;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: none;
  }
  .browse-btn:hover:not(:disabled) {
    background: #3f3f36;
  }
  .clear-btn {
    background: none;
    border: none;
    color: #737373;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 4px 8px;
    box-shadow: none;
  }
  .clear-btn:hover:not(:disabled) {
    color: #ef4444;
  }
</style>
