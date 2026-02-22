<script lang="ts">
  import type { FileEntry } from "$lib/types";
  import { formatDuration, formatBitrate, formatSampleRate } from "$lib/utils";

  interface Props {
    entry: FileEntry;
    onRemove: (id: string) => void;
    disabled: boolean;
  }

  let { entry, onRemove, disabled }: Props = $props();
</script>

<div class="file-item">
  <div class="file-info">
    <span class="file-name">{entry.file.name}</span>
    <span class="file-meta">
      {formatDuration(entry.file.duration_ms)} | {formatBitrate(entry.file.bitrate)} | {formatSampleRate(entry.file.sample_rate)} | {entry.file.format}
    </span>
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
