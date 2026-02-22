<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  const appState = getAppState();

  let mode = $state<"none" | "peak" | "rms" | "adjust">("none");
  let targetPeakDb = $state(-1);
  let targetRmsDb = $state(-20);
  let adjustDb = $state(0);

  function updateVolume() {
    if (mode === "peak") {
      appState.volume = { type: "normalize_peak", target_db: targetPeakDb };
    } else if (mode === "rms") {
      appState.volume = { type: "normalize_rms", target_db: targetRmsDb };
    } else if (mode === "adjust") {
      appState.volume = { type: "adjust", db: adjustDb };
    } else {
      appState.volume = null;
    }
  }

  $effect(() => {
    updateVolume();
  });
</script>

<div class="setting-group">
  <label>音量調整</label>
  <div class="radio-group">
    <label class="radio-label">
      <input
        type="radio"
        name="volume"
        value="none"
        bind:group={mode}
        disabled={appState.isProcessing}
      />
      なし
    </label>
    <label class="radio-label">
      <input
        type="radio"
        name="volume"
        value="peak"
        bind:group={mode}
        disabled={appState.isProcessing}
      />
      Peak正規化
    </label>
    <label class="radio-label">
      <input
        type="radio"
        name="volume"
        value="rms"
        bind:group={mode}
        disabled={appState.isProcessing}
      />
      RMS正規化
    </label>
    <label class="radio-label">
      <input
        type="radio"
        name="volume"
        value="adjust"
        bind:group={mode}
        disabled={appState.isProcessing}
      />
      増減
    </label>
  </div>

  {#if mode === "peak"}
    <div class="sub-setting">
      <label for="peak-input">目標ピーク値 (dB)</label>
      <input
        id="peak-input"
        type="number"
        bind:value={targetPeakDb}
        min="-30"
        max="0"
        step="1"
        disabled={appState.isProcessing}
      />
    </div>
  {:else if mode === "rms"}
    <div class="sub-setting">
      <label for="rms-input">目標RMS (dB)</label>
      <input
        id="rms-input"
        type="number"
        bind:value={targetRmsDb}
        min="-40"
        max="0"
        step="1"
        disabled={appState.isProcessing}
      />
    </div>
  {:else if mode === "adjust"}
    <div class="sub-setting">
      <label for="db-input">調整量 (dB)</label>
      <input
        id="db-input"
        type="number"
        bind:value={adjustDb}
        min="-30"
        max="30"
        step="0.5"
        disabled={appState.isProcessing}
      />
    </div>
  {/if}
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
  .radio-group {
    display: flex;
    gap: 12px;
  }
  .radio-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85rem;
    color: #d4d4d8;
    cursor: pointer;
  }
  .sub-setting {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .sub-setting label {
    font-size: 0.8rem;
    color: #a3a3a3;
    white-space: nowrap;
  }
  .sub-setting input {
    width: 80px;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
  }
</style>
