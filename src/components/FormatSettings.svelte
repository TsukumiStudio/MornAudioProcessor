<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { AudioFormat } from "$lib/types";

  const state = getAppState();

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    state.outputFormat = target.value as AudioFormat | "same";
  }
</script>

<div class="setting-group">
  <label for="format-select">出力フォーマット</label>
  <select
    id="format-select"
    value={state.outputFormat}
    onchange={handleChange}
    disabled={state.isProcessing}
  >
    <option value="same">変換しない（元の形式）</option>
    <option value="mp3">MP3</option>
    <option value="wav">WAV</option>
    <option value="ogg">OGG</option>
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
