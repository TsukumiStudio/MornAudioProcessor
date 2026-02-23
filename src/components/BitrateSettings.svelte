<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";

  const state = getAppState();

  function handleBitrateChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    state.bitrate = target.value;
  }

  function handleBitDepthChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    state.bitDepth = target.value;
  }

  function handleOggQualityChange(e: Event) {
    const target = e.target as HTMLInputElement;
    state.oggQuality = Number(target.value);
  }

  // "same" の場合は全てアクティブ（入力ファイルに該当フォーマットがあれば適用される）
  // 固定フォーマットの場合は該当しない項目を非アクティブにする
  const bitrateDisabled = $derived(
    state.isProcessing ||
    (state.outputFormat !== "same" && state.outputFormat !== "mp3" && state.outputFormat !== "ogg"),
  );
  const bitDepthDisabled = $derived(
    state.isProcessing ||
    (state.outputFormat !== "same" && state.outputFormat !== "wav" && state.outputFormat !== "flac"),
  );
  const oggQualityDisabled = $derived(
    state.isProcessing ||
    (state.outputFormat !== "same" && state.outputFormat !== "ogg"),
  );
</script>

<div class="setting-group">
  <label for="bitrate-select">ビットレート（mp3/ogg のみ・実値と差異あり）</label>
  <select
    id="bitrate-select"
    value={state.bitrate}
    onchange={handleBitrateChange}
    disabled={bitrateDisabled}
  >
    <option value="">変更しない</option>
    <option value="64k">64 kbps</option>
    <option value="96k">96 kbps</option>
    <option value="128k">128 kbps</option>
    <option value="192k">192 kbps</option>
    <option value="256k">256 kbps</option>
    <option value="320k">320 kbps</option>
  </select>
</div>

<div class="setting-group">
  <label for="bit-depth-select">ビット解像度（wav/flac のみ）</label>
  <select
    id="bit-depth-select"
    value={state.bitDepth}
    onchange={handleBitDepthChange}
    disabled={bitDepthDisabled}
  >
    <option value="">変更しない</option>
    <option value="16">16-bit</option>
    <option value="24">24-bit</option>
    <option value="32">32-bit</option>
    <option value="f32">32-bit float</option>
    <option value="f64">64-bit float</option>
  </select>
</div>

<div class="setting-group">
  <label for="ogg-quality-range">
    クオリティ（ogg のみ）: {state.oggQuality.toFixed(1)}
  </label>
  <div class="range-row">
    <span class="range-label">0</span>
    <input
      id="ogg-quality-range"
      type="range"
      min="0"
      max="1"
      step="0.1"
      value={state.oggQuality}
      oninput={handleOggQualityChange}
      disabled={oggQualityDisabled}
    />
    <span class="range-label">1</span>
  </div>
</div>

<style>
  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #a3a3a3;
  }
  select {
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid #3f3f36;
    background: #1a1a17;
    color: #e4e4e7;
    font-size: 0.85rem;
    cursor: pointer;
  }
  select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .range-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .range-label {
    font-size: 0.75rem;
    color: #737373;
    min-width: 1em;
    text-align: center;
  }
  input[type="range"] {
    flex: 1;
    accent-color: #a3a825;
  }
  input[type="range"]:disabled {
    opacity: 0.5;
  }
</style>
