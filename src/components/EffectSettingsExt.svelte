<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { EffectFilterExtOption } from "$lib/types";

  const appState = getAppState();

  // Afade In
  let afadeInEnabled = $state(false);
  let afadeInStartTime = $state(0);
  let afadeInDuration = $state(0);
  let afadeInCurve = $state("tri");
  let afadeInSilence = $state(0);
  let afadeInUnity = $state(1);

  // Afade Out
  let afadeOutEnabled = $state(false);
  let afadeOutStartTime = $state(0);
  let afadeOutDuration = $state(0);
  let afadeOutCurve = $state("tri");
  let afadeOutSilence = $state(0);
  let afadeOutUnity = $state(1);

  // Acrusher
  let acrusherEnabled = $state(false);
  let acrusherLevelIn = $state(1);
  let acrusherLevelOut = $state(1);
  let acrusherBits = $state(8);
  let acrusherMix = $state(0.5);
  let acrusherMode = $state<"lin" | "log">("lin");
  let acrusherDc = $state(1);
  let acrusherAa = $state(0.5);
  let acrusherSamples = $state(1);
  let acrusherLfo = $state(false);
  let acrusherLforange = $state(20);
  let acrusherLforate = $state(0.3);

  // Aexciter
  let aexciterEnabled = $state(false);
  let aexciterLevelIn = $state(1);
  let aexciterLevelOut = $state(1);
  let aexciterAmount = $state(1);
  let aexciterDrive = $state(8.5);
  let aexciterBlend = $state(0);
  let aexciterFreq = $state(7500);
  let aexciterCeil = $state(9999);
  let aexciterListen = $state(false);

  // Crystalizer
  let crystalizerEnabled = $state(false);
  let crystalizerI = $state(2);
  let crystalizerC = $state(true);

  // Areverse
  let areverseEnabled = $state(false);

  // Aloop
  let aloopEnabled = $state(false);
  let aloopLoop = $state(0);
  let aloopSize = $state(0);
  let aloopStart = $state(0);

  // Afreqshift
  let afreqshiftEnabled = $state(false);
  let afreqshiftShift = $state(0);
  let afreqshiftLevel = $state(1);
  let afreqshiftOrder = $state(8);

  // Apulsator
  let apulsatorEnabled = $state(false);
  let apulsatorLevelIn = $state(1);
  let apulsatorLevelOut = $state(1);
  let apulsatorMode = $state<"sine" | "triangle" | "square" | "sawup" | "sawdown">("sine");
  let apulsatorAmount = $state(1);
  let apulsatorOffsetL = $state(0);
  let apulsatorOffsetR = $state(0.5);
  let apulsatorWidth = $state(1);
  let apulsatorTiming = $state<"bpm" | "ms" | "hz">("bpm");
  let apulsatorBpm = $state(120);
  let apulsatorMs = $state(500);
  let apulsatorHz = $state(2);

  // Adelay
  let adelayEnabled = $state(false);
  let adelayDelays = $state("0");
  let adelayAll = $state(false);

  // Compensationdelay
  let cdEnabled = $state(false);
  let cdMm = $state(0);
  let cdCm = $state(0);
  let cdM = $state(0);
  let cdDry = $state(0);
  let cdWet = $state(1);
  let cdTemp = $state(20);

  // Dcshift
  let dcshiftEnabled = $state(false);
  let dcshiftShift = $state(0);
  let dcshiftLimitergain = $state(0);

  // Apad
  let apadEnabled = $state(false);
  let apadPadDur = $state(0);
  let apadWholeDur = $state(0);

  function updateStore() {
    const anyEnabled =
      afadeInEnabled ||
      afadeOutEnabled ||
      acrusherEnabled ||
      aexciterEnabled ||
      crystalizerEnabled ||
      areverseEnabled ||
      aloopEnabled ||
      afreqshiftEnabled ||
      apulsatorEnabled ||
      adelayEnabled ||
      cdEnabled ||
      dcshiftEnabled ||
      apadEnabled;
    if (!anyEnabled) {
      appState.effectFilterExt = null;
      return;
    }
    const opt: EffectFilterExtOption = {
      afade_in: {
        enabled: afadeInEnabled,
        type: "in",
        start_time: afadeInStartTime,
        duration: afadeInDuration,
        curve: afadeInCurve,
        silence: afadeInSilence,
        unity: afadeInUnity,
      },
      afade_out: {
        enabled: afadeOutEnabled,
        type: "out",
        start_time: afadeOutStartTime,
        duration: afadeOutDuration,
        curve: afadeOutCurve,
        silence: afadeOutSilence,
        unity: afadeOutUnity,
      },
      acrusher: {
        enabled: acrusherEnabled,
        level_in: acrusherLevelIn,
        level_out: acrusherLevelOut,
        bits: acrusherBits,
        mix: acrusherMix,
        mode: acrusherMode,
        dc: acrusherDc,
        aa: acrusherAa,
        samples: acrusherSamples,
        lfo: acrusherLfo,
        lforange: acrusherLforange,
        lforate: acrusherLforate,
      },
      aexciter: {
        enabled: aexciterEnabled,
        level_in: aexciterLevelIn,
        level_out: aexciterLevelOut,
        amount: aexciterAmount,
        drive: aexciterDrive,
        blend: aexciterBlend,
        freq: aexciterFreq,
        ceil: aexciterCeil,
        listen: aexciterListen,
      },
      crystalizer: {
        enabled: crystalizerEnabled,
        i: crystalizerI,
        c: crystalizerC,
      },
      areverse: {
        enabled: areverseEnabled,
      },
      aloop: {
        enabled: aloopEnabled,
        loop: aloopLoop,
        size: aloopSize,
        start: aloopStart,
      },
      afreqshift: {
        enabled: afreqshiftEnabled,
        shift: afreqshiftShift,
        level: afreqshiftLevel,
        order: afreqshiftOrder,
      },
      apulsator: {
        enabled: apulsatorEnabled,
        level_in: apulsatorLevelIn,
        level_out: apulsatorLevelOut,
        mode: apulsatorMode,
        amount: apulsatorAmount,
        offset_l: apulsatorOffsetL,
        offset_r: apulsatorOffsetR,
        width: apulsatorWidth,
        timing: apulsatorTiming,
        bpm: apulsatorBpm,
        ms: apulsatorMs,
        hz: apulsatorHz,
      },
      adelay: {
        enabled: adelayEnabled,
        delays: adelayDelays,
        all: adelayAll,
      },
      compensationdelay: {
        enabled: cdEnabled,
        mm: cdMm,
        cm: cdCm,
        m: cdM,
        dry: cdDry,
        wet: cdWet,
        temp: cdTemp,
      },
      dcshift: {
        enabled: dcshiftEnabled,
        shift: dcshiftShift,
        limitergain: dcshiftLimitergain,
      },
      apad: {
        enabled: apadEnabled,
        pad_dur: apadPadDur,
        whole_dur: apadWholeDur,
      },
    };
    appState.effectFilterExt = opt;
  }

  $effect(() => {
    updateStore();
  });

  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      afadeInEnabled = false;
      afadeInStartTime = 0;
      afadeInDuration = 0;
      afadeInCurve = "tri";
      afadeInSilence = 0;
      afadeInUnity = 1;
      afadeOutEnabled = false;
      afadeOutStartTime = 0;
      afadeOutDuration = 0;
      afadeOutCurve = "tri";
      afadeOutSilence = 0;
      afadeOutUnity = 1;
      acrusherEnabled = false;
      acrusherLevelIn = 1;
      acrusherLevelOut = 1;
      acrusherBits = 8;
      acrusherMix = 0.5;
      acrusherMode = "lin";
      acrusherDc = 1;
      acrusherAa = 0.5;
      acrusherSamples = 1;
      acrusherLfo = false;
      acrusherLforange = 20;
      acrusherLforate = 0.3;
      aexciterEnabled = false;
      aexciterLevelIn = 1;
      aexciterLevelOut = 1;
      aexciterAmount = 1;
      aexciterDrive = 8.5;
      aexciterBlend = 0;
      aexciterFreq = 7500;
      aexciterCeil = 9999;
      aexciterListen = false;
      crystalizerEnabled = false;
      crystalizerI = 2;
      crystalizerC = true;
      areverseEnabled = false;
      aloopEnabled = false;
      aloopLoop = 0;
      aloopSize = 0;
      aloopStart = 0;
      afreqshiftEnabled = false;
      afreqshiftShift = 0;
      afreqshiftLevel = 1;
      afreqshiftOrder = 8;
      apulsatorEnabled = false;
      apulsatorLevelIn = 1;
      apulsatorLevelOut = 1;
      apulsatorMode = "sine";
      apulsatorAmount = 1;
      apulsatorOffsetL = 0;
      apulsatorOffsetR = 0.5;
      apulsatorWidth = 1;
      apulsatorTiming = "bpm";
      apulsatorBpm = 120;
      apulsatorMs = 500;
      apulsatorHz = 2;
      adelayEnabled = false;
      adelayDelays = "0";
      adelayAll = false;
      cdEnabled = false;
      cdMm = 0;
      cdCm = 0;
      cdM = 0;
      cdDry = 0;
      cdWet = 1;
      cdTemp = 20;
      dcshiftEnabled = false;
      dcshiftShift = 0;
      dcshiftLimitergain = 0;
      apadEnabled = false;
      apadPadDur = 0;
      apadWholeDur = 0;
    }
  });
