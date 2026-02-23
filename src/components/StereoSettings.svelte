<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { StereoFilterOption, StereoMode, BalanceMode } from "$lib/types";

  const appState = getAppState();

  // Stereotools
  let stEnabled = $state(false);
  let stLevelIn = $state(1);
  let stLevelOut = $state(1);
  let stBalanceIn = $state(0);
  let stBalanceOut = $state(0);
  let stSoftclip = $state(false);
  let stMutel = $state(false);
  let stMuter = $state(false);
  let stPhasel = $state(false);
  let stPhaser = $state(false);
  let stMode = $state<StereoMode>("lr>lr");
  let stSlev = $state(1);
  let stSbal = $state(0);
  let stMlev = $state(1);
  let stMpan = $state(0);
  let stBase = $state(0);
  let stDelay = $state(0);
  let stSclevel = $state(1);
  let stPhase = $state(0);
  let stBmodeIn = $state<BalanceMode>("balance");
  let stBmodeOut = $state<BalanceMode>("balance");

  // Stereowiden
  let swEnabled = $state(false);
  let swDelay = $state(20);
  let swFeedback = $state(0.3);
  let swCrossfeed = $state(0.3);
  let swDrymix = $state(0.8);

  // Extrastereo
  let esEnabled = $state(false);
  let esM = $state(2.5);
  let esC = $state(true);

  // Crossfeed
  let cfEnabled = $state(false);
  let cfStrength = $state(0.2);
  let cfRange = $state(0.5);
  let cfSlope = $state(0.5);
  let cfLevelIn = $state(0.9);
  let cfLevelOut = $state(1);

  // Haas
  let haasEnabled = $state(false);
  let haasLevelIn = $state(1);
  let haasLevelOut = $state(1);
  let haasSideGain = $state(1);
  let haasMiddleSource = $state<"left" | "right" | "mid" | "side">("left");
  let haasMiddlePhase = $state(false);
  let haasLeftDelay = $state(2.05);
  let haasLeftBalance = $state(-1);
  let haasLeftGain = $state(1);
  let haasLeftPhase = $state(false);
  let haasRightDelay = $state(2.12);
  let haasRightBalance = $state(1);
  let haasRightGain = $state(1);
  let haasRightPhase = $state(true);

  // Dialoguenhance
  let deEnabled = $state(false);
  let deOriginal = $state(1);
  let deEnhance = $state(1);
  let deVoice = $state(2);

  function updateStore() {
    const anyEnabled =
      stEnabled ||
      swEnabled ||
      esEnabled ||
      cfEnabled ||
      haasEnabled ||
      deEnabled;
    if (!anyEnabled) {
      appState.stereoFilter = null;
      return;
    }
    const opt: StereoFilterOption = {
      stereotools: {
        enabled: stEnabled,
        level_in: stLevelIn,
        level_out: stLevelOut,
        balance_in: stBalanceIn,
        balance_out: stBalanceOut,
        softclip: stSoftclip,
        mutel: stMutel,
        muter: stMuter,
        phasel: stPhasel,
        phaser: stPhaser,
        mode: stMode,
        slev: stSlev,
        sbal: stSbal,
        mlev: stMlev,
        mpan: stMpan,
        base: stBase,
        delay: stDelay,
        sclevel: stSclevel,
        phase: stPhase,
        bmode_in: stBmodeIn,
        bmode_out: stBmodeOut,
      },
      stereowiden: {
        enabled: swEnabled,
        delay: swDelay,
        feedback: swFeedback,
        crossfeed: swCrossfeed,
        drymix: swDrymix,
      },
      extrastereo: {
        enabled: esEnabled,
        m: esM,
        c: esC,
      },
      crossfeed: {
        enabled: cfEnabled,
        strength: cfStrength,
        range: cfRange,
        slope: cfSlope,
        level_in: cfLevelIn,
        level_out: cfLevelOut,
      },
      haas: {
        enabled: haasEnabled,
        level_in: haasLevelIn,
        level_out: haasLevelOut,
        side_gain: haasSideGain,
        middle_source: haasMiddleSource,
        middle_phase: haasMiddlePhase,
        left_delay: haasLeftDelay,
        left_balance: haasLeftBalance,
        left_gain: haasLeftGain,
        left_phase: haasLeftPhase,
        right_delay: haasRightDelay,
        right_balance: haasRightBalance,
        right_gain: haasRightGain,
        right_phase: haasRightPhase,
      },
      dialoguenhance: {
        enabled: deEnabled,
        original: deOriginal,
        enhance: deEnhance,
        voice: deVoice,
      },
    };
    appState.stereoFilter = opt;
  }

  $effect(() => {
    updateStore();
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      stEnabled = false;
      stLevelIn = 1;
      stLevelOut = 1;
      stBalanceIn = 0;
      stBalanceOut = 0;
      stSoftclip = false;
      stMutel = false;
      stMuter = false;
      stPhasel = false;
      stPhaser = false;
      stMode = "lr>lr";
      stSlev = 1;
      stSbal = 0;
      stMlev = 1;
      stMpan = 0;
      stBase = 0;
      stDelay = 0;
      stSclevel = 1;
      stPhase = 0;
      stBmodeIn = "balance";
      stBmodeOut = "balance";
      swEnabled = false;
      swDelay = 20;
      swFeedback = 0.3;
      swCrossfeed = 0.3;
      swDrymix = 0.8;
      esEnabled = false;
      esM = 2.5;
      esC = true;
      cfEnabled = false;
      cfStrength = 0.2;
      cfRange = 0.5;
      cfSlope = 0.5;
      cfLevelIn = 0.9;
      cfLevelOut = 1;
      haasEnabled = false;
      haasLevelIn = 1;
      haasLevelOut = 1;
      haasSideGain = 1;
      haasMiddleSource = "left";
      haasMiddlePhase = false;
      haasLeftDelay = 2.05;
      haasLeftBalance = -1;
      haasLeftGain = 1;
      haasLeftPhase = false;
      haasRightDelay = 2.12;
      haasRightBalance = 1;
      haasRightGain = 1;
      haasRightPhase = true;
      deEnabled = false;
      deOriginal = 1;
      deEnhance = 1;
      deVoice = 2;
    }
  });
