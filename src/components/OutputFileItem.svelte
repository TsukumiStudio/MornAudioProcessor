<script lang="ts">
  import type { OutputFileEntry, CompareSelection } from "$lib/types";
  import { downloadBlob, playPreview, stopPreview } from "$lib/commands";
  import { formatDuration, formatBitrateOrBitDepth, formatSampleRate, formatPeakDb, formatLufs } from "$lib/utils";
  import { getAppState } from "$lib/stores.svelte";

  interface Props {
    entry: OutputFileEntry;
  }

  let { entry }: Props = $props();
  let playing = $state(false);

  const appState = getAppState();

  let selection: CompareSelection = $derived({ type: "output" as const, id: entry.id });
  let isA = $derived(
    appState.compareA?.type === "output" && appState.compareA.id === entry.id
  );
  let isB = $derived(
    appState.compareB?.type === "output" && appState.compareB.id === entry.id
  );

  function handleDownload() {
    if (entry.resultBlob) {
      downloadBlob(entry.resultBlob, entry.outputName);
    }
  }

  function togglePlay() {
    if (playing) {
      stopPreview();
    } else if (entry.resultBlob) {
      playPreview(entry.resultBlob, () => {
        playing = false;
      });
      playing = true;
    }
  }
</script>

<div
  class="output-item"
  class:completed={entry.status === "completed"}
  class:error={entry.status === "error"}
>
  {#if entry.status === "completed"}
    <div class="controls-col">
      <button
        class="play-btn"
        onclick={togglePlay}
        title={playing ? "停止" : "再生"}
      >
        {#if playing}&#9632;{:else}&#9654;{/if}
      </button>
      <div class="ab-row">
        <button class="ab-btn" class:active={isA}
          onclick={() => appState.toggleCompareA(selection)}
          title="A に設定">A</button>
        <button class="ab-btn" class:active={isB}
          onclick={() => appState.toggleCompareB(selection)}
          title="B に設定">B</button>
      </div>
    </div>
  {/if}
  <div class="output-info">
    <span class="output-name">{entry.outputName}</span>
    {#if entry.status === "completed" && entry.outputInfo}
      <span class="file-meta">
        {formatDuration(entry.outputInfo.duration_ms, 2)} | {formatBitrateOrBitDepth(entry.outputInfo.format, entry.outputInfo.bitrate, entry.outputInfo.bit_depth)} | {formatSampleRate(entry.outputInfo.sample_rate)} | Peak: <span class:clipping={entry.outputInfo.peak_db !== null && entry.outputInfo.peak_db >= 0}>{formatPeakDb(entry.outputInfo.peak_db)}</span> | RMS: {formatPeakDb(entry.outputInfo.rms_db)} | {formatLufs(entry.outputInfo.lufs)}
      </span>
    {/if}
  </div>

  {#if entry.status === "completed"}
    <span class="status-badge completed">完了</span>
    <button class="download-btn" onclick={handleDownload} title="ダウンロード">
      ↓
    </button>
  {:else if entry.status === "error"}
    <span class="status-badge error" title={entry.error}>エラー</span>
  {/if}
</div>

<style>
  .output-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: #1a1a16;
    border-radius: 8px;
    border: 1px solid #2d2d26;
  }
  .output-item.completed {
    border-color: #22c55e33;
  }
  .output-item.error {
    border-color: #ef444433;
  }
  .output-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .output-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: #e4e4e7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .file-meta {
    font-size: 0.75rem;
    color: #737373;
  }
  .clipping {
    color: #ef4444;
    font-weight: 600;
  }
  .progress-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .progress-bar {
    flex: 1;
    height: 6px;
    background: #28281f;
    border-radius: 3px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: #a3a825;
    border-radius: 3px;
    transition: width 0.3s;
  }
  .progress-text {
    font-size: 0.75rem;
    color: #a3a3a3;
    min-width: 36px;
    text-align: right;
  }
  .status-badge {
    font-size: 0.75rem;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
    white-space: nowrap;
  }
  .status-badge.completed {
    background: #22c55e22;
    color: #22c55e;
  }
  .status-badge.error {
    background: #ef444422;
    color: #ef4444;
    cursor: help;
  }
  .controls-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .ab-row {
    display: flex;
    gap: 2px;
  }
  .ab-btn {
    background: none;
    border: 1px solid #3f3f36;
    color: #737373;
    font-size: 0.65rem;
    font-weight: 700;
    cursor: pointer;
    padding: 4px 5px;
    border-radius: 4px;
    box-shadow: none;
    line-height: 1;
    flex-shrink: 0;
    min-width: 22px;
    text-align: center;
  }
  .ab-btn:hover {
    background: #3f3f36;
    color: #e4e4e7;
  }
  .ab-btn.active {
    background: #a3a825;
    border-color: #a3a825;
    color: #111110;
  }
  .play-btn {
    background: none;
    border: 1px solid #3f3f36;
    color: #a3a825;
    font-size: 0.7rem;
    cursor: pointer;
    padding: 4px 10px;
    border-radius: 4px;
    box-shadow: none;
    line-height: 1;
    flex-shrink: 0;
    width: 100%;
  }
  .play-btn:hover {
    background: #a3a82522;
    border-color: #a3a825;
  }
  .download-btn {
    background: none;
    border: 1px solid #22c55e44;
    color: #22c55e;
    font-size: 1rem;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    box-shadow: none;
    line-height: 1;
  }
  .download-btn:hover {
    background: #22c55e22;
  }
</style>
