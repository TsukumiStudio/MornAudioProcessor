<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { EffectFilterOption } from "$lib/types";

  const appState = getAppState();

  // Echo
  let echoEnabled = $state(false);
  let echoInGain = $state(0.6);
  let echoOutGain = $state(0.3);
  let echoDelays = $state(1000);
  let echoDecays = $state(0.5);

  // Chorus
  let chorusEnabled = $state(false);
  let chorusInGain = $state(0.4);
  let chorusOutGain = $state(0.4);
  let chorusDelays = $state(55);
  let chorusDecays = $state(0.4);
  let chorusSpeeds = $state(0.25);
  let chorusDepths = $state(2);

  // Flanger
  let flangerEnabled = $state(false);
  let flangerDelay = $state(0);
  let flangerDepth = $state(2);
  let flangerRegen = $state(0);
  let flangerWidth = $state(71);
  let flangerSpeed = $state(0.5);
  let flangerShape = $state<"sinusoidal" | "triangular">("sinusoidal");
  let flangerPhase = $state(25);
  let flangerInterp = $state<"linear" | "quadratic">("linear");

  // Phaser
  let phaserEnabled = $state(false);
  let phaserInGain = $state(0.4);
  let phaserOutGain = $state(0.74);
  let phaserDelay = $state(3.0);
  let phaserDecay = $state(0.4);
  let phaserSpeed = $state(0.5);
  let phaserType = $state<"triangular" | "sinusoidal">("triangular");

  // Tremolo
  let tremoloEnabled = $state(false);
  let tremoloF = $state(5.0);
  let tremoloD = $state(0.5);

  // Vibrato
  let vibratoEnabled = $state(false);
  let vibratoF = $state(5.0);
  let vibratoD = $state(0.5);

  // Tempo
  let tempoEnabled = $state(false);
  let tempoValue = $state(1.0);

  // Pitch
  let pitchEnabled = $state(false);
  let pitchSemitones = $state(0);

  function updateStore() {
    const anyEnabled =
      echoEnabled ||
      chorusEnabled ||
      flangerEnabled ||
      phaserEnabled ||
      tremoloEnabled ||
      vibratoEnabled ||
      tempoEnabled ||
      pitchEnabled;
    if (!anyEnabled) {
      appState.effectFilter = null;
      return;
    }
    const opt: EffectFilterOption = {
      echo: {
        enabled: echoEnabled,
        in_gain: echoInGain,
        out_gain: echoOutGain,
        delays: echoDelays,
        decays: echoDecays,
      },
      chorus: {
        enabled: chorusEnabled,
        in_gain: chorusInGain,
        out_gain: chorusOutGain,
        delays: chorusDelays,
        decays: chorusDecays,
        speeds: chorusSpeeds,
        depths: chorusDepths,
      },
      flanger: {
        enabled: flangerEnabled,
        delay: flangerDelay,
        depth: flangerDepth,
        regen: flangerRegen,
        width: flangerWidth,
        speed: flangerSpeed,
        shape: flangerShape,
        phase: flangerPhase,
        interp: flangerInterp,
      },
      phaser: {
        enabled: phaserEnabled,
        in_gain: phaserInGain,
        out_gain: phaserOutGain,
        delay: phaserDelay,
        decay: phaserDecay,
        speed: phaserSpeed,
        type: phaserType,
      },
      tremolo: {
        enabled: tremoloEnabled,
        f: tremoloF,
        d: tremoloD,
      },
      vibrato: {
        enabled: vibratoEnabled,
        f: vibratoF,
        d: vibratoD,
      },
      tempo: {
        enabled: tempoEnabled,
        tempo: tempoValue,
      },
      pitch: {
        enabled: pitchEnabled,
        semitones: pitchSemitones,
      },
    };
    appState.effectFilter = opt;
  }

  $effect(() => {
    updateStore();
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      echoEnabled = false;
      echoInGain = 0.6;
      echoOutGain = 0.3;
      echoDelays = 1000;
      echoDecays = 0.5;
      chorusEnabled = false;
      chorusInGain = 0.4;
      chorusOutGain = 0.4;
      chorusDelays = 55;
      chorusDecays = 0.4;
      chorusSpeeds = 0.25;
      chorusDepths = 2;
      flangerEnabled = false;
      flangerDelay = 0;
      flangerDepth = 2;
      flangerRegen = 0;
      flangerWidth = 71;
      flangerSpeed = 0.5;
      flangerShape = "sinusoidal";
      flangerPhase = 25;
      flangerInterp = "linear";
      phaserEnabled = false;
      phaserInGain = 0.4;
      phaserOutGain = 0.74;
      phaserDelay = 3.0;
      phaserDecay = 0.4;
      phaserSpeed = 0.5;
      phaserType = "triangular";
      tremoloEnabled = false;
      tremoloF = 5.0;
      tremoloD = 0.5;
      vibratoEnabled = false;
      vibratoF = 5.0;
      vibratoD = 0.5;
      tempoEnabled = false;
      tempoValue = 1.0;
      pitchEnabled = false;
      pitchSemitones = 0;
    }
  });
