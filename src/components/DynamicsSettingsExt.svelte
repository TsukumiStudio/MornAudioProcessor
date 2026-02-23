<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { DynamicsFilterExtOption } from "$lib/types";

  const appState = getAppState();

  // Dynaudnorm
  let dnEnabled = $state(false);
  let dnFramelen = $state(500);
  let dnGausssize = $state(31);
  let dnPeak = $state(0.95);
  let dnMaxgain = $state(10);
  let dnTargetrms = $state(0);
  let dnCoupling = $state(true);
  let dnCorrectdc = $state(false);
  let dnAltboundary = $state(false);
  let dnCompress = $state(0);
  let dnThreshold = $state(0);
  let dnOverlap = $state(0);

  // Speechnorm
  let snEnabled = $state(false);
  let snPeak = $state(0.95);
  let snExpansion = $state(2);
  let snCompression = $state(2);
  let snThreshold = $state(0);
  let snRaise = $state(0.001);
  let snFall = $state(0.001);
  let snInvert = $state(false);
  let snLink = $state(false);
  let snRms = $state(0);

  // Compand
  let cmpEnabled = $state(false);
  let cmpAttacks = $state("0");
  let cmpDecays = $state("0.8");
  let cmpPoints = $state("-70/-70|-60/-20|1/0");
  let cmpSoftKnee = $state(0.01);
  let cmpGain = $state(0);
  let cmpVolume = $state(0);
  let cmpDelay = $state(0);

  // Asoftclip
  let ascEnabled = $state(false);
  let ascType = $state<"hard" | "tanh" | "atan" | "cubic" | "exp" | "alg" | "quintic" | "sin" | "erf">("hard");
  let ascThreshold = $state(1);
  let ascOutput = $state(1);
  let ascParam = $state(1);
  let ascOversample = $state(1);

  // Apsyclip
  let apcEnabled = $state(false);
  let apcLevelIn = $state(1);
  let apcLevelOut = $state(1);
  let apcClip = $state(1);
  let apcDiff = $state(false);
  let apcAdaptive = $state(0.5);
  let apcIterations = $state(10);
  let apcLevel = $state(false);

  function updateStore() {
    const anyEnabled = dnEnabled || snEnabled || cmpEnabled || ascEnabled || apcEnabled;
    if (!anyEnabled) {
      appState.dynamicsFilterExt = null;
      return;
    }
    const opt: DynamicsFilterExtOption = {
      dynaudnorm: {
        enabled: dnEnabled,
        framelen: dnFramelen,
        gausssize: dnGausssize,
        peak: dnPeak,
        maxgain: dnMaxgain,
        targetrms: dnTargetrms,
        coupling: dnCoupling,
        correctdc: dnCorrectdc,
        altboundary: dnAltboundary,
        compress: dnCompress,
        threshold: dnThreshold,
        overlap: dnOverlap,
      },
      speechnorm: {
        enabled: snEnabled,
        peak: snPeak,
        expansion: snExpansion,
        compression: snCompression,
        threshold: snThreshold,
        raise: snRaise,
        fall: snFall,
        invert: snInvert,
        link: snLink,
        rms: snRms,
      },
      compand: {
        enabled: cmpEnabled,
        attacks: cmpAttacks,
        decays: cmpDecays,
        points: cmpPoints,
        soft_knee: cmpSoftKnee,
        gain: cmpGain,
        volume: cmpVolume,
        delay: cmpDelay,
      },
      asoftclip: {
        enabled: ascEnabled,
        type: ascType,
        threshold: ascThreshold,
        output: ascOutput,
        param: ascParam,
        oversample: ascOversample,
      },
      apsyclip: {
        enabled: apcEnabled,
        level_in: apcLevelIn,
        level_out: apcLevelOut,
        clip: apcClip,
        diff: apcDiff,
        adaptive: apcAdaptive,
        iterations: apcIterations,
        level: apcLevel,
      },
    };
    appState.dynamicsFilterExt = opt;
  }

  $effect(() => {
    updateStore();
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      dnEnabled = false;
      dnFramelen = 500;
      dnGausssize = 31;
      dnPeak = 0.95;
      dnMaxgain = 10;
      dnTargetrms = 0;
      dnCoupling = true;
      dnCorrectdc = false;
      dnAltboundary = false;
      dnCompress = 0;
      dnThreshold = 0;
      dnOverlap = 0;
      snEnabled = false;
      snPeak = 0.95;
      snExpansion = 2;
      snCompression = 2;
      snThreshold = 0;
      snRaise = 0.001;
      snFall = 0.001;
      snInvert = false;
      snLink = false;
      snRms = 0;
      cmpEnabled = false;
      cmpAttacks = "0";
      cmpDecays = "0.8";
      cmpPoints = "-70/-70|-60/-20|1/0";
      cmpSoftKnee = 0.01;
      cmpGain = 0;
      cmpVolume = 0;
      cmpDelay = 0;
      ascEnabled = false;
      ascType = "hard";
      ascThreshold = 1;
      ascOutput = 1;
      ascParam = 1;
      ascOversample = 1;
      apcEnabled = false;
      apcLevelIn = 1;
      apcLevelOut = 1;
      apcClip = 1;
      apcDiff = false;
      apcAdaptive = 0.5;
      apcIterations = 10;
      apcLevel = false;
    }
  });
