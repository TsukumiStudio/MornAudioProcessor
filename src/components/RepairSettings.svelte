<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { RepairFilterOption } from "$lib/types";

  const appState = getAppState();

  // Adeclick
  let adeclickEnabled = $state(false);
  let adeclickWindow = $state(55);
  let adeclickOverlap = $state(75);
  let adeclickArorder = $state(2);
  let adeclickThreshold = $state(2);
  let adeclickBurst = $state(2);
  let adeclickMethod = $state<"add" | "save">("add");

  // Adeclip
  let adeclipEnabled = $state(false);
  let adeclipWindow = $state(55);
  let adeclipOverlap = $state(75);
  let adeclipArorder = $state(8);
  let adeclipThreshold = $state(10);
  let adeclipHsize = $state(1000);
  let adeclipMethod = $state<"add" | "save">("add");

  // Afwtdn
  let afwtdnEnabled = $state(false);
  let afwtdnSigma = $state(0);
  let afwtdnLevels = $state(10);
  let afwtdnWavet = $state<"sym2" | "sym4" | "rbior68" | "deb10" | "sym10" | "coif5" | "bl3">("sym2");
  let afwtdnPercent = $state(85);
  let afwtdnProfile = $state(false);
  let afwtdnAdaptive = $state(false);
  let afwtdnSamples = $state(8192);
  let afwtdnSoftness = $state(1);

  // Deesser
  let deesserEnabled = $state(false);
  let deesserI = $state(0);
  let deesserM = $state(0.5);
  let deesserF = $state(0.5);
  let deesserS = $state<"i" | "o" | "e">("i");

  function updateStore() {
    const anyEnabled = adeclickEnabled || adeclipEnabled || afwtdnEnabled || deesserEnabled;
    if (!anyEnabled) {
      appState.repairFilter = null;
      return;
    }
    const opt: RepairFilterOption = {
      adeclick: {
        enabled: adeclickEnabled,
        window: adeclickWindow,
        overlap: adeclickOverlap,
        arorder: adeclickArorder,
        threshold: adeclickThreshold,
        burst: adeclickBurst,
        method: adeclickMethod,
      },
      adeclip: {
        enabled: adeclipEnabled,
        window: adeclipWindow,
        overlap: adeclipOverlap,
        arorder: adeclipArorder,
        threshold: adeclipThreshold,
        hsize: adeclipHsize,
        method: adeclipMethod,
      },
      afwtdn: {
        enabled: afwtdnEnabled,
        sigma: afwtdnSigma,
        levels: afwtdnLevels,
        wavet: afwtdnWavet,
        percent: afwtdnPercent,
        profile: afwtdnProfile,
        adaptive: afwtdnAdaptive,
        samples: afwtdnSamples,
        softness: afwtdnSoftness,
      },
      deesser: {
        enabled: deesserEnabled,
        i: deesserI,
        m: deesserM,
        f: deesserF,
        s: deesserS,
      },
    };
    appState.repairFilter = opt;
  }

  $effect(() => {
    updateStore();
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      adeclickEnabled = false;
      adeclickWindow = 55;
      adeclickOverlap = 75;
      adeclickArorder = 2;
      adeclickThreshold = 2;
      adeclickBurst = 2;
      adeclickMethod = "add";
      adeclipEnabled = false;
      adeclipWindow = 55;
      adeclipOverlap = 75;
      adeclipArorder = 8;
      adeclipThreshold = 10;
      adeclipHsize = 1000;
      adeclipMethod = "add";
      afwtdnEnabled = false;
      afwtdnSigma = 0;
      afwtdnLevels = 10;
      afwtdnWavet = "sym2";
      afwtdnPercent = 85;
      afwtdnProfile = false;
      afwtdnAdaptive = false;
      afwtdnSamples = 8192;
      afwtdnSoftness = 1;
      deesserEnabled = false;
      deesserI = 0;
      deesserM = 0.5;
      deesserF = 0.5;
      deesserS = "i";
    }
  });
</script>