</script>

<div class="effect-settings-ext">
  <!-- Afade In -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={afadeInEnabled}
          disabled={appState.isProcessing}
        />
        フェードイン (afade)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#afade" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!afadeInEnabled}>
      <div class="param-row">
        <label>start_time</label>
        <input
          type="range"
          bind:value={afadeInStartTime}
          min="0"
          max="300"
          step="0.1"
          disabled={!afadeInEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afadeInStartTime.toFixed(1)} sec</span>
      </div>
      <div class="param-row">
        <label>duration</label>
        <input
          type="range"
          bind:value={afadeInDuration}
          min="0"
          max="300"
          step="0.1"
          disabled={!afadeInEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afadeInDuration.toFixed(1)} sec</span>
      </div>
      <div class="param-row">
        <label>curve</label>
        <select
          bind:value={afadeInCurve}
          disabled={!afadeInEnabled || appState.isProcessing}
        >
          <option value="tri">tri</option>
          <option value="qsin">qsin</option>
          <option value="esin">esin</option>
          <option value="hsin">hsin</option>
          <option value="log">log</option>
          <option value="ipar">ipar</option>
          <option value="qua">qua</option>
          <option value="cub">cub</option>
          <option value="squ">squ</option>
          <option value="cbr">cbr</option>
          <option value="par">par</option>
          <option value="exp">exp</option>
          <option value="iqsin">iqsin</option>
          <option value="ihsin">ihsin</option>
          <option value="dese">dese</option>
          <option value="desi">desi</option>
          <option value="losi">losi</option>
          <option value="sinc">sinc</option>
          <option value="isinc">isinc</option>
          <option value="nofade">nofade</option>
        </select>
      </div>
      <div class="param-row">
        <label>silence</label>
        <input
          type="range"
          bind:value={afadeInSilence}
          min="0"
          max="1"
          step="0.01"
          disabled={!afadeInEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afadeInSilence.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>unity</label>
        <input
          type="range"
          bind:value={afadeInUnity}
          min="0"
          max="1"
          step="0.01"
          disabled={!afadeInEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afadeInUnity.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Afade Out -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={afadeOutEnabled}
          disabled={appState.isProcessing}
        />
        フェードアウト (afade)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#afade" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!afadeOutEnabled}>
      <div class="param-row">
        <label>start_time</label>
        <input
          type="range"
          bind:value={afadeOutStartTime}
          min="0"
          max="300"
          step="0.1"
          disabled={!afadeOutEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afadeOutStartTime.toFixed(1)} sec</span>
      </div>
      <div class="param-row">
        <label>duration</label>
        <input
          type="range"
          bind:value={afadeOutDuration}
          min="0"
          max="300"
          step="0.1"
          disabled={!afadeOutEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afadeOutDuration.toFixed(1)} sec</span>
      </div>
      <div class="param-row">
        <label>curve</label>
        <select
          bind:value={afadeOutCurve}
          disabled={!afadeOutEnabled || appState.isProcessing}
        >
          <option value="tri">tri</option>
          <option value="qsin">qsin</option>
          <option value="esin">esin</option>
          <option value="hsin">hsin</option>
          <option value="log">log</option>
          <option value="ipar">ipar</option>
          <option value="qua">qua</option>
          <option value="cub">cub</option>
          <option value="squ">squ</option>
          <option value="cbr">cbr</option>
          <option value="par">par</option>
          <option value="exp">exp</option>
          <option value="iqsin">iqsin</option>
          <option value="ihsin">ihsin</option>
          <option value="dese">dese</option>
          <option value="desi">desi</option>
          <option value="losi">losi</option>
          <option value="sinc">sinc</option>
          <option value="isinc">isinc</option>
          <option value="nofade">nofade</option>
        </select>
      </div>
      <div class="param-row">
        <label>silence</label>
        <input
          type="range"
          bind:value={afadeOutSilence}
          min="0"
          max="1"
          step="0.01"
          disabled={!afadeOutEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afadeOutSilence.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>unity</label>
        <input
          type="range"
          bind:value={afadeOutUnity}
          min="0"
          max="1"
          step="0.01"
          disabled={!afadeOutEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afadeOutUnity.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Acrusher -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={acrusherEnabled}
          disabled={appState.isProcessing}
        />
        ビットクラッシャー (acrusher)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#acrusher" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!acrusherEnabled}>
      <div class="param-row">
        <label>level_in</label>
        <input
          type="range"
          bind:value={acrusherLevelIn}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!acrusherEnabled || appState.isProcessing}
        />
        <span class="slider-value">{acrusherLevelIn.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>level_out</label>
        <input
          type="range"
          bind:value={acrusherLevelOut}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!acrusherEnabled || appState.isProcessing}
        />
        <span class="slider-value">{acrusherLevelOut.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>bits</label>
        <input
          type="number"
          bind:value={acrusherBits}
          min="1"
          max="64"
          step="1"
          disabled={!acrusherEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>mix</label>
        <input
          type="range"
          bind:value={acrusherMix}
          min="0"
          max="1"
          step="0.01"
          disabled={!acrusherEnabled || appState.isProcessing}
        />
        <span class="slider-value">{acrusherMix.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>mode</label>
        <select
          bind:value={acrusherMode}
          disabled={!acrusherEnabled || appState.isProcessing}
        >
          <option value="lin">lin</option>
          <option value="log">log</option>
        </select>
      </div>
      <div class="param-row">
        <label>dc</label>
        <input
          type="range"
          bind:value={acrusherDc}
          min="0.25"
          max="4"
          step="0.01"
          disabled={!acrusherEnabled || appState.isProcessing}
        />
        <span class="slider-value">{acrusherDc.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>aa</label>
        <input
          type="range"
          bind:value={acrusherAa}
          min="0"
          max="1"
          step="0.01"
          disabled={!acrusherEnabled || appState.isProcessing}
        />
        <span class="slider-value">{acrusherAa.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>samples</label>
        <input
          type="number"
          bind:value={acrusherSamples}
          min="1"
          max="250"
          step="1"
          disabled={!acrusherEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>lfo</label>
        <input
          type="checkbox"
          bind:checked={acrusherLfo}
          disabled={!acrusherEnabled || appState.isProcessing}
        />
        <span class="param-desc">enable LFO</span>
      </div>
      <div class="param-row">
        <label>lforange</label>
        <input
          type="number"
          bind:value={acrusherLforange}
          min="1"
          max="250"
          step="1"
          disabled={!acrusherEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>lforate</label>
        <input
          type="range"
          bind:value={acrusherLforate}
          min="0.01"
          max="200"
          step="0.01"
          disabled={!acrusherEnabled || appState.isProcessing}
        />
        <span class="slider-value">{acrusherLforate.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Aexciter -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={aexciterEnabled}
          disabled={appState.isProcessing}
        />
        エキサイター (aexciter)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#aexciter" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!aexciterEnabled}>
      <div class="param-row">
        <label>level_in</label>
        <input
          type="range"
          bind:value={aexciterLevelIn}
          min="0"
          max="64"
          step="0.01"
          disabled={!aexciterEnabled || appState.isProcessing}
        />
        <span class="slider-value">{aexciterLevelIn.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>level_out</label>
        <input
          type="range"
          bind:value={aexciterLevelOut}
          min="0"
          max="64"
          step="0.01"
          disabled={!aexciterEnabled || appState.isProcessing}
        />
        <span class="slider-value">{aexciterLevelOut.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>amount</label>
        <input
          type="range"
          bind:value={aexciterAmount}
          min="0"
          max="64"
          step="0.01"
          disabled={!aexciterEnabled || appState.isProcessing}
        />
        <span class="slider-value">{aexciterAmount.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>drive</label>
        <input
          type="range"
          bind:value={aexciterDrive}
          min="0.1"
          max="10"
          step="0.1"
          disabled={!aexciterEnabled || appState.isProcessing}
        />
        <span class="slider-value">{aexciterDrive.toFixed(1)}</span>
      </div>
      <div class="param-row">
        <label>blend</label>
        <input
          type="range"
          bind:value={aexciterBlend}
          min="-10"
          max="10"
          step="0.1"
          disabled={!aexciterEnabled || appState.isProcessing}
        />
        <span class="slider-value">{aexciterBlend.toFixed(1)}</span>
      </div>
      <div class="param-row">
        <label>freq</label>
        <input
          type="number"
          bind:value={aexciterFreq}
          min="2000"
          max="12000"
          step="1"
          disabled={!aexciterEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>ceil</label>
        <input
          type="number"
          bind:value={aexciterCeil}
          min="9999"
          max="20000"
          step="1"
          disabled={!aexciterEnabled || appState.isProcessing}
        />
        <span class="unit">Hz</span>
      </div>
      <div class="param-row">
        <label>listen</label>
        <input
          type="checkbox"
          bind:checked={aexciterListen}
          disabled={!aexciterEnabled || appState.isProcessing}
        />
        <span class="param-desc">listen mode</span>
      </div>
    </div>
  </div>

  <!-- Crystalizer -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={crystalizerEnabled}
          disabled={appState.isProcessing}
        />
        クリスタライザー (crystalizer)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#crystalizer" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!crystalizerEnabled}>
      <div class="param-row">
        <label>i</label>
        <input
          type="range"
          bind:value={crystalizerI}
          min="-10"
          max="10"
          step="0.1"
          disabled={!crystalizerEnabled || appState.isProcessing}
        />
        <span class="slider-value">{crystalizerI.toFixed(1)}</span>
      </div>
      <div class="param-row">
        <label>c</label>
        <input
          type="checkbox"
          bind:checked={crystalizerC}
          disabled={!crystalizerEnabled || appState.isProcessing}
        />
        <span class="param-desc">clipping prevention</span>
      </div>
    </div>
  </div>

  <!-- Areverse -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={areverseEnabled}
          disabled={appState.isProcessing}
        />
        リバース (areverse)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#areverse" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
  </div>

  <!-- Aloop -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={aloopEnabled}
          disabled={appState.isProcessing}
        />
        ループ (aloop)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#aloop" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!aloopEnabled}>
      <div class="param-row">
        <label>loop</label>
        <input
          type="number"
          bind:value={aloopLoop}
          min="-1"
          max="99999"
          step="1"
          disabled={!aloopEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>size</label>
        <input
          type="number"
          bind:value={aloopSize}
          min="0"
          max="99999"
          step="1"
          disabled={!aloopEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>start</label>
        <input
          type="number"
          bind:value={aloopStart}
          min="-1"
          max="99999"
          step="1"
          disabled={!aloopEnabled || appState.isProcessing}
        />
      </div>
    </div>
  </div>

  <!-- Afreqshift -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={afreqshiftEnabled}
          disabled={appState.isProcessing}
        />
        周波数シフト (afreqshift)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#afreqshift" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!afreqshiftEnabled}>
      <div class="param-row">
        <label>shift</label>
        <input
          type="range"
          bind:value={afreqshiftShift}
          min="-10000"
          max="10000"
          step="1"
          disabled={!afreqshiftEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afreqshiftShift} Hz</span>
      </div>
      <div class="param-row">
        <label>level</label>
        <input
          type="range"
          bind:value={afreqshiftLevel}
          min="0"
          max="1"
          step="0.01"
          disabled={!afreqshiftEnabled || appState.isProcessing}
        />
        <span class="slider-value">{afreqshiftLevel.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>order</label>
        <input
          type="number"
          bind:value={afreqshiftOrder}
          min="1"
          max="16"
          step="1"
          disabled={!afreqshiftEnabled || appState.isProcessing}
        />
      </div>
    </div>
  </div>

  <!-- Apulsator -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={apulsatorEnabled}
          disabled={appState.isProcessing}
        />
        パルセーター (apulsator)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#apulsator" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!apulsatorEnabled}>
      <div class="param-row">
        <label>level_in</label>
        <input
          type="range"
          bind:value={apulsatorLevelIn}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!apulsatorEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apulsatorLevelIn.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>level_out</label>
        <input
          type="range"
          bind:value={apulsatorLevelOut}
          min="0.015625"
          max="64"
          step="0.01"
          disabled={!apulsatorEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apulsatorLevelOut.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>mode</label>
        <select
          bind:value={apulsatorMode}
          disabled={!apulsatorEnabled || appState.isProcessing}
        >
          <option value="sine">sine</option>
          <option value="triangle">triangle</option>
          <option value="square">square</option>
          <option value="sawup">sawup</option>
          <option value="sawdown">sawdown</option>
        </select>
      </div>
      <div class="param-row">
        <label>amount</label>
        <input
          type="range"
          bind:value={apulsatorAmount}
          min="0"
          max="1"
          step="0.01"
          disabled={!apulsatorEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apulsatorAmount.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>offset_l</label>
        <input
          type="range"
          bind:value={apulsatorOffsetL}
          min="0"
          max="1"
          step="0.01"
          disabled={!apulsatorEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apulsatorOffsetL.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>offset_r</label>
        <input
          type="range"
          bind:value={apulsatorOffsetR}
          min="0"
          max="1"
          step="0.01"
          disabled={!apulsatorEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apulsatorOffsetR.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>width</label>
        <input
          type="range"
          bind:value={apulsatorWidth}
          min="0"
          max="2"
          step="0.01"
          disabled={!apulsatorEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apulsatorWidth.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>timing</label>
        <select
          bind:value={apulsatorTiming}
          disabled={!apulsatorEnabled || appState.isProcessing}
        >
          <option value="bpm">bpm</option>
          <option value="ms">ms</option>
          <option value="hz">hz</option>
        </select>
      </div>
      <div class="param-row">
        <label>bpm</label>
        <input
          type="range"
          bind:value={apulsatorBpm}
          min="30"
          max="300"
          step="1"
          disabled={!apulsatorEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apulsatorBpm}</span>
      </div>
      <div class="param-row">
        <label>ms</label>
        <input
          type="range"
          bind:value={apulsatorMs}
          min="10"
          max="2000"
          step="1"
          disabled={!apulsatorEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apulsatorMs} ms</span>
      </div>
      <div class="param-row">
        <label>hz</label>
        <input
          type="range"
          bind:value={apulsatorHz}
          min="0.01"
          max="100"
          step="0.01"
          disabled={!apulsatorEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apulsatorHz.toFixed(2)} Hz</span>
      </div>
    </div>
  </div>

  <!-- Adelay -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={adelayEnabled}
          disabled={appState.isProcessing}
        />
        ディレイ (adelay)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#adelay" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!adelayEnabled}>
      <div class="param-row">
        <label>delays</label>
        <input
          type="text"
          bind:value={adelayDelays}
          disabled={!adelayEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>all</label>
        <input
          type="checkbox"
          bind:checked={adelayAll}
          disabled={!adelayEnabled || appState.isProcessing}
        />
        <span class="param-desc">apply to all channels</span>
      </div>
    </div>
  </div>

  <!-- Compensationdelay -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={cdEnabled}
          disabled={appState.isProcessing}
        />
        補正ディレイ (compensationdelay)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#compensationdelay" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!cdEnabled}>
      <div class="param-row">
        <label>mm</label>
        <input
          type="number"
          bind:value={cdMm}
          min="0"
          max="10"
          step="1"
          disabled={!cdEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>cm</label>
        <input
          type="number"
          bind:value={cdCm}
          min="0"
          max="100"
          step="1"
          disabled={!cdEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>m</label>
        <input
          type="number"
          bind:value={cdM}
          min="0"
          max="100"
          step="1"
          disabled={!cdEnabled || appState.isProcessing}
        />
      </div>
      <div class="param-row">
        <label>dry</label>
        <input
          type="range"
          bind:value={cdDry}
          min="0"
          max="1"
          step="0.01"
          disabled={!cdEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cdDry.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>wet</label>
        <input
          type="range"
          bind:value={cdWet}
          min="0"
          max="1"
          step="0.01"
          disabled={!cdEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cdWet.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>temp</label>
        <input
          type="range"
          bind:value={cdTemp}
          min="-50"
          max="50"
          step="0.5"
          disabled={!cdEnabled || appState.isProcessing}
        />
        <span class="slider-value">{cdTemp.toFixed(1)}</span>
      </div>
    </div>
  </div>

  <!-- Dcshift -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={dcshiftEnabled}
          disabled={appState.isProcessing}
        />
        DCシフト (dcshift)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#dcshift" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!dcshiftEnabled}>
      <div class="param-row">
        <label>shift</label>
        <input
          type="range"
          bind:value={dcshiftShift}
          min="-1"
          max="1"
          step="0.01"
          disabled={!dcshiftEnabled || appState.isProcessing}
        />
        <span class="slider-value">{dcshiftShift.toFixed(2)}</span>
      </div>
      <div class="param-row">
        <label>limitergain</label>
        <input
          type="range"
          bind:value={dcshiftLimitergain}
          min="0"
          max="1"
          step="0.01"
          disabled={!dcshiftEnabled || appState.isProcessing}
        />
        <span class="slider-value">{dcshiftLimitergain.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Apad -->
  <div class="filter-section">
    <div class="filter-header">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={apadEnabled}
          disabled={appState.isProcessing}
        />
        パディング (apad)
      </label>
      <a href="https://ffmpeg.org/ffmpeg-filters.html#apad" target="_blank" rel="noopener" class="doc-link">?</a>
    </div>
    <div class="filter-params" class:disabled={!apadEnabled}>
      <div class="param-row">
        <label>pad_dur</label>
        <input
          type="range"
          bind:value={apadPadDur}
          min="0"
          max="300"
          step="0.1"
          disabled={!apadEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apadPadDur.toFixed(1)} sec</span>
      </div>
      <div class="param-row">
        <label>whole_dur</label>
        <input
          type="range"
          bind:value={apadWholeDur}
          min="0"
          max="300"
          step="0.1"
          disabled={!apadEnabled || appState.isProcessing}
        />
        <span class="slider-value">{apadWholeDur.toFixed(1)} sec</span>
      </div>
    </div>
  </div>
</div>

<style>
  .effect-settings-ext {
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
