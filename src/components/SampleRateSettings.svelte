<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  const state = getAppState();

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    const val = target.value;
    state.sampleRate = val === "" ? null : parseInt(val);
  }
</script>

<div class="setting-group">
  <label for="samplerate-select">サンプルレート</label>
  <select
    id="samplerate-select"
    value={state.sampleRate?.toString() ?? ""}
    onchange={handleChange}
    disabled={state.isProcessing}
  >
    <option value="">変更しない</option>
    <option value="44100">44.1 kHz</option>
    <option value="48000">48 kHz</option>
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
