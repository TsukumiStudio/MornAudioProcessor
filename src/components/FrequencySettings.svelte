<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type {
    WidthType,
    FrequencyFilterOption,
  } from "$lib/types";

  const appState = getAppState();

  // Equalizer
  let eqEnabled = $state(false);
  let eqFrequency = $state(1000);
  let eqWidthType = $state<WidthType>("q");
  let eqWidth = $state(1);
  let eqGain = $state(0);
  let eqMix = $state(1);

  // Highpass
  let hpEnabled = $state(false);
  let hpFrequency = $state(200);
  let hpWidthType = $state<WidthType>("q");
  let hpWidth = $state(0.707);
  let hpPoles = $state<1 | 2>(2);
  let hpMix = $state(1);

  // Lowpass
  let lpEnabled = $state(false);
  let lpFrequency = $state(8000);
  let lpWidthType = $state<WidthType>("q");
  let lpWidth = $state(0.707);
  let lpPoles = $state<1 | 2>(2);
  let lpMix = $state(1);

  // Bandpass
  let bpEnabled = $state(false);
  let bpFrequency = $state(1000);
  let bpWidthType = $state<WidthType>("q");
  let bpWidth = $state(0.5);
  let bpMix = $state(1);
  let bpCsg = $state(false);

  const widthTypeLabels: Record<WidthType, string> = {
    h: "Hz",
    o: "octave",
    q: "Q",
    s: "slope",
    k: "kHz",
  };

  function updateStore() {
    const anyEnabled = eqEnabled || hpEnabled || lpEnabled || bpEnabled;
    if (!anyEnabled) {
      appState.frequencyFilter = null;
      return;
    }
    const opt: FrequencyFilterOption = {
      equalizer: {
        enabled: eqEnabled,
        frequency: eqFrequency,
        width_type: eqWidthType,
        width: eqWidth,
        gain: eqGain,
        mix: eqMix,
      },
      highpass: {
        enabled: hpEnabled,
        frequency: hpFrequency,
        width_type: hpWidthType,
        width: hpWidth,
        poles: hpPoles,
        mix: hpMix,
      },
      lowpass: {
        enabled: lpEnabled,
        frequency: lpFrequency,
        width_type: lpWidthType,
        width: lpWidth,
        poles: lpPoles,
        mix: lpMix,
      },
      bandpass: {
        enabled: bpEnabled,
        frequency: bpFrequency,
        width_type: bpWidthType,
        width: bpWidth,
        mix: bpMix,
        csg: bpCsg,
      },
    };
    appState.frequencyFilter = opt;
  }

  $effect(() => {
    updateStore();
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      eqEnabled = false;
      eqFrequency = 1000;
      eqWidthType = "q";
      eqWidth = 1;
      eqGain = 0;
      eqMix = 1;
      hpEnabled = false;
      hpFrequency = 200;
      hpWidthType = "q";
      hpWidth = 0.707;
      hpPoles = 2;
      hpMix = 1;
      lpEnabled = false;
      lpFrequency = 8000;
      lpWidthType = "q";
      lpWidth = 0.707;
      lpPoles = 2;
      lpMix = 1;
      bpEnabled = false;
      bpFrequency = 1000;
      bpWidthType = "q";
      bpWidth = 0.5;
      bpMix = 1;
      bpCsg = false;
    }
  });
</script>

