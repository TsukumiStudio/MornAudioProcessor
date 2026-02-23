<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { DynamicsFilterOption } from "$lib/types";

  const appState = getAppState();

  // Compressor
  let compEnabled = $state(false);
  let compThreshold = $state(0.125);
  let compRatio = $state(2);
  let compAttack = $state(20);
  let compRelease = $state(250);
  let compMakeup = $state(1);
  let compKnee = $state(2.828);
  let compMode = $state<"downward" | "upward">("downward");
  let compDetection = $state<"peak" | "rms">("rms");
  let compLink = $state<"average" | "maximum">("average");
  let compMix = $state(1);
  let compLevelIn = $state(1);

  // Limiter
  let limEnabled = $state(false);
  let limLimit = $state(1.0);
  let limAttack = $state(5);
  let limRelease = $state(50);
  let limLevel = $state(false);
  let limLevelIn = $state(1);
  let limLevelOut = $state(1);
  let limAsc = $state(false);
  let limAscLevel = $state(0.5);

  // Gate
  let gateEnabled = $state(false);
  let gateThreshold = $state(0.125);
  let gateRatio = $state(2);
  let gateRange = $state(0.06125);
  let gateAttack = $state(20);
  let gateRelease = $state(250);
  let gateMakeup = $state(1);
  let gateKnee = $state(2.828);
  let gateMode = $state<"downward" | "upward">("downward");
  let gateDetection = $state<"peak" | "rms">("rms");
  let gateLink = $state<"average" | "maximum">("average");

  function updateStore() {
    const anyEnabled = compEnabled || limEnabled || gateEnabled;
    if (!anyEnabled) {
      appState.dynamicsFilter = null;
      return;
    }
    const opt: DynamicsFilterOption = {
      compressor: {
        enabled: compEnabled,
        threshold: compThreshold,
        ratio: compRatio,
        attack: compAttack,
        release: compRelease,
        makeup: compMakeup,
        knee: compKnee,
        mode: compMode,
        detection: compDetection,
        link: compLink,
        mix: compMix,
        level_in: compLevelIn,
      },
      limiter: {
        enabled: limEnabled,
        limit: limLimit,
        attack: limAttack,
        release: limRelease,
        level: limLevel,
        level_in: limLevelIn,
        level_out: limLevelOut,
        asc: limAsc,
        asc_level: limAscLevel,
      },
      gate: {
        enabled: gateEnabled,
        threshold: gateThreshold,
        ratio: gateRatio,
        range: gateRange,
        attack: gateAttack,
        release: gateRelease,
        makeup: gateMakeup,
        knee: gateKnee,
        mode: gateMode,
        detection: gateDetection,
        link: gateLink,
      },
    };
    appState.dynamicsFilter = opt;
  }

  $effect(() => {
    updateStore();
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      compEnabled = false;
      compThreshold = 0.125;
      compRatio = 2;
      compAttack = 20;
      compRelease = 250;
      compMakeup = 1;
      compKnee = 2.828;
      compMode = "downward";
      compDetection = "rms";
      compLink = "average";
      compMix = 1;
      compLevelIn = 1;
      limEnabled = false;
      limLimit = 1.0;
      limAttack = 5;
      limRelease = 50;
      limLevel = false;
      limLevelIn = 1;
      limLevelOut = 1;
      limAsc = false;
      limAscLevel = 0.5;
      gateEnabled = false;
      gateThreshold = 0.125;
      gateRatio = 2;
      gateRange = 0.06125;
      gateAttack = 20;
      gateRelease = 250;
      gateMakeup = 1;
      gateKnee = 2.828;
      gateMode = "downward";
      gateDetection = "rms";
      gateLink = "average";
    }
  });

  function thresholdToDb(v: number): string {
    if (v <= 0) return "-inf";
    return (20 * Math.log10(v)).toFixed(1);
  }
</script>

