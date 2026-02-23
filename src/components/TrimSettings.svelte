<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  const appState = getAppState();

  let enabled = $state(false);
  let start = $state("");
  let end = $state("");

  function updateTrim() {
    if (!enabled) {
      appState.trim = null;
    } else {
      appState.trim = {
        start: start || undefined,
        end: end || undefined,
      };
    }
  }

  $effect(() => {
    updateTrim();
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      enabled = false;
      start = "";
      end = "";
    }
  });
</script>

<div class="setting-group">
  <label class="checkbox-label">
    <input
      type="checkbox"
      bind:checked={enabled}
      disabled={appState.isProcessing}
    />
    トリミング
  </label>

  {#if enabled}
    <div class="trim-inputs">
      <div class="trim-field">
        <label for="trim-start">開始</label>
        <input
          id="trim-start"
          type="text"
          bind:value={start}
          placeholder="00:00:00"
          disabled={appState.isProcessing}
        />
      </div>
      <div class="trim-field">
        <label for="trim-end">終了</label>
        <input
          id="trim-end"
          type="text"
          bind:value={end}
          placeholder="00:00:00"
          disabled={appState.isProcessing}
        />
      </div>
    </div>
    <p class="hint">形式: HH:MM:SS または秒数</p>
  {/if}
</div>

<style>
  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #a3a3a3;
    cursor: pointer;
  }
  .trim-inputs {
    display: flex;
    gap: 12px;
  }
  .trim-field {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .trim-field label {
    font-size: 0.8rem;
    color: #a3a3a3;
  }
  .trim-field input {
    width: 100px;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
  }
  .hint {
    margin: 0;
    font-size: 0.7rem;
    color: #525252;
  }
</style>
