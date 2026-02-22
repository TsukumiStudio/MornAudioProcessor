<script lang="ts">
  import type { FfmpegInfo } from "$lib/types";

  interface Props {
    info: FfmpegInfo | null;
    error: string | null;
  }

  let { info, error }: Props = $props();
</script>

<div class="ffmpeg-status">
  {#if info}
    <span class="status-ok">ffmpeg: {info.version}</span>
  {:else if error}
    <span class="status-error">ffmpegが見つかりません</span>
    <p class="install-guide">{error}</p>
  {:else}
    <span class="status-loading">ffmpegを検出中...</span>
  {/if}
</div>

<style>
  .ffmpeg-status {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.85rem;
  }
  .status-ok {
    color: #22c55e;
  }
  .status-error {
    color: #ef4444;
    font-weight: bold;
  }
  .status-loading {
    color: #a3a3a3;
  }
  .install-guide {
    margin-top: 8px;
    padding: 12px;
    background: #1a1a16;
    border-radius: 6px;
    white-space: pre-line;
    font-family: monospace;
    font-size: 0.8rem;
    color: #d4d4d8;
  }
</style>