<div class="repair-settings">
  <!-- Adeclick -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={adeclickEnabled}
          disabled={appState.isProcessing}
        />
        クリック除去 (adeclick)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#adeclick" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!adeclickEnabled}>
      <div class="param-row">
        <label>window</label>
        <input
          type="range"
          bind:value={adeclickWindow}
          min="10"
          max="100"
          step="1"
          disabled={!adeclickEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeclickWindow} ms</span>
      </div>
      <div class="param-row">
        <label>overlap</label>
        <input
          type="range"
          bind:value={adeclickOverlap}
          min="50"
          max="95"
          step="1"
          disabled={!adeclickEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeclickOverlap} %</span>
      </div>
      <div class="param-row">
        <label>arorder</label>
        <input
          type="range"
          bind:value={adeclickArorder}
          min="0"
          max="25"
          step="1"
          disabled={!adeclickEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeclickArorder} %</span>
      </div>
      <div class="param-row">
        <label>threshold</label>
        <input
          type="range"
          bind:value={adeclickThreshold}
          min="1"
          max="100"
          step="1"
          disabled={!adeclickEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeclickThreshold}</span>
      </div>
      <div class="param-row">
        <label>burst</label>
        <input
          type="range"
          bind:value={adeclickBurst}
          min="0"
          max="10"
          step="1"
          disabled={!adeclickEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeclickBurst} %</span>
      </div>
      <div class="param-row">
        <label>method</label>
        <select
          bind:value={adeclickMethod}
          disabled={!adeclickEnabled || appState.isProcessing}
        >
          <option value="add">add</option>
          <option value="save">save</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Adeclip -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={adeclipEnabled}
          disabled={appState.isProcessing}
        />
        クリップ除去 (adeclip)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#adeclip" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!adeclipEnabled}>
      <div class="param-row">
        <label>window</label>
        <input
          type="range"
          bind:value={adeclipWindow}
          min="10"
          max="100"
          step="1"
          disabled={!adeclipEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeclipWindow} ms</span>
      </div>
      <div class="param-row">
        <label>overlap</label>
        <input
          type="range"
          bind:value={adeclipOverlap}
          min="50"
          max="95"
          step="1"
          disabled={!adeclipEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeclipOverlap} %</span>
      </div>
      <div class="param-row">
        <label>arorder</label>
        <input
          type="range"
          bind:value={adeclipArorder}
          min="0"
          max="25"
          step="1"
          disabled={!adeclipEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeclipArorder} %</span>
      </div>
      <div class="param-row">
        <label>threshold</label>
        <input
          type="range"
          bind:value={adeclipThreshold}
          min="1"
          max="100"
          step="1"
          disabled={!adeclipEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeclipThreshold}</span>
      </div>
      <div class="param-row">
        <label>hsize</label>
        <input
          type="number"
          bind:value={adeclipHsize}
          min="100"
          max="9999"
          step="1"
          disabled={!adeclipEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>method</label>
        <select
          bind:value={adeclipMethod}
          disabled={!adeclipEnabled || appState.isProcessing}
        >
          <option value="add">add</option>
          <option value="save">save</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Afwtdn -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={afwtdnEnabled}
          disabled={appState.isProcessing}
        />
        ウェーブレットノイズ除去 (afwtdn)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#afwtdn" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!afwtdnEnabled}>
      <div class="param-row">
        <label>sigma</label>
        <input
          type="range"
          bind:value={afwtdnSigma}
          min="0"
          max="1"
          step="0.01"
          disabled={!afwtdnEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afwtdnSigma.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>levels</label>
        <input
          type="number"
          bind:value={afwtdnLevels}
          min="1"
          max="12"
          step="1"
          disabled={!afwtdnEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>wavet</label>
        <select
          bind:value={afwtdnWavet}
          disabled={!afwtdnEnabled || appState.isProcessing}
        >
          <option value="sym2">sym2</option>
          <option value="sym4">sym4</option>
          <option value="rbior68">rbior68</option>
          <option value="deb10">deb10</option>
          <option value="sym10">sym10</option>
          <option value="coif5">coif5</option>
          <option value="bl3">bl3</option>
        </select>
      </div>
      <div class="param-row">
        <label>percent</label>
        <input
          type="range"
          bind:value={afwtdnPercent}
          min="0"
          max="100"
          step="1"
          disabled={!afwtdnEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afwtdnPercent} %</span>
      </div>
      <div class="param-row">
        <label>profile</label>
        <input
          type="checkbox"
          bind:checked={afwtdnProfile}
          disabled={!afwtdnEnabled || appState.isProcessing}
        />
        <span class="param-desc">noise profile</span>
      </div>
      <div class="param-row">
        <label>adaptive</label>
        <input
          type="checkbox"
          bind:checked={afwtdnAdaptive}
          disabled={!afwtdnEnabled || appState.isProcessing}
        />
        <span class="param-desc">adaptive mode</span>
      </div>
      <div class="param-row">
        <label>samples</label>
        <input
          type="number"
          bind:value={afwtdnSamples}
          min="512"
          max="65536"
          step="1"
          disabled={!afwtdnEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>softness</label>
        <input
          type="range"
          bind:value={afwtdnSoftness}
          min="0"
          max="10"
          step="0.1"
          disabled={!afwtdnEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afwtdnSoftness.toFixed(1)}</span>
      </div>
    </div>
  </div>

  <!-- Deesser -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={deesserEnabled}
          disabled={appState.isProcessing}
        />
        ディエッサー (deesser)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#deesser" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!deesserEnabled}>
      <div class="param-row">
        <label>i</label>
        <input
          type="range"
          bind:value={deesserI}
          min="0"
          max="1"
          step="0.01"
          disabled={!deesserEnabled || appState.isProcessing}
        />
        <span class="slider-value">{deesserI.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>m</label>
        <input
          type="range"
          bind:value={deesserM}
          min="0"
          max="1"
          step="0.01"
          disabled={!deesserEnabled || appState.isProcessing}
        />
        <span class="slider-value">{deesserM.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>f</label>
        <input
          type="range"
          bind:value={deesserF}
          min="0"
          max="1"
          step="0.01"
          disabled={!deesserEnabled || appState.isProcessing}
        />
        <span class="slider-value">{deesserF.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>s</label>
        <select
          bind:value={deesserS}
          disabled={!deesserEnabled || appState.isProcessing}
        >
          <option value="i">i</option>
          <option value="o">o</option>
          <option value="e">e</option>
        </select>
      </div>
    </div>
  </div>
</div>

<style>
  .repair-settings {
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
  .unit {
    font-size: 0.8rem;
    color: #a3a3a3;
    min-width: 24px;
  }
</style>
