<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type {
    WidthType,
    FrequencyFilterExtOption,
  } from "$lib/types";

  const appState = getAppState();

  // Bass
  let bassEnabled = $state(false);
  let bassGain = $state(0);
  let bassFrequency = $state(100);
  let bassWidthType = $state<WidthType>("h");
  let bassWidth = $state(80);
  let bassPoles = $state<1 | 2>(2);
  let bassMix = $state(1);

  // Treble
  let trebleEnabled = $state(false);
  let trebleGain = $state(0);
  let trebleFrequency = $state(3000);
  let trebleWidthType = $state<WidthType>("h");
  let trebleWidth = $state(500);
  let treblePoles = $state<1 | 2>(2);
  let trebleMix = $state(1);

  // Bandreject
  let brEnabled = $state(false);
  let brFrequency = $state(1000);
  let brWidthType = $state<WidthType>("q");
  let brWidth = $state(1);
  let brMix = $state(1);

  // Tiltshelf
  let tsEnabled = $state(false);
  let tsGain = $state(0);
  let tsFrequency = $state(1000);
  let tsWidthType = $state<WidthType>("h");
  let tsWidth = $state(500);
  let tsPoles = $state<1 | 2>(2);
  let tsMix = $state(1);

  // Allpass
  let apEnabled = $state(false);
  let apFrequency = $state(1000);
  let apWidthType = $state<WidthType>("q");
  let apWidth = $state(0.707);
  let apMix = $state(1);
  let apOrder = $state<1 | 2>(2);

  // Asubboost
  let asbEnabled = $state(false);
  let asbDry = $state(1);
  let asbWet = $state(1);
  let asbBoost = $state(2);
  let asbDecay = $state(0);
  let asbFeedback = $state(0.9);
  let asbCutoff = $state(100);
  let asbSlope = $state(0.5);
  let asbDelay = $state(20);

  // Asubcut
  let ascEnabled = $state(false);
  let ascCutoff = $state(20);
  let ascOrder = $state(10);
  let ascLevel = $state(1);

  // Asupercut
  let aspcEnabled = $state(false);
  let aspcCutoff = $state(20000);
  let aspcOrder = $state(10);
  let aspcLevel = $state(1);

  // Adynamicequalizer
  let adeEnabled = $state(false);
  let adeThreshold = $state(0);
  let adeDfrequency = $state(1000);
  let adeDqfactor = $state(1);
  let adeTfrequency = $state(1000);
  let adeTqfactor = $state(1);
  let adeAttack = $state(20);
  let adeRelease = $state(200);
  let adeRatio = $state(1);
  let adeMakeup = $state(0);
  let adeRange = $state(50);
  let adeMode = $state<"listen" | "cutbelow" | "cutabove" | "boostbelow" | "boostabove">("cutbelow");
  let adeDftype = $state<"bandpass" | "lowpass" | "highpass" | "peak">("bandpass");
  let adeTftype = $state<"bell" | "lowshelf" | "highshelf">("bell");

  const widthTypeLabels: Record<WidthType, string> = {
    h: "Hz",
    o: "octave",
    q: "Q",
    s: "slope",
    k: "kHz",
  };

  function updateStore() {
    const anyEnabled =
      bassEnabled || trebleEnabled || brEnabled || tsEnabled ||
      apEnabled || asbEnabled || ascEnabled || aspcEnabled || adeEnabled;
    if (!anyEnabled) {
      appState.frequencyFilterExt = null;
      return;
    }
    const opt: FrequencyFilterExtOption = {
      bass: {
        enabled: bassEnabled,
        gain: bassGain,
        frequency: bassFrequency,
        width_type: bassWidthType,
        width: bassWidth,
        poles: bassPoles,
        mix: bassMix,
      },
      treble: {
        enabled: trebleEnabled,
        gain: trebleGain,
        frequency: trebleFrequency,
        width_type: trebleWidthType,
        width: trebleWidth,
        poles: treblePoles,
        mix: trebleMix,
      },
      bandreject: {
        enabled: brEnabled,
        frequency: brFrequency,
        width_type: brWidthType,
        width: brWidth,
        mix: brMix,
      },
      tiltshelf: {
        enabled: tsEnabled,
        gain: tsGain,
        frequency: tsFrequency,
        width_type: tsWidthType,
        width: tsWidth,
        poles: tsPoles,
        mix: tsMix,
      },
      allpass: {
        enabled: apEnabled,
        frequency: apFrequency,
        width_type: apWidthType,
        width: apWidth,
        mix: apMix,
        order: apOrder,
      },
      asubboost: {
        enabled: asbEnabled,
        dry: asbDry,
        wet: asbWet,
        boost: asbBoost,
        decay: asbDecay,
        feedback: asbFeedback,
        cutoff: asbCutoff,
        slope: asbSlope,
        delay: asbDelay,
      },
      asubcut: {
        enabled: ascEnabled,
        cutoff: ascCutoff,
        order: ascOrder,
        level: ascLevel,
      },
      asupercut: {
        enabled: aspcEnabled,
        cutoff: aspcCutoff,
        order: aspcOrder,
        level: aspcLevel,
      },
      adynamicequalizer: {
        enabled: adeEnabled,
        threshold: adeThreshold,
        dfrequency: adeDfrequency,
        dqfactor: adeDqfactor,
        tfrequency: adeTfrequency,
        tqfactor: adeTqfactor,
        attack: adeAttack,
        release: adeRelease,
        ratio: adeRatio,
        makeup: adeMakeup,
        range: adeRange,
        mode: adeMode,
        dftype: adeDftype,
        tftype: adeTftype,
      },
    };
    appState.frequencyFilterExt = opt;
  }

  $effect(() => {
    updateStore();
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      bassEnabled = false;
      bassGain = 0;
      bassFrequency = 100;
      bassWidthType = "h";
      bassWidth = 80;
      bassPoles = 2;
      bassMix = 1;
      trebleEnabled = false;
      trebleGain = 0;
      trebleFrequency = 3000;
      trebleWidthType = "h";
      trebleWidth = 500;
      treblePoles = 2;
      trebleMix = 1;
      brEnabled = false;
      brFrequency = 1000;
      brWidthType = "q";
      brWidth = 1;
      brMix = 1;
      tsEnabled = false;
      tsGain = 0;
      tsFrequency = 1000;
      tsWidthType = "h";
      tsWidth = 500;
      tsPoles = 2;
      tsMix = 1;
      apEnabled = false;
      apFrequency = 1000;
      apWidthType = "q";
      apWidth = 0.707;
      apMix = 1;
      apOrder = 2;
      asbEnabled = false;
      asbDry = 1;
      asbWet = 1;
      asbBoost = 2;
      asbDecay = 0;
      asbFeedback = 0.9;
      asbCutoff = 100;
      asbSlope = 0.5;
      asbDelay = 20;
      ascEnabled = false;
      ascCutoff = 20;
      ascOrder = 10;
      ascLevel = 1;
      aspcEnabled = false;
      aspcCutoff = 20000;
      aspcOrder = 10;
      aspcLevel = 1;
      adeEnabled = false;
      adeThreshold = 0;
      adeDfrequency = 1000;
      adeDqfactor = 1;
      adeTfrequency = 1000;
      adeTqfactor = 1;
      adeAttack = 20;
      adeRelease = 200;
      adeRatio = 1;
      adeMakeup = 0;
      adeRange = 50;
      adeMode = "cutbelow";
      adeDftype = "bandpass";
      adeTftype = "bell";
    }
  });
