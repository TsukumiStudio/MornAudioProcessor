<script lang="ts">
  import type { FileEntry } from "$lib/types";
  import type { CompareSelection } from "$lib/types";
  import { getAppState } from "$lib/stores.svelte";
  import { formatDuration, formatBitrateOrBitDepth, formatSampleRate, formatPeakDb, formatLufs } from "$lib/utils";
  import { playPreview, stopPreview } from "$lib/commands";

  interface Props {
    entry: FileEntry;
    onRemove: (id: string) => void;
    disabled: boolean;
  }

  let { entry, onRemove, disabled }: Props = $props();
  let playing = $state(false);

  const appState = getAppState();

  let selection: CompareSelection = $derived({ type: "input" as const, id: entry.id });
  let isA = $derived(
    appState.compareA?.type === "input" && appState.compareA.id === entry.id
  );
  let isB = $derived(
    appState.compareB?.type === "input" && appState.compareB.id === entry.id
  );

  function togglePlay() {
    if (playing) {
      stopPreview();
    } else {
      playPreview(entry.sourceFile, () => {
        playing = false;
      });
      playing = true;
    }
  }
</script>

<div class="file-item">
  <div class="controls-col">
    <button
      class="play-btn"
      onclick={togglePlay}
      title={playing ? "停止" : "再生"}
    >
      {#if playing}&#9632;{:else}&#9654;{/if}
    </button>
    <div class="ab-row">
      <button
        class="ab-btn"
        class:active={isA}
        onclick={() => appState.toggleCompareA(selection)}
        title="A に設定"
      >A</button>
      <button
        class="ab-btn"
        class:active={isB}
        onclick={() => appState.toggleCompareB(selection)}
        title="B に設定"
      >B</button>
    </div>
  </div>
  <div class="file-info">
    <span class="file-name">{entry.file.name}</span>
    {#if entry.status === "loading"}
      <span class="file-meta loading-text">読み込み中...</span>
    {:else}
      <span class="file-meta">
        {formatDuration(entry.file.duration_ms, 2)} | {formatBitrateOrBitDepth(entry.file.format, entry.file.bitrate, entry.file.bit_depth)} | {formatSampleRate(entry.file.sample_rate)} | Peak: <span class:clipping={entry.file.peak_db !== null && entry.file.peak_db >= 0}>{formatPeakDb(entry.file.peak_db)}</span> | RMS: {formatPeakDb(entry.file.rms_db)} | {formatLufs(entry.file.lufs)}
      </span>
    {/if}
    {#if entry.status === "processing"}
      <div class="progress-row">
        <div class="progress-bar">
          <div class="progress-fill" style="width: {entry.progress}%"></div>
        </div>
        <span class="progress-text">{entry.progress}%</span>
      </div>
    {:else if entry.status === "completed"}
      <div class="status-done">完了</div>
    {:else if entry.status === "error"}
      <div class="status-error">{entry.error ?? "エラー"}</div>
    {/if}
  </div>

  <button
    class="remove-btn"
    onclick={() => onRemove(entry.id)}
    disabled={disabled}
    title="削除"
  >
    &times;
  </button>
</div>

<style>
  .file-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: #1a1a16;
    border-radius: 8px;
    border: 1px solid #2d2d26;
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
  .file-info {
    flex: 1;
    min-width: 0;
  }
  .file-name {
    display: block;
    font-size: 0.9rem;
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
  .remove-btn {
    background: none;
    border: none;
    color: #737373;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    box-shadow: none;
  }
  .remove-btn:hover:not(:disabled) {
    color: #ef4444;
    background: #ef444422;
  }
  .remove-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .loading-text {
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }
  .progress-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }
  .progress-bar {
    flex: 1;
    height: 4px;
    background: #28281f;
    border-radius: 2px;
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: #a3a825;
    border-radius: 2px;
    transition: width 0.3s;
  }
  .progress-text {
    font-size: 0.7rem;
    color: #a3a825;
    min-width: 32px;
    text-align: right;
  }
  .status-done {
    font-size: 0.7rem;
    color: #22c55e;
    margin-top: 2px;
  }
  .status-error {
    font-size: 0.7rem;
    color: #ef4444;
    margin-top: 2px;
  }
</style>