<div class="frequency-settings">
  <!-- Equalizer -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={eqEnabled}
          disabled={appState.isProcessing}
        />
        イコライザー (equalizer)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#equalizer" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!eqEnabled}>
      <div class="param-row">
        <label>frequency</label>
        <input
          type="number"
          bind:value={eqFrequency}
          min="1"
          max="999999"
          step="1"
          disabled={!eqEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>width_type</label>
        <select
          bind:value={eqWidthType}
          disabled={!eqEnabled || appState.isProcessing}
        >
          {#each Object.entries(widthTypeLabels) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>
      </div>
      <div class="param-row">
        <label>width</label>
        <input
          type="number"
          bind:value={eqWidth}
          min="0.01"
          max="99999"
          step="0.01"
          disabled={!eqEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>gain</label>
        <input
          type="range"
          bind:value={eqGain}
          min="-30"
          max="30"
          step="0.5"
          disabled={!eqEnabled || appState.isProcessing}
        />
        <span class="slider-value">{eqGain > 0 ? "+" : ""}{eqGain} dB</span>
      </div>
      <div class="param-row">
        <label>mix</label>
        <input
          type="range"
          bind:value={eqMix}
          min="0"
          max="1"
          step="0.01"
          disabled={!eqEnabled || appState.isProcessing}
        />
        <span class="slider-value">{eqMix.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Highpass -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={hpEnabled}
          disabled={appState.isProcessing}
        />
        ハイパスフィルター (highpass)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#highpass" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!hpEnabled}>
      <div class="param-row">
        <label>frequency</label>
        <input
          type="number"
          bind:value={hpFrequency}
          min="1"
          max="999999"
          step="1"
          disabled={!hpEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>width_type</label>
        <select
          bind:value={hpWidthType}
          disabled={!hpEnabled || appState.isProcessing}
        >
          {#each Object.entries(widthTypeLabels) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>
      </div>
      <div class="param-row">
        <label>width</label>
        <input
          type="number"
          bind:value={hpWidth}
          min="0.01"
          max="99999"
          step="0.01"
          disabled={!hpEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>poles</label>
        <select
          bind:value={hpPoles}
          disabled={!hpEnabled || appState.isProcessing}
        >
          <option value={1}>1 (6dB/oct)</option>
          <option value={2}>2 (12dB/oct)</option>
        </select>
      </div>
      <div class="param-row">
        <label>mix</label>
        <input
          type="range"
          bind:value={hpMix}
          min="0"
          max="1"
          step="0.01"
          disabled={!hpEnabled || appState.isProcessing}
        />
        <span class="slider-value">{hpMix.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Lowpass -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={lpEnabled}
          disabled={appState.isProcessing}
        />
        ローパスフィルター (lowpass)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#lowpass" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!lpEnabled}>
      <div class="param-row">
        <label>frequency</label>
        <input
          type="number"
          bind:value={lpFrequency}
          min="1"
          max="999999"
          step="1"
          disabled={!lpEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>width_type</label>
        <select
          bind:value={lpWidthType}
          disabled={!lpEnabled || appState.isProcessing}
        >
          {#each Object.entries(widthTypeLabels) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>
      </div>
      <div class="param-row">
        <label>width</label>
        <input
          type="number"
          bind:value={lpWidth}
          min="0.01"
          max="99999"
          step="0.01"
          disabled={!lpEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>poles</label>
        <select
          bind:value={lpPoles}
          disabled={!lpEnabled || appState.isProcessing}
        >
          <option value={1}>1 (6dB/oct)</option>
          <option value={2}>2 (12dB/oct)</option>
        </select>
      </div>
      <div class="param-row">
        <label>mix</label>
        <input
          type="range"
          bind:value={lpMix}
          min="0"
          max="1"
          step="0.01"
          disabled={!lpEnabled || appState.isProcessing}
        />
        <span class="slider-value">{lpMix.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Bandpass -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={bpEnabled}
          disabled={appState.isProcessing}
        />
        バンドパスフィルター (bandpass)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#bandpass" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!bpEnabled}>
      <div class="param-row">
        <label>frequency</label>
        <input
          type="number"
          bind:value={bpFrequency}
          min="1"
          max="999999"
          step="1"
          disabled={!bpEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>width_type</label>
        <select
          bind:value={bpWidthType}
          disabled={!bpEnabled || appState.isProcessing}
        >
          {#each Object.entries(widthTypeLabels) as [value, label]}
            <option {value}>{label}</option>
          {/each}
        </select>
      </div>
      <div class="param-row">
        <label>width</label>
        <input
          type="number"
          bind:value={bpWidth}
          min="0.01"
          max="99999"
          step="0.01"
          disabled={!bpEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>mix</label>
        <input
          type="range"
          bind:value={bpMix}
          min="0"
          max="1"
          step="0.01"
          disabled={!bpEnabled || appState.isProcessing}
        />
        <span class="slider-value">{bpMix.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>csg</label>
        <input
          type="checkbox"
          bind:checked={bpCsg}
          disabled={!bpEnabled || appState.isProcessing}
        />
        <span class="param-desc">constant skirt gain</span>
      </div>
    </div>
  </div>
</div>

<style>
  .frequency-settings {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .filter-section {
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
  .filter-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .doc-link {
    font-size: 0.7rem;
    color: #71717a;
    text-decoration: none;
  }
  .doc-link:hover {
    color: #a3a825;
  }
  .filter-params {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-left: 4px;
    transition: opacity 0.15s;
  }
  .filter-params.disabled {
    opacity: 0.35;
    pointer-events: none;
  }
  .param-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-left: 20px;
  }
  .param-row label {
    font-size: 0.8rem;
    color: #a3a3a3;
    white-space: nowrap;
    min-width: 100px;
    font-family: monospace;
  }
  .param-row input[type="number"] {
    width: 100px;
    padding: 4px 6px;
    border: 1px solid #3f3f36;
    border-radius: 4px;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
    font-family: monospace;
  }
  .param-row input[type="number"]:disabled {
    opacity: 0.5;
  }
  .param-row select {
    padding: 4px 6px;
    border: 1px solid #3f3f36;
    border-radius: 4px;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
  }
  .param-row select:disabled {
    opacity: 0.5;
  }
  .param-row input[type="range"] {
    flex: 1;
    accent-color: #a3a825;
  }
  .param-row input[type="checkbox"] {
    accent-color: #a3a825;
  }
  .unit {
    font-size: 0.8rem;
    color: #a3a3a3;
    min-width: 24px;
  }
  .slider-value {
    font-size: 0.8rem;
    color: #d4d4d8;
    min-width: 64px;
    text-align: right;
    font-family: monospace;
  }
  .param-desc {
    font-size: 0.75rem;
    color: #737373;
  }
</style>
