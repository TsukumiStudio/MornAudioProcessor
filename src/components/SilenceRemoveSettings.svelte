<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  const appState = getAppState();

  let enabled = $state(false);
  let removeStart = $state(true);
  let removeEnd = $state(true);
  let thresholdDb = $state(-50);

  function updateSilenceRemove() {
    if (!enabled) {
      appState.silenceRemove = null;
    } else {
      appState.silenceRemove = {
        remove_start: removeStart,
        remove_end: removeEnd,
        threshold_db: thresholdDb,
      };
    }
  }

  $effect(() => {
    updateSilenceRemove();
  });
</script>

<div class="setting-group">
  <label class="checkbox-label">
    <input
      type="checkbox"
      bind:checked={enabled}
      disabled={appState.isProcessing}
    />
    無音削除
  </label>

  <div class="sub-options" class:disabled={!enabled}>
    <label class="checkbox-label sub">
      <input
        type="checkbox"
        bind:checked={removeStart}
        disabled={!enabled || appState.isProcessing}
      />
      先頭の無音を削除
    </label>
    <label class="checkbox-label sub">
      <input
        type="checkbox"
        bind:checked={removeEnd}
        disabled={!enabled || appState.isProcessing}
      />
      末尾の無音を削除
    </label>
    <div class="threshold-setting">
      <label for="threshold-input">閾値</label>
      <input
        id="threshold-input"
        type="range"
        bind:value={thresholdDb}
        min="-60"
        max="-20"
        step="1"
        disabled={!enabled || appState.isProcessing}
      />
      <span class="threshold-value">{thresholdDb} dB</span>
    </div>
  </div>
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
  .checkbox-label.sub {
    font-weight: 400;
    color: #d4d4d8;
    font-size: 0.85rem;
  }
  .sub-options {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-left: 4px;
    transition: opacity 0.15s;
  }
  .sub-options.disabled {
    opacity: 0.35;
    pointer-events: none;
  }
  .threshold-setting {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
  }
  .threshold-setting label {
    font-size: 0.8rem;
    color: #a3a3a3;
    white-space: nowrap;
  }
  .threshold-setting input[type="range"] {
    flex: 1;
    accent-color: #a3a825;
  }
  .threshold-value {
    font-size: 0.8rem;
    color: #d4d4d8;
    min-width: 48px;
    text-align: right;
    font-family: monospace;
  }
</style>
