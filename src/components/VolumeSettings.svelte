<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  const appState = getAppState();

  let mode = $state<"none" | "normalize" | "adjust">("none");
  let targetLufs = $state(-1);
  let adjustDb = $state(0);

  function updateVolume() {
    if (mode === "none") {
      appState.volume = null;
    } else if (mode === "normalize") {
      appState.volume = { type: "normalize", target_lufs: targetLufs };
    } else {
      appState.volume = { type: "adjust", db: adjustDb };
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
        value="normalize"
        bind:group={mode}
        disabled={appState.isProcessing}
      />
      正規化
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

  {#if mode === "normalize"}
    <div class="sub-setting">
      <label for="lufs-input">ピーク (dB)</label>
      <input
        id="lufs-input"
        type="number"
        bind:value={targetLufs}
        min="-30"
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