</script>

<div class="frequency-settings-ext">
  <!-- Bass -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={bassEnabled}
          disabled={appState.isProcessing}
        />
        バスブースト (bass)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#bass_002c-lowshelf" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!bassEnabled}>
      <div class="param-row">
        <label>gain</label>
        <input
          type="range"
          bind:value={bassGain}
          min="-30"
          max="30"
          step="0.5"
          disabled={!bassEnabled || appState.isProcessing}
        />
        <span class="slider-value">{bassGain > 0 ? "+" : ""}{bassGain} dB</span>
      </div>
      <div class="param-row">
        <label>frequency</label>
        <input
          type="number"
          bind:value={bassFrequency}
          min="1"
          max="999999"
          step="1"
          disabled={!bassEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>width_type</label>
        <select
          bind:value={bassWidthType}
          disabled={!bassEnabled || appState.isProcessing}
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
          bind:value={bassWidth}
          min="0.01"
          max="99999"
          step="0.01"
          disabled={!bassEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>poles</label>
        <select
          bind:value={bassPoles}
          disabled={!bassEnabled || appState.isProcessing}
        >
          <option value={1}>1 (6dB/oct)</option>
          <option value={2}>2 (12dB/oct)</option>
        </select>
      </div>
      <div class="param-row">
        <label>mix</label>
        <input
          type="range"
          bind:value={bassMix}
          min="0"
          max="1"
          step="0.01"
          disabled={!bassEnabled || appState.isProcessing}
        />
        <span class="slider-value">{bassMix.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Treble -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={trebleEnabled}
          disabled={appState.isProcessing}
        />
        トレブル (treble)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#treble_002c-highshelf_002c-tiltshelf" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!trebleEnabled}>
      <div class="param-row">
        <label>gain</label>
        <input
          type="range"
          bind:value={trebleGain}
          min="-30"
          max="30"
          step="0.5"
          disabled={!trebleEnabled || appState.isProcessing}
        />
        <span class="slider-value">{trebleGain > 0 ? "+" : ""}{trebleGain} dB</span>
      </div>
      <div class="param-row">
        <label>frequency</label>
        <input
          type="number"
          bind:value={trebleFrequency}
          min="1"
          max="999999"
          step="1"
          disabled={!trebleEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>width_type</label>
        <select
          bind:value={trebleWidthType}
          disabled={!trebleEnabled || appState.isProcessing}
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
          bind:value={trebleWidth}
          min="0.01"
          max="99999"
          step="0.01"
          disabled={!trebleEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>poles</label>
        <select
          bind:value={treblePoles}
          disabled={!trebleEnabled || appState.isProcessing}
        >
          <option value={1}>1 (6dB/oct)</option>
          <option value={2}>2 (12dB/oct)</option>
        </select>
      </div>
      <div class="param-row">
        <label>mix</label>
        <input
          type="range"
          bind:value={trebleMix}
          min="0"
          max="1"
          step="0.01"
          disabled={!trebleEnabled || appState.isProcessing}
        />
        <span class="slider-value">{trebleMix.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Bandreject -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={brEnabled}
          disabled={appState.isProcessing}
        />
        バンドリジェクト (bandreject)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#bandreject" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!brEnabled}>
      <div class="param-row">
        <label>frequency</label>
        <input
          type="number"
          bind:value={brFrequency}
          min="1"
          max="999999"
          step="1"
          disabled={!brEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>width_type</label>
        <select
          bind:value={brWidthType}
          disabled={!brEnabled || appState.isProcessing}
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
          bind:value={brWidth}
          min="0.01"
          max="99999"
          step="0.01"
          disabled={!brEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>mix</label>
        <input
          type="range"
          bind:value={brMix}
          min="0"
          max="1"
          step="0.01"
          disabled={!brEnabled || appState.isProcessing}
        />
        <span class="slider-value">{brMix.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Tiltshelf -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={tsEnabled}
          disabled={appState.isProcessing}
        />
        チルトシェルフ (tiltshelf)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#tiltshelf" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!tsEnabled}>
      <div class="param-row">
        <label>gain</label>
        <input
          type="range"
          bind:value={tsGain}
          min="-30"
          max="30"
          step="0.5"
          disabled={!tsEnabled || appState.isProcessing}
        />
        <span class="slider-value">{tsGain > 0 ? "+" : ""}{tsGain} dB</span>
      </div>
      <div class="param-row">
        <label>frequency</label>
        <input
          type="number"
          bind:value={tsFrequency}
          min="1"
          max="999999"
          step="1"
          disabled={!tsEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>width_type</label>
        <select
          bind:value={tsWidthType}
          disabled={!tsEnabled || appState.isProcessing}
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
          bind:value={tsWidth}
          min="0.01"
          max="99999"
          step="0.01"
          disabled={!tsEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>poles</label>
        <select
          bind:value={tsPoles}
          disabled={!tsEnabled || appState.isProcessing}
        >
          <option value={1}>1 (6dB/oct)</option>
          <option value={2}>2 (12dB/oct)</option>
        </select>
      </div>
      <div class="param-row">
        <label>mix</label>
        <input
          type="range"
          bind:value={tsMix}
          min="0"
          max="1"
          step="0.01"
          disabled={!tsEnabled || appState.isProcessing}
        />
        <span class="slider-value">{tsMix.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Allpass -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={apEnabled}
          disabled={appState.isProcessing}
        />
        オールパス (allpass)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#allpass" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!apEnabled}>
      <div class="param-row">
        <label>frequency</label>
        <input
          type="number"
          bind:value={apFrequency}
          min="1"
          max="999999"
          step="1"
          disabled={!apEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>width_type</label>
        <select
          bind:value={apWidthType}
          disabled={!apEnabled || appState.isProcessing}
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
          bind:value={apWidth}
          min="0.01"
          max="99999"
          step="0.01"
          disabled={!apEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>mix</label>
        <input
          type="range"
          bind:value={apMix}
          min="0"
          max="1"
          step="0.01"
          disabled={!apEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apMix.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>order</label>
        <select
          bind:value={apOrder}
          disabled={!apEnabled || appState.isProcessing}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Asubboost -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={asbEnabled}
          disabled={appState.isProcessing}
        />
        サブブースト (asubboost)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#asubboost" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!asbEnabled}>
      <div class="param-row">
        <label>dry</label>
        <input
          type="range"
          bind:value={asbDry}
          min="0"
          max="1"
          step="0.01"
          disabled={!asbEnabled || appState.isProcessing}
        />
        <span class="slider-value">{asbDry.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>wet</label>
        <input
          type="range"
          bind:value={asbWet}
          min="0"
          max="1"
          step="0.01"
          disabled={!asbEnabled || appState.isProcessing}
        />
        <span class="slider-value">{asbWet.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>boost</label>
        <input
          type="range"
          bind:value={asbBoost}
          min="1"
          max="12"
          step="0.1"
          disabled={!asbEnabled || appState.isProcessing}
        />
        <span class="slider-value">{asbBoost.toFixed(1)} dB</span>
      </div>
      <div class="param-row">
        <label>decay</label>
        <input
          type="range"
          bind:value={asbDecay}
          min="0"
          max="1"
          step="0.01"
          disabled={!asbEnabled || appState.isProcessing}
        />
        <span class="slider-value">{asbDecay.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>feedback</label>
        <input
          type="range"
          bind:value={asbFeedback}
          min="0"
          max="1"
          step="0.01"
          disabled={!asbEnabled || appState.isProcessing}
        />
        <span class="slider-value">{asbFeedback.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>cutoff</label>
        <input
          type="number"
          bind:value={asbCutoff}
          min="1"
          max="999999"
          step="1"
          disabled={!asbEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>slope</label>
        <input
          type="range"
          bind:value={asbSlope}
          min="0.0001"
          max="1"
          step="0.0001"
          disabled={!asbEnabled || appState.isProcessing}
        />
        <span class="slider-value">{asbSlope.toFixed(4)}</span>
      </div>
      <div class="param-row">
        <label>delay</label>
        <input
          type="number"
          bind:value={asbDelay}
          min="1"
          max="100"
          step="1"
          disabled={!asbEnabled || appState.isProcessing}
        />
        <span class="unit">ms</span>
      </div>
    </div>
  </div>

  <!-- Asubcut -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={ascEnabled}
          disabled={appState.isProcessing}
        />
        サブカット (asubcut)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#asubcut" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!ascEnabled}>
      <div class="param-row">
        <label>cutoff</label>
        <input
          type="number"
          bind:value={ascCutoff}
          min="2"
          max="200"
          step="1"
          disabled={!ascEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>order</label>
        <input
          type="number"
          bind:value={ascOrder}
          min="3"
          max="20"
          step="1"
          disabled={!ascEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>level</label>
        <input
          type="range"
          bind:value={ascLevel}
          min="0"
          max="1"
          step="0.01"
          disabled={!ascEnabled || appState.isProcessing}
        />
        <span class="slider-value">{ascLevel.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Asupercut -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={aspcEnabled}
          disabled={appState.isProcessing}
        />
        スーパーカット (asupercut)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#asupercut" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!aspcEnabled}>
      <div class="param-row">
        <label>cutoff</label>
        <input
          type="number"
          bind:value={aspcCutoff}
          min="20000"
          max="192000"
          step="1000"
          disabled={!aspcEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>order</label>
        <input
          type="number"
          bind:value={aspcOrder}
          min="3"
          max="20"
          step="1"
          disabled={!aspcEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>level</label>
        <input
          type="range"
          bind:value={aspcLevel}
          min="0"
          max="1"
          step="0.01"
          disabled={!aspcEnabled || appState.isProcessing}
        />
        <span class="slider-value">{aspcLevel.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Adynamicequalizer -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={adeEnabled}
          disabled={appState.isProcessing}
        />
        ダイナミックEQ (adynamicequalizer)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#adynamicequalizer" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!adeEnabled}>
      <div class="param-row">
        <label>threshold</label>
        <input
          type="range"
          bind:value={adeThreshold}
          min="-50"
          max="50"
          step="0.5"
          disabled={!adeEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeThreshold > 0 ? "+" : ""}{adeThreshold} dB</span>
      </div>
      <div class="param-row">
        <label>dfrequency</label>
        <input
          type="number"
          bind:value={adeDfrequency}
          min="1"
          max="999999"
          step="1"
          disabled={!adeEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>dqfactor</label>
        <input
          type="number"
          bind:value={adeDqfactor}
          min="0.001"
          max="1000"
          step="0.01"
          disabled={!adeEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>tfrequency</label>
        <input
          type="number"
          bind:value={adeTfrequency}
          min="1"
          max="999999"
          step="1"
          disabled={!adeEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>tqfactor</label>
        <input
          type="number"
          bind:value={adeTqfactor}
          min="0.001"
          max="1000"
          step="0.01"
          disabled={!adeEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>attack</label>
        <input
          type="range"
          bind:value={adeAttack}
          min="0.01"
          max="2000"
          step="1"
          disabled={!adeEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeAttack} ms</span>
      </div>
      <div class="param-row">
        <label>release</label>
        <input
          type="range"
          bind:value={adeRelease}
          min="0.01"
          max="9000"
          step="1"
          disabled={!adeEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeRelease} ms</span>
      </div>
      <div class="param-row">
        <label>ratio</label>
        <input
          type="range"
          bind:value={adeRatio}
          min="0"
          max="30"
          step="0.5"
          disabled={!adeEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeRatio}:1</span>
      </div>
      <div class="param-row">
        <label>makeup</label>
        <input
          type="range"
          bind:value={adeMakeup}
          min="-50"
          max="50"
          step="0.5"
          disabled={!adeEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeMakeup > 0 ? "+" : ""}{adeMakeup} dB</span>
      </div>
      <div class="param-row">
        <label>range</label>
        <input
          type="range"
          bind:value={adeRange}
          min="-200"
          max="200"
          step="1"
          disabled={!adeEnabled || appState.isProcessing}
        />
        <span class="slider-value">{adeRange} dB</span>
      </div>
      <div class="param-row">
        <label>mode</label>
        <select
          bind:value={adeMode}
          disabled={!adeEnabled || appState.isProcessing}
        >
          <option value="listen">listen</option>
          <option value="cutbelow">cutbelow</option>
          <option value="cutabove">cutabove</option>
          <option value="boostbelow">boostbelow</option>
          <option value="boostabove">boostabove</option>
        </select>
      </div>
      <div class="param-row">
        <label>dftype</label>
        <select
          bind:value={adeDftype}
          disabled={!adeEnabled || appState.isProcessing}
        >
          <option value="bandpass">bandpass</option>
          <option value="lowpass">lowpass</option>
          <option value="highpass">highpass</option>
          <option value="peak">peak</option>
        </select>
      </div>
      <div class="param-row">
        <label>tftype</label>
        <select
          bind:value={adeTftype}
          disabled={!adeEnabled || appState.isProcessing}
        >
          <option value="bell">bell</option>
          <option value="lowshelf">lowshelf</option>
          <option value="highshelf">highshelf</option>
        </select>
      </div>
    </div>
  </div>
</div>

<style>
  .frequency-settings-ext {
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
