<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  const appState = getAppState();

  let conversion = $state<"unchanged" | "to_mono" | "to_stereo">("unchanged");
  let balance = $state(0);

  function updateStore() {
    if (conversion === "unchanged" && balance === 0) {
      appState.channelFilter = null;
      return;
    }
    appState.channelFilter = {
      conversion,
      balance: conversion === "to_stereo" ? balance : 0,
    };
  }

  $effect(() => {
    updateStore();
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      conversion = "unchanged";
      balance = 0;
    }
  });
</script>

<div class="channel-settings">
  <div class="setting-group">
    <label class="group-label">チャンネル変換</label>
    <div class="radio-group">
      <label class="radio-label">
        <input
          type="radio"
          bind:group={conversion}
          value="unchanged"
          disabled={appState.isProcessing}
        />
        変更しない
      </label>
      <label class="radio-label">
        <input
          type="radio"
          bind:group={conversion}
          value="to_mono"
          disabled={appState.isProcessing}
        />
        モノラルに変換
      </label>
      <label class="radio-label">
        <input
          type="radio"
          bind:group={conversion}
          value="to_stereo"
          disabled={appState.isProcessing}
        />
        ステレオに変換
      </label>
    </div>
  </div>

  <div class="setting-group" class:disabled={conversion !== "to_stereo"}>
    <label class="group-label">パンバランス</label>
    <div class="balance-row">
      <span class="balance-label">L</span>
      <input
        type="range"
        bind:value={balance}
        min="-1"
        max="1"
        step="0.01"
        disabled={conversion !== "to_stereo" || appState.isProcessing}
      />
      <span class="balance-label">R</span>
      <span class="balance-value">{balance === 0 ? "C" : balance < 0 ? `L${Math.round(Math.abs(balance) * 100)}` : `R${Math.round(balance * 100)}`}</span>
    </div>
  </div>
</div>

<style>
  .channel-settings {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: opacity 0.15s;
  }
  .setting-group.disabled {
    opacity: 0.35;
    pointer-events: none;
  }
  .group-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #a3a3a3;
  }
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-left: 4px;
  }
  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8rem;
    color: #d4d4d8;
    cursor: pointer;
  }
  .radio-label input[type="radio"] {
    accent-color: #a3a825;
  }
  .balance-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 4px;
  }
  .balance-row input[type="range"] {
    flex: 1;
    accent-color: #a3a825;
  }
  .balance-label {
    font-size: 0.8rem;
    color: #a3a3a3;
    font-weight: 500;
  }
  .balance-value {
    font-size: 0.8rem;
    color: #d4d4d8;
    min-width: 40px;
    text-align: right;
    font-family: monospace;
  }
</style>
