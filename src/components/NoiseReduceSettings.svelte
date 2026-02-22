<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  const appState = getAppState();

  let mode = $state<"none" | "afftdn" | "anlmdn">("none");
  let afftdnNr = $state(12);
  let afftdnNf = $state(-40);
  let anlmdnStrength = $state(0.01);

  function updateNoiseReduce() {
    if (mode === "afftdn") {
      appState.noiseReduce = { type: "afftdn", nr: afftdnNr, nf: afftdnNf };
    } else if (mode === "anlmdn") {
      appState.noiseReduce = { type: "anlmdn", strength: anlmdnStrength };
    } else {
      appState.noiseReduce = null;
    }
  }

  $effect(() => {
    updateNoiseReduce();
  });
</script>

<div class="setting-group">
  <label>ノイズ除去</label>
  <div class="radio-group">
    <label class="radio-label">
      <input
        type="radio"
        name="noise"
        value="none"
        bind:group={mode}
        disabled={appState.isProcessing}
      />
      なし
    </label>
    <label class="radio-label">
      <input
        type="radio"
        name="noise"
        value="afftdn"
        bind:group={mode}
        disabled={appState.isProcessing}
      />
      FFT (afftdn)
    </label>
    <label class="radio-label">
      <input
        type="radio"
        name="noise"
        value="anlmdn"
        bind:group={mode}
        disabled={appState.isProcessing}
      />
      NLM (anlmdn)
    </label>
  </div>

  {#if mode === "afftdn"}
    <div class="slider-setting">
      <label for="nr-input">ノイズ低減量</label>
      <input
        id="nr-input"
        type="range"
        bind:value={afftdnNr}
        min="6"
        max="50"
        step="1"
        disabled={appState.isProcessing}
      />
      <span class="slider-value">{afftdnNr} dB</span>
    </div>
    <div class="slider-setting">
      <label for="nf-input">ノイズフロア</label>
      <input
        id="nf-input"
        type="range"
        bind:value={afftdnNf}
        min="-80"
        max="-20"
        step="1"
        disabled={appState.isProcessing}
      />
      <span class="slider-value">{afftdnNf} dB</span>
    </div>
  {:else if mode === "anlmdn"}
    <div class="slider-setting">
      <label for="anlmdn-input">強度</label>
      <input
        id="anlmdn-input"
        type="range"
        bind:value={anlmdnStrength}
        min="0.001"
        max="1"
        step="0.001"
        disabled={appState.isProcessing}
      />
      <span class="slider-value">{anlmdnStrength.toFixed(3)}</span>
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
  .slider-setting {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 2px;
  }
  .slider-setting label {
    font-size: 0.8rem;
    color: #a3a3a3;
    white-space: nowrap;
    min-width: 80px;
  }
  .slider-setting input[type="range"] {
    flex: 1;
    accent-color: #a3a825;
  }
  .slider-value {
    font-size: 0.8rem;
    color: #d4d4d8;
    min-width: 56px;
    text-align: right;
    font-family: monospace;
  }
</style>
