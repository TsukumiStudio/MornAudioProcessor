<script lang="ts">
  import type { FileEntry } from "$lib/types";
  import { formatDuration, formatBitrate, formatSampleRate, getFileName } from "$lib/utils";

  interface Props {
    entry: FileEntry;
    onRemove: (id: string) => void;
    disabled: boolean;
  }

  let { entry, onRemove, disabled }: Props = $props();
</script>

<div class="file-item" class:completed={entry.status === "completed"} class:error={entry.status === "error"}>
  <div class="file-info">
    <span class="file-name">{getFileName(entry.file.path)}</span>
    <span class="file-meta">
      {formatDuration(entry.file.duration_ms)} | {formatBitrate(entry.file.bitrate)} | {formatSampleRate(entry.file.sample_rate)} | {entry.file.format}
    </span>
  </div>

  {#if entry.status === "processing"}
    <div class="progress-bar">
      <div class="progress-fill" style="width: {entry.progress}%"></div>
    </div>
    <span class="progress-text">{Math.round(entry.progress)}%</span>
  {:else if entry.status === "completed"}
    <span class="status-badge completed">完了</span>
  {:else if entry.status === "error"}
    <span class="status-badge error" title={entry.error}>エラー</span>
  {/if}

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
  .file-item.completed {
    border-color: #22c55e33;
  }
  .file-item.error {
    border-color: #ef444433;
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
  .progress-bar {
    width: 80px;
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
</style>