<div class="dynamics-settings">
  <!-- Compressor -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={compEnabled}
          disabled={appState.isProcessing}
        />
        コンプレッサー (acompressor)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#acompressor" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!compEnabled}>
      <div class="param-row">
        <label>threshold</label>
        <input
          type="range"
          bind:value={compThreshold}
          min="0.001"
          max="1"
          step="0.001"
          disabled={!compEnabled || appState.isProcessing}
        />
        <span class="slider-value">{thresholdToDb(compThreshold)} dB</span>
      </div>
      <div class="param-row">
        <label>ratio</label>
        <input
          type="range"
          bind:value={compRatio}
          min="1"
          max="20"
          step="0.5"
          disabled={!compEnabled || appState.isProcessing}
        />
        <span class="slider-value">{compRatio}:1</span>
      </div>
      <div class="param-row">
        <label>attack</label>
        <input
          type="range"
          bind:value={compAttack}
          min="0.01"
          max="2000"
          step="1"
          disabled={!compEnabled || appState.isProcessing}
        />
        <span class="slider-value">{compAttack} ms</span>
      </div>
      <div class="param-row">
        <label>release</label>
        <input
          type="range"
          bind:value={compRelease}
          min="0.01"
          max="9000"
          step="1"
          disabled={!compEnabled || appState.isProcessing}
        />
        <span class="slider-value">{compRelease} ms</span>
      </div>
      <div class="param-row">
        <label>makeup</label>
        <input
          type="range"
          bind:value={compMakeup}
          min="1"
          max="64"
          step="0.5"
          disabled={!compEnabled || appState.isProcessing}
        />
        <span class="slider-value">{compMakeup}x</span>
      </div>
      <div class="param-row">
        <label>knee</label>
        <input
          type="range"
          bind:value={compKnee}
          min="1"
          max="8"
          step="0.1"
          disabled={!compEnabled || appState.isProcessing}
        />
        <span class="slider-value">{compKnee.toFixed(1)}</span>
      </div>
      <div class="param-row">
        <label>mode</label>
        <select
          bind:value={compMode}
          disabled={!compEnabled || appState.isProcessing}
        >
          <option value="downward">downward</option>
          <option value="upward">upward</option>
        </select>
      </div>
      <div class="param-row">
        <label>detection</label>
        <select
          bind:value={compDetection}
          disabled={!compEnabled || appState.isProcessing}
        >
          <option value="peak">peak</option>
          <option value="rms">rms</option>
        </select>
      </div>
      <div class="param-row">
        <label>link</label>
        <select
          bind:value={compLink}
          disabled={!compEnabled || appState.isProcessing}
        >
          <option value="average">average</option>
          <option value="maximum">maximum</option>
        </select>
      </div>
      <div class="param-row">
        <label>mix</label>
        <input
          type="range"
          bind:value={compMix}
          min="0"
          max="1"
          step="0.01"
          disabled={!compEnabled || appState.isProcessing}
        />
        <span class="slider-value">{compMix.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>level_in</label>
        <input
          type="range"
          bind:value={compLevelIn}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!compEnabled || appState.isProcessing}
        />
        <span class="slider-value">{compLevelIn.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Limiter -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={limEnabled}
          disabled={appState.isProcessing}
        />
        リミッター (alimiter)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#alimiter" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!limEnabled}>
      <div class="param-row">
        <label>limit</label>
        <input
          type="range"
          bind:value={limLimit}
          min="0.0625"
          max="1"
          step="0.001"
          disabled={!limEnabled || appState.isProcessing}
        />
        <span class="slider-value">{thresholdToDb(limLimit)} dB</span>
      </div>
      <div class="param-row">
        <label>attack</label>
        <input
          type="range"
          bind:value={limAttack}
          min="0.1"
          max="80"
          step="0.1"
          disabled={!limEnabled || appState.isProcessing}
        />
        <span class="slider-value">{limAttack} ms</span>
      </div>
      <div class="param-row">
        <label>release</label>
        <input
          type="range"
          bind:value={limRelease}
          min="1"
          max="8000"
          step="1"
          disabled={!limEnabled || appState.isProcessing}
        />
        <span class="slider-value">{limRelease} ms</span>
      </div>
      <div class="param-row">
        <label>level</label>
        <input
          type="checkbox"
          bind:checked={limLevel}
          disabled={!limEnabled || appState.isProcessing}
        />
        <span class="param-desc">auto level</span>
      </div>
      <div class="param-row">
        <label>level_in</label>
        <input
          type="range"
          bind:value={limLevelIn}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!limEnabled || appState.isProcessing}
        />
        <span class="slider-value">{limLevelIn.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>level_out</label>
        <input
          type="range"
          bind:value={limLevelOut}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!limEnabled || appState.isProcessing}
        />
        <span class="slider-value">{limLevelOut.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>asc</label>
        <input
          type="checkbox"
          bind:checked={limAsc}
          disabled={!limEnabled || appState.isProcessing}
        />
        <span class="param-desc">adaptive release</span>
      </div>
      <div class="param-row">
        <label>asc_level</label>
        <input
          type="range"
          bind:value={limAscLevel}
          min="0"
          max="1"
          step="0.01"
          disabled={!limEnabled || appState.isProcessing}
        />
        <span class="slider-value">{limAscLevel.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Gate -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={gateEnabled}
          disabled={appState.isProcessing}
        />
        ノイズゲート (agate)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#agate" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!gateEnabled}>
      <div class="param-row">
        <label>threshold</label>
        <input
          type="range"
          bind:value={gateThreshold}
          min="0"
          max="1"
          step="0.001"
          disabled={!gateEnabled || appState.isProcessing}
        />
        <span class="slider-value">{thresholdToDb(gateThreshold)} dB</span>
      </div>
      <div class="param-row">
        <label>ratio</label>
        <input
          type="range"
          bind:value={gateRatio}
          min="1"
          max="20"
          step="0.5"
          disabled={!gateEnabled || appState.isProcessing}
        />
        <span class="slider-value">{gateRatio}:1</span>
      </div>
      <div class="param-row">
        <label>range</label>
        <input
          type="range"
          bind:value={gateRange}
          min="0"
          max="1"
          step="0.001"
          disabled={!gateEnabled || appState.isProcessing}
        />
        <span class="slider-value">{gateRange.toFixed(3)}</span>
      </div>
      <div class="param-row">
        <label>attack</label>
        <input
          type="range"
          bind:value={gateAttack}
          min="0.01"
          max="9000"
          step="1"
          disabled={!gateEnabled || appState.isProcessing}
        />
        <span class="slider-value">{gateAttack} ms</span>
      </div>
      <div class="param-row">
        <label>release</label>
        <input
          type="range"
          bind:value={gateRelease}
          min="0.01"
          max="9000"
          step="1"
          disabled={!gateEnabled || appState.isProcessing}
        />
        <span class="slider-value">{gateRelease} ms</span>
      </div>
      <div class="param-row">
        <label>makeup</label>
        <input
          type="range"
          bind:value={gateMakeup}
          min="1"
          max="64"
          step="0.5"
          disabled={!gateEnabled || appState.isProcessing}
        />
        <span class="slider-value">{gateMakeup}x</span>
      </div>
      <div class="param-row">
        <label>knee</label>
        <input
          type="range"
          bind:value={gateKnee}
          min="1"
          max="8"
          step="0.1"
          disabled={!gateEnabled || appState.isProcessing}
        />
        <span class="slider-value">{gateKnee.toFixed(1)}</span>
      </div>
      <div class="param-row">
        <label>mode</label>
        <select
          bind:value={gateMode}
          disabled={!gateEnabled || appState.isProcessing}
        >
          <option value="downward">downward</option>
          <option value="upward">upward</option>
        </select>
      </div>
      <div class="param-row">
        <label>detection</label>
        <select
          bind:value={gateDetection}
          disabled={!gateEnabled || appState.isProcessing}
        >
          <option value="peak">peak</option>
          <option value="rms">rms</option>
        </select>
      </div>
      <div class="param-row">
        <label>link</label>
        <select
          bind:value={gateLink}
          disabled={!gateEnabled || appState.isProcessing}
        >
          <option value="average">average</option>
          <option value="maximum">maximum</option>
        </select>
      </div>
    </div>
  </div>
</div>

<style>
  .dynamics-settings {
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
  .slider-value {
    font-size: 0.8rem;
    color: #d4d4d8;
    min-width: 72px;
    text-align: right;
    font-family: monospace;
  }
  .param-desc {
    font-size: 0.75rem;
    color: #737373;
  }
</style>