</script>

<div class="stereo-settings">
  <!-- Stereotools -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={stEnabled}
          disabled={appState.isProcessing}
        />
        ステレオツール (stereotools)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#stereotools" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!stEnabled}>
      <div class="param-row">
        <label>level_in</label>
        <input
          type="range"
          bind:value={stLevelIn}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stLevelIn.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>level_out</label>
        <input
          type="range"
          bind:value={stLevelOut}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stLevelOut.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>balance_in</label>
        <input
          type="range"
          bind:value={stBalanceIn}
          min="-1"
          max="1"
          step="0.01"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stBalanceIn.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>balance_out</label>
        <input
          type="range"
          bind:value={stBalanceOut}
          min="-1"
          max="1"
          step="0.01"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stBalanceOut.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>softclip</label>
        <input
          type="checkbox"
          bind:checked={stSoftclip}
          disabled={!stEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>mutel</label>
        <input
          type="checkbox"
          bind:checked={stMutel}
          disabled={!stEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>muter</label>
        <input
          type="checkbox"
          bind:checked={stMuter}
          disabled={!stEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>phasel</label>
        <input
          type="checkbox"
          bind:checked={stPhasel}
          disabled={!stEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>phaser</label>
        <input
          type="checkbox"
          bind:checked={stPhaser}
          disabled={!stEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>mode</label>
        <select
          bind:value={stMode}
          disabled={!stEnabled || appState.isProcessing}
        >
          <option value="lr>lr">lr&gt;lr</option>
          <option value="lr>ms">lr&gt;ms</option>
          <option value="ms>lr">ms&gt;lr</option>
          <option value="lr>ll">lr&gt;ll</option>
          <option value="lr>rr">lr&gt;rr</option>
          <option value="lr>l+r">lr&gt;l+r</option>
          <option value="lr>rl">lr&gt;rl</option>
          <option value="ms>ll">ms&gt;ll</option>
          <option value="ms>rr">ms&gt;rr</option>
          <option value="ms>rl">ms&gt;rl</option>
          <option value="lr>l-r">lr&gt;l-r</option>
        </select>
      </div>
      <div class="param-row">
        <label>slev</label>
        <input
          type="range"
          bind:value={stSlev}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stSlev.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>sbal</label>
        <input
          type="range"
          bind:value={stSbal}
          min="-1"
          max="1"
          step="0.01"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stSbal.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>mlev</label>
        <input
          type="range"
          bind:value={stMlev}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stMlev.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>mpan</label>
        <input
          type="range"
          bind:value={stMpan}
          min="-1"
          max="1"
          step="0.01"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stMpan.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>base</label>
        <input
          type="range"
          bind:value={stBase}
          min="-1"
          max="1"
          step="0.01"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stBase.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>delay</label>
        <input
          type="range"
          bind:value={stDelay}
          min="-20"
          max="20"
          step="0.1"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stDelay.toFixed(1)} ms</span>
      </div>
      <div class="param-row">
        <label>sclevel</label>
        <input
          type="range"
          bind:value={stSclevel}
          min="1"
          max="100"
          step="1"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stSclevel}</span>
      </div>
      <div class="param-row">
        <label>phase</label>
        <input
          type="range"
          bind:value={stPhase}
          min="0"
          max="360"
          step="1"
          disabled={!stEnabled || appState.isProcessing}
        />
        <span class="slider-value">{stPhase}°</span>
      </div>
      <div class="param-row">
        <label>bmode_in</label>
        <select
          bind:value={stBmodeIn}
          disabled={!stEnabled || appState.isProcessing}
        >
          <option value="balance">balance</option>
          <option value="amplitude">amplitude</option>
          <option value="power">power</option>
        </select>
      </div>
      <div class="param-row">
        <label>bmode_out</label>
        <select
          bind:value={stBmodeOut}
          disabled={!stEnabled || appState.isProcessing}
        >
          <option value="balance">balance</option>
          <option value="amplitude">amplitude</option>
          <option value="power">power</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Stereowiden -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={swEnabled}
          disabled={appState.isProcessing}
        />
        ステレオワイド化 (stereowiden)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#stereowiden" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!swEnabled}>
      <div class="param-row">
        <label>delay</label>
        <input
          type="range"
          bind:value={swDelay}
          min="1"
          max="100"
          step="1"
          disabled={!swEnabled || appState.isProcessing}
        />
        <span class="slider-value">{swDelay} ms</span>
      </div>
      <div class="param-row">
        <label>feedback</label>
        <input
          type="range"
          bind:value={swFeedback}
          min="0"
          max="0.9"
          step="0.01"
          disabled={!swEnabled || appState.isProcessing}
        />
        <span class="slider-value">{swFeedback.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>crossfeed</label>
        <input
          type="range"
          bind:value={swCrossfeed}
          min="0"
          max="0.8"
          step="0.01"
          disabled={!swEnabled || appState.isProcessing}
        />
        <span class="slider-value">{swCrossfeed.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>drymix</label>
        <input
          type="range"
          bind:value={swDrymix}
          min="0"
          max="1"
          step="0.01"
          disabled={!swEnabled || appState.isProcessing}
        />
        <span class="slider-value">{swDrymix.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Extrastereo -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={esEnabled}
          disabled={appState.isProcessing}
        />
        エクストラステレオ (extrastereo)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#extrastereo" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!esEnabled}>
      <div class="param-row">
        <label>m</label>
        <input
          type="range"
          bind:value={esM}
          min="-10"
          max="10"
          step="0.1"
          disabled={!esEnabled || appState.isProcessing}
        />
        <span class="slider-value">{esM.toFixed(1)}</span>
      </div>
      <div class="param-row">
        <label>c</label>
        <input
          type="checkbox"
          bind:checked={esC}
          disabled={!esEnabled || appState.isProcessing}
        />
        <span class="param-desc">clipping</span>
      </div>
    </div>
  </div>

  <!-- Crossfeed -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={cfEnabled}
          disabled={appState.isProcessing}
        />
        クロスフィード (crossfeed)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#crossfeed" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!cfEnabled}>
      <div class="param-row">
        <label>strength</label>
        <input
          type="range"
          bind:value={cfStrength}
          min="0"
          max="1"
          step="0.01"
          disabled={!cfEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cfStrength.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>range</label>
        <input
          type="range"
          bind:value={cfRange}
          min="0"
          max="1"
          step="0.01"
          disabled={!cfEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cfRange.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>slope</label>
        <input
          type="range"
          bind:value={cfSlope}
          min="0.01"
          max="1"
          step="0.01"
          disabled={!cfEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cfSlope.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>level_in</label>
        <input
          type="range"
          bind:value={cfLevelIn}
          min="0"
          max="2"
          step="0.01"
          disabled={!cfEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cfLevelIn.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>level_out</label>
        <input
          type="range"
          bind:value={cfLevelOut}
          min="0"
          max="2"
          step="0.01"
          disabled={!cfEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cfLevelOut.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Haas -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={haasEnabled}
          disabled={appState.isProcessing}
        />
        ハース効果 (haas)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#haas" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!haasEnabled}>
      <div class="param-row">
        <label>level_in</label>
        <input
          type="range"
          bind:value={haasLevelIn}
          min="0"
          max="2"
          step="0.01"
          disabled={!haasEnabled || appState.isProcessing}
        />
        <span class="slider-value">{haasLevelIn.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>level_out</label>
        <input
          type="range"
          bind:value={haasLevelOut}
          min="0"
          max="2"
          step="0.01"
          disabled={!haasEnabled || appState.isProcessing}
        />
        <span class="slider-value">{haasLevelOut.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>side_gain</label>
        <input
          type="range"
          bind:value={haasSideGain}
          min="0"
          max="2"
          step="0.01"
          disabled={!haasEnabled || appState.isProcessing}
        />
        <span class="slider-value">{haasSideGain.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>middle_source</label>
        <select
          bind:value={haasMiddleSource}
          disabled={!haasEnabled || appState.isProcessing}
        >
          <option value="left">left</option>
          <option value="right">right</option>
          <option value="mid">mid</option>
          <option value="side">side</option>
        </select>
      </div>
      <div class="param-row">
        <label>middle_phase</label>
        <input
          type="checkbox"
          bind:checked={haasMiddlePhase}
          disabled={!haasEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>left_delay</label>
        <input
          type="range"
          bind:value={haasLeftDelay}
          min="0"
          max="40"
          step="0.01"
          disabled={!haasEnabled || appState.isProcessing}
        />
        <span class="slider-value">{haasLeftDelay.toFixed(2)} ms</span>
      </div>
      <div class="param-row">
        <label>left_balance</label>
        <input
          type="range"
          bind:value={haasLeftBalance}
          min="-1"
          max="1"
          step="0.01"
          disabled={!haasEnabled || appState.isProcessing}
        />
        <span class="slider-value">{haasLeftBalance.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>left_gain</label>
        <input
          type="range"
          bind:value={haasLeftGain}
          min="0"
          max="2"
          step="0.01"
          disabled={!haasEnabled || appState.isProcessing}
        />
        <span class="slider-value">{haasLeftGain.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>left_phase</label>
        <input
          type="checkbox"
          bind:checked={haasLeftPhase}
          disabled={!haasEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>right_delay</label>
        <input
          type="range"
          bind:value={haasRightDelay}
          min="0"
          max="40"
          step="0.01"
          disabled={!haasEnabled || appState.isProcessing}
        />
        <span class="slider-value">{haasRightDelay.toFixed(2)} ms</span>
      </div>
      <div class="param-row">
        <label>right_balance</label>
        <input
          type="range"
          bind:value={haasRightBalance}
          min="-1"
          max="1"
          step="0.01"
          disabled={!haasEnabled || appState.isProcessing}
        />
        <span class="slider-value">{haasRightBalance.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>right_gain</label>
        <input
          type="range"
          bind:value={haasRightGain}
          min="0"
          max="2"
          step="0.01"
          disabled={!haasEnabled || appState.isProcessing}
        />
        <span class="slider-value">{haasRightGain.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>right_phase</label>
        <input
          type="checkbox"
          bind:checked={haasRightPhase}
          disabled={!haasEnabled || appState.isProcessing}
        />
      </div>
    </div>
  </div>

  <!-- Dialoguenhance -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={deEnabled}
          disabled={appState.isProcessing}
        />
        ダイアログ強調 (dialoguenhance)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#dialoguenhance" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!deEnabled}>
      <div class="param-row">
        <label>original</label>
        <input
          type="range"
          bind:value={deOriginal}
          min="0"
          max="1"
          step="0.01"
          disabled={!deEnabled || appState.isProcessing}
        />
        <span class="slider-value">{deOriginal.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>enhance</label>
        <input
          type="range"
          bind:value={deEnhance}
          min="0"
          max="3"
          step="0.01"
          disabled={!deEnabled || appState.isProcessing}
        />
        <span class="slider-value">{deEnhance.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>voice</label>
        <input
          type="range"
          bind:value={deVoice}
          min="2"
          max="32"
          step="1"
          disabled={!deEnabled || appState.isProcessing}
        />
        <span class="slider-value">{deVoice}</span>
      </div>
    </div>
  </div>
</div>

<style>
  .stereo-settings {
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
