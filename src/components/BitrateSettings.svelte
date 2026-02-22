<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  const state = getAppState();

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    state.bitrate = target.value;
  }
</script>

<div class="setting-group">
  <label for="bitrate-select">ビットレート</label>
  <select
    id="bitrate-select"
    value={state.bitrate}
    onchange={handleChange}
    disabled={state.isProcessing}
  >
    <option value="">変更しない</option>
    <option value="64k">64 kbps</option>
    <option value="96k">96 kbps</option>
    <option value="128k">128 kbps</option>
    <option value="192k">192 kbps</option>
    <option value="256k">256 kbps</option>
    <option value="320k">320 kbps</option>
  </select>
</div>

<style>
  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #a3a3a3;
  }
  select {
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
    cursor: pointer;
  }
</style>
