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
    <span class="status-ok">{info.version}</span>
  {:else if error}
    <span class="status-error">読み込み失敗</span>
  {:else}
    <span class="status-loading">読み込み中...</span>
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
</style>