</script>

<div class="effect-settings">
  <!-- Echo -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={echoEnabled}
          disabled={appState.isProcessing}
        />
        エコー (aecho)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#aecho" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!echoEnabled}>
      <div class="param-row">
        <label>in_gain</label>
        <input
          type="range"
          bind:value={echoInGain}
          min="0"
          max="1"
          step="0.01"
          disabled={!echoEnabled || appState.isProcessing}
        />
        <span class="slider-value">{echoInGain.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>out_gain</label>
        <input
          type="range"
          bind:value={echoOutGain}
          min="0"
          max="1"
          step="0.01"
          disabled={!echoEnabled || appState.isProcessing}
        />
        <span class="slider-value">{echoOutGain.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>delays</label>
        <input
          type="number"
          bind:value={echoDelays}
          min="0"
          max="90000"
          step="1"
          disabled={!echoEnabled || appState.isProcessing}
        />
        <span class="unit">ms</span>
      </div>
      <div class="param-row">
        <label>decays</label>
        <input
          type="range"
          bind:value={echoDecays}
          min="0"
          max="1"
          step="0.01"
          disabled={!echoEnabled || appState.isProcessing}
        />
        <span class="slider-value">{echoDecays.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Chorus -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={chorusEnabled}
          disabled={appState.isProcessing}
        />
        コーラス (chorus)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#chorus" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!chorusEnabled}>
      <div class="param-row">
        <label>in_gain</label>
        <input
          type="range"
          bind:value={chorusInGain}
          min="0"
          max="1"
          step="0.01"
          disabled={!chorusEnabled || appState.isProcessing}
        />
        <span class="slider-value">{chorusInGain.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>out_gain</label>
        <input
          type="range"
          bind:value={chorusOutGain}
          min="0"
          max="1"
          step="0.01"
          disabled={!chorusEnabled || appState.isProcessing}
        />
        <span class="slider-value">{chorusOutGain.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>delays</label>
        <input
          type="number"
          bind:value={chorusDelays}
          min="0"
          max="1000"
          step="1"
          disabled={!chorusEnabled || appState.isProcessing}
        />
        <span class="unit">ms</span>
      </div>
      <div class="param-row">
        <label>decays</label>
        <input
          type="range"
          bind:value={chorusDecays}
          min="0"
          max="1"
          step="0.01"
          disabled={!chorusEnabled || appState.isProcessing}
        />
        <span class="slider-value">{chorusDecays.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>speeds</label>
        <input
          type="number"
          bind:value={chorusSpeeds}
          min="0.01"
          max="10"
          step="0.01"
          disabled={!chorusEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>depths</label>
        <input
          type="number"
          bind:value={chorusDepths}
          min="0"
          max="100"
          step="0.1"
          disabled={!chorusEnabled || appState.isProcessing}
        />
        <span class="unit">ms</span>
      </div>
    </div>
  </div>

  <!-- Flanger -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={flangerEnabled}
          disabled={appState.isProcessing}
        />
        フランジャー (flanger)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#flanger" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!flangerEnabled}>
      <div class="param-row">
        <label>delay</label>
        <input
          type="range"
          bind:value={flangerDelay}
          min="0"
          max="30"
          step="0.1"
          disabled={!flangerEnabled || appState.isProcessing}
        />
        <span class="slider-value">{flangerDelay.toFixed(1)} ms</span>
      </div>
      <div class="param-row">
        <label>depth</label>
        <input
          type="range"
          bind:value={flangerDepth}
          min="0"
          max="10"
          step="0.1"
          disabled={!flangerEnabled || appState.isProcessing}
        />
        <span class="slider-value">{flangerDepth.toFixed(1)} ms</span>
      </div>
      <div class="param-row">
        <label>regen</label>
        <input
          type="range"
          bind:value={flangerRegen}
          min="-95"
          max="95"
          step="1"
          disabled={!flangerEnabled || appState.isProcessing}
        />
        <span class="slider-value">{flangerRegen}%</span>
      </div>
      <div class="param-row">
        <label>width</label>
        <input
          type="range"
          bind:value={flangerWidth}
          min="0"
          max="100"
          step="1"
          disabled={!flangerEnabled || appState.isProcessing}
        />
        <span class="slider-value">{flangerWidth}%</span>
      </div>
      <div class="param-row">
        <label>speed</label>
        <input
          type="range"
          bind:value={flangerSpeed}
          min="0.1"
          max="10"
          step="0.1"
          disabled={!flangerEnabled || appState.isProcessing}
        />
        <span class="slider-value">{flangerSpeed.toFixed(1)} Hz</span>
      </div>
      <div class="param-row">
        <label>shape</label>
        <select
          bind:value={flangerShape}
          disabled={!flangerEnabled || appState.isProcessing}
        >
          <option value="sinusoidal">sinusoidal</option>
          <option value="triangular">triangular</option>
        </select>
      </div>
      <div class="param-row">
        <label>phase</label>
        <input
          type="range"
          bind:value={flangerPhase}
          min="0"
          max="100"
          step="1"
          disabled={!flangerEnabled || appState.isProcessing}
        />
        <span class="slider-value">{flangerPhase}%</span>
      </div>
      <div class="param-row">
        <label>interp</label>
        <select
          bind:value={flangerInterp}
          disabled={!flangerEnabled || appState.isProcessing}
        >
          <option value="linear">linear</option>
          <option value="quadratic">quadratic</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Phaser -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={phaserEnabled}
          disabled={appState.isProcessing}
        />
        フェイザー (aphaser)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#aphaser" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!phaserEnabled}>
      <div class="param-row">
        <label>in_gain</label>
        <input
          type="range"
          bind:value={phaserInGain}
          min="0"
          max="1"
          step="0.01"
          disabled={!phaserEnabled || appState.isProcessing}
        />
        <span class="slider-value">{phaserInGain.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>out_gain</label>
        <input
          type="range"
          bind:value={phaserOutGain}
          min="0"
          max="2"
          step="0.01"
          disabled={!phaserEnabled || appState.isProcessing}
        />
        <span class="slider-value">{phaserOutGain.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>delay</label>
        <input
          type="range"
          bind:value={phaserDelay}
          min="0"
          max="5"
          step="0.1"
          disabled={!phaserEnabled || appState.isProcessing}
        />
        <span class="slider-value">{phaserDelay.toFixed(1)} ms</span>
      </div>
      <div class="param-row">
        <label>decay</label>
        <input
          type="range"
          bind:value={phaserDecay}
          min="0"
          max="0.99"
          step="0.01"
          disabled={!phaserEnabled || appState.isProcessing}
        />
        <span class="slider-value">{phaserDecay.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>speed</label>
        <input
          type="range"
          bind:value={phaserSpeed}
          min="0.1"
          max="2"
          step="0.01"
          disabled={!phaserEnabled || appState.isProcessing}
        />
        <span class="slider-value">{phaserSpeed.toFixed(2)} Hz</span>
      </div>
      <div class="param-row">
        <label>type</label>
        <select
          bind:value={phaserType}
          disabled={!phaserEnabled || appState.isProcessing}
        >
          <option value="triangular">triangular</option>
          <option value="sinusoidal">sinusoidal</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Tremolo -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={tremoloEnabled}
          disabled={appState.isProcessing}
        />
        トレモロ (tremolo)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#tremolo" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!tremoloEnabled}>
      <div class="param-row">
        <label>f</label>
        <input
          type="range"
          bind:value={tremoloF}
          min="0.1"
          max="20"
          step="0.1"
          disabled={!tremoloEnabled || appState.isProcessing}
        />
        <span class="slider-value">{tremoloF.toFixed(1)} Hz</span>
      </div>
      <div class="param-row">
        <label>d</label>
        <input
          type="range"
          bind:value={tremoloD}
          min="0"
          max="1"
          step="0.01"
          disabled={!tremoloEnabled || appState.isProcessing}
        />
        <span class="slider-value">{tremoloD.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Vibrato -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={vibratoEnabled}
          disabled={appState.isProcessing}
        />
        ビブラート (vibrato)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#vibrato" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!vibratoEnabled}>
      <div class="param-row">
        <label>f</label>
        <input
          type="range"
          bind:value={vibratoF}
          min="0.1"
          max="20"
          step="0.1"
          disabled={!vibratoEnabled || appState.isProcessing}
        />
        <span class="slider-value">{vibratoF.toFixed(1)} Hz</span>
      </div>
      <div class="param-row">
        <label>d</label>
        <input
          type="range"
          bind:value={vibratoD}
          min="0"
          max="1"
          step="0.01"
          disabled={!vibratoEnabled || appState.isProcessing}
        />
        <span class="slider-value">{vibratoD.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Tempo -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={tempoEnabled}
          disabled={appState.isProcessing}
        />
        テンポ変更 (atempo)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#atempo" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!tempoEnabled}>
      <div class="param-row">
        <label>tempo</label>
        <input
          type="range"
          bind:value={tempoValue}
          min="0.5"
          max="4"
          step="0.01"
          disabled={!tempoEnabled || appState.isProcessing}
        />
        <span class="slider-value">{tempoValue.toFixed(2)}x</span>
      </div>
    </div>
  </div>

  <!-- Pitch -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={pitchEnabled}
          disabled={appState.isProcessing}
        />
        ピッチ変更 (asetrate+atempo)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#asetrate" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!pitchEnabled}>
      <div class="param-row">
        <label>semitones</label>
        <input
          type="range"
          bind:value={pitchSemitones}
          min="-12"
          max="12"
          step="1"
          disabled={!pitchEnabled || appState.isProcessing}
        />
        <span class="slider-value">{pitchSemitones > 0 ? "+" : ""}{pitchSemitones}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .effect-settings {
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
    min-width: 80px;
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
  .unit {
    font-size: 0.8rem;
    color: #a3a3a3;
    min-width: 24px;
  }
  .slider-value {
    font-size: 0.8rem;
    color: #d4d4d8;
    min-width: 72px;
    text-align: right;
    font-family: monospace;
  }
</style>