</script>

<div class="dynamics-settings-ext">
  <!-- Dynaudnorm -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={dnEnabled}
          disabled={appState.isProcessing}
        />
        ダイナミック正規化 (dynaudnorm)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#dynaudnorm" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!dnEnabled}>
      <div class="param-row">
        <label>framelen</label>
        <input
          type="number"
          bind:value={dnFramelen}
          min="10"
          max="8000"
          step="1"
          disabled={!dnEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>gausssize</label>
        <input
          type="number"
          bind:value={dnGausssize}
          min="3"
          max="301"
          step="2"
          disabled={!dnEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>peak</label>
        <input
          type="range"
          bind:value={dnPeak}
          min="0"
          max="1"
          step="0.01"
          disabled={!dnEnabled || appState.isProcessing}
        />
        <span class="slider-value">{dnPeak.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>maxgain</label>
        <input
          type="range"
          bind:value={dnMaxgain}
          min="1"
          max="100"
          step="1"
          disabled={!dnEnabled || appState.isProcessing}
        />
        <span class="slider-value">{dnMaxgain}</span>
      </div>
      <div class="param-row">
        <label>targetrms</label>
        <input
          type="range"
          bind:value={dnTargetrms}
          min="0"
          max="1"
          step="0.01"
          disabled={!dnEnabled || appState.isProcessing}
        />
        <span class="slider-value">{dnTargetrms.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>coupling</label>
        <input
          type="checkbox"
          bind:checked={dnCoupling}
          disabled={!dnEnabled || appState.isProcessing}
        />
        <span class="param-desc">channel coupling</span>
      </div>
      <div class="param-row">
        <label>correctdc</label>
        <input
          type="checkbox"
          bind:checked={dnCorrectdc}
          disabled={!dnEnabled || appState.isProcessing}
        />
        <span class="param-desc">DC correction</span>
      </div>
      <div class="param-row">
        <label>altboundary</label>
        <input
          type="checkbox"
          bind:checked={dnAltboundary}
          disabled={!dnEnabled || appState.isProcessing}
        />
        <span class="param-desc">alternative boundary</span>
      </div>
      <div class="param-row">
        <label>compress</label>
        <input
          type="range"
          bind:value={dnCompress}
          min="0"
          max="30"
          step="0.5"
          disabled={!dnEnabled || appState.isProcessing}
        />
        <span class="slider-value">{dnCompress.toFixed(1)}</span>
      </div>
      <div class="param-row">
        <label>threshold</label>
        <input
          type="range"
          bind:value={dnThreshold}
          min="0"
          max="1"
          step="0.01"
          disabled={!dnEnabled || appState.isProcessing}
        />
        <span class="slider-value">{dnThreshold.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>overlap</label>
        <input
          type="range"
          bind:value={dnOverlap}
          min="0"
          max="1"
          step="0.01"
          disabled={!dnEnabled || appState.isProcessing}
        />
        <span class="slider-value">{dnOverlap.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Speechnorm -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={snEnabled}
          disabled={appState.isProcessing}
        />
        スピーチ正規化 (speechnorm)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#speechnorm" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!snEnabled}>
      <div class="param-row">
        <label>peak</label>
        <input
          type="range"
          bind:value={snPeak}
          min="0"
          max="1"
          step="0.01"
          disabled={!snEnabled || appState.isProcessing}
        />
        <span class="slider-value">{snPeak.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>expansion</label>
        <input
          type="range"
          bind:value={snExpansion}
          min="1"
          max="50"
          step="0.5"
          disabled={!snEnabled || appState.isProcessing}
        />
        <span class="slider-value">{snExpansion.toFixed(1)}</span>
      </div>
      <div class="param-row">
        <label>compression</label>
        <input
          type="range"
          bind:value={snCompression}
          min="1"
          max="50"
          step="0.5"
          disabled={!snEnabled || appState.isProcessing}
        />
        <span class="slider-value">{snCompression.toFixed(1)}</span>
      </div>
      <div class="param-row">
        <label>threshold</label>
        <input
          type="range"
          bind:value={snThreshold}
          min="0"
          max="1"
          step="0.01"
          disabled={!snEnabled || appState.isProcessing}
        />
        <span class="slider-value">{snThreshold.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>raise</label>
        <input
          type="range"
          bind:value={snRaise}
          min="0"
          max="1"
          step="0.001"
          disabled={!snEnabled || appState.isProcessing}
        />
        <span class="slider-value">{snRaise.toFixed(3)}</span>
      </div>
      <div class="param-row">
        <label>fall</label>
        <input
          type="range"
          bind:value={snFall}
          min="0"
          max="1"
          step="0.001"
          disabled={!snEnabled || appState.isProcessing}
        />
        <span class="slider-value">{snFall.toFixed(3)}</span>
      </div>
      <div class="param-row">
        <label>invert</label>
        <input
          type="checkbox"
          bind:checked={snInvert}
          disabled={!snEnabled || appState.isProcessing}
        />
        <span class="param-desc">invert filtering</span>
      </div>
      <div class="param-row">
        <label>link</label>
        <input
          type="checkbox"
          bind:checked={snLink}
          disabled={!snEnabled || appState.isProcessing}
        />
        <span class="param-desc">link channels</span>
      </div>
      <div class="param-row">
        <label>rms</label>
        <input
          type="range"
          bind:value={snRms}
          min="0"
          max="1"
          step="0.01"
          disabled={!snEnabled || appState.isProcessing}
        />
        <span class="slider-value">{snRms.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Compand -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={cmpEnabled}
          disabled={appState.isProcessing}
        />
        コンパンド (compand)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#compand" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!cmpEnabled}>
      <div class="param-row">
        <label>attacks</label>
        <input
          type="text"
          bind:value={cmpAttacks}
          disabled={!cmpEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>decays</label>
        <input
          type="text"
          bind:value={cmpDecays}
          disabled={!cmpEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>points</label>
        <input
          type="text"
          bind:value={cmpPoints}
          disabled={!cmpEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>soft_knee</label>
        <input
          type="range"
          bind:value={cmpSoftKnee}
          min="0"
          max="1"
          step="0.001"
          disabled={!cmpEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cmpSoftKnee.toFixed(3)}</span>
      </div>
      <div class="param-row">
        <label>gain</label>
        <input
          type="range"
          bind:value={cmpGain}
          min="-30"
          max="30"
          step="0.5"
          disabled={!cmpEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cmpGain > 0 ? "+" : ""}{cmpGain} dB</span>
      </div>
      <div class="param-row">
        <label>volume</label>
        <input
          type="range"
          bind:value={cmpVolume}
          min="-30"
          max="30"
          step="0.5"
          disabled={!cmpEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cmpVolume > 0 ? "+" : ""}{cmpVolume} dB</span>
      </div>
      <div class="param-row">
        <label>delay</label>
        <input
          type="range"
          bind:value={cmpDelay}
          min="0"
          max="5"
          step="0.01"
          disabled={!cmpEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cmpDelay.toFixed(2)} sec</span>
      </div>
    </div>
  </div>

  <!-- Asoftclip -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={ascEnabled}
          disabled={appState.isProcessing}
        />
        ソフトクリップ (asoftclip)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#asoftclip" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!ascEnabled}>
      <div class="param-row">
        <label>type</label>
        <select
          bind:value={ascType}
          disabled={!ascEnabled || appState.isProcessing}
        >
          <option value="hard">hard</option>
          <option value="tanh">tanh</option>
          <option value="atan">atan</option>
          <option value="cubic">cubic</option>
          <option value="exp">exp</option>
          <option value="alg">alg</option>
          <option value="quintic">quintic</option>
          <option value="sin">sin</option>
          <option value="erf">erf</option>
        </select>
      </div>
      <div class="param-row">
        <label>threshold</label>
        <input
          type="range"
          bind:value={ascThreshold}
          min="0"
          max="1"
          step="0.01"
          disabled={!ascEnabled || appState.isProcessing}
        />
        <span class="slider-value">{ascThreshold.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>output</label>
        <input
          type="range"
          bind:value={ascOutput}
          min="0"
          max="1"
          step="0.01"
          disabled={!ascEnabled || appState.isProcessing}
        />
        <span class="slider-value">{ascOutput.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>param</label>
        <input
          type="range"
          bind:value={ascParam}
          min="0"
          max="10"
          step="0.01"
          disabled={!ascEnabled || appState.isProcessing}
        />
        <span class="slider-value">{ascParam.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>oversample</label>
        <input
          type="range"
          bind:value={ascOversample}
          min="1"
          max="64"
          step="1"
          disabled={!ascEnabled || appState.isProcessing}
        />
        <span class="slider-value">{ascOversample}</span>
      </div>
    </div>
  </div>

  <!-- Apsyclip -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={apcEnabled}
          disabled={appState.isProcessing}
        />
        サイコアコースティッククリップ (apsyclip)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#apsyclip" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!apcEnabled}>
      <div class="param-row">
        <label>level_in</label>
        <input
          type="range"
          bind:value={apcLevelIn}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!apcEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apcLevelIn.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>level_out</label>
        <input
          type="range"
          bind:value={apcLevelOut}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!apcEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apcLevelOut.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>clip</label>
        <input
          type="range"
          bind:value={apcClip}
          min="0"
          max="2"
          step="0.01"
          disabled={!apcEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apcClip.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>diff</label>
        <input
          type="checkbox"
          bind:checked={apcDiff}
          disabled={!apcEnabled || appState.isProcessing}
        />
        <span class="param-desc">output difference</span>
      </div>
      <div class="param-row">
        <label>adaptive</label>
        <input
          type="range"
          bind:value={apcAdaptive}
          min="0"
          max="1"
          step="0.01"
          disabled={!apcEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apcAdaptive.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>iterations</label>
        <input
          type="number"
          bind:value={apcIterations}
          min="1"
          max="20"
          step="1"
          disabled={!apcEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>level</label>
        <input
          type="checkbox"
          bind:checked={apcLevel}
          disabled={!apcEnabled || appState.isProcessing}
        />
        <span class="param-desc">auto level</span>
      </div>
    </div>
  </div>
</div>

<style>
  .dynamics-settings-ext {
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
  .param-row input[type="text"] {
    width: 200px;
    padding: 4px 6px;
    border: 1px solid #3f3f36;
    border-radius: 4px;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
    font-family: monospace;
  }
  .param-row input[type="text"]:disabled {
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
    min-width: 64px;
    text-align: right;
    font-family: monospace;
  }
  .param-desc {
    font-size: 0.75rem;
    color: #737373;
  }
</style>
