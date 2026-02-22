<script lang="ts">
  import FormatSettings from "./FormatSettings.svelte";
  import VolumeSettings from "./VolumeSettings.svelte";
  import TrimSettings from "./TrimSettings.svelte";
  import BitrateSettings from "./BitrateSettings.svelte";
  import SampleRateSettings from "./SampleRateSettings.svelte";
  import SilenceRemoveSettings from "./SilenceRemoveSettings.svelte";
  import { getAppState } from "$lib/stores.svelte";
  import { processFile, downloadBlob } from "$lib/commands";
  import type { ProcessingOptions, AudioFormat } from "$lib/types";
  import { getFileExtension, replaceExtension } from "$lib/utils";

  const state = getAppState();

  function buildOutputName(inputName: string): string {
    if (state.outputFormat !== "same") {
      return replaceExtension(inputName, state.outputFormat);
    } else {
      const ext = getFileExtension(inputName);
      const base = inputName.substring(0, inputName.length - ext.length - 1);
      return `${base}_processed.${ext}`;
    }
  }

  async function startProcessing() {
    if (state.files.length === 0) return;
    state.isProcessing = true;
    state.processingDone = false;

    state.files = state.files.map((f) => ({
      ...f,
      status: "pending" as const,
      progress: 0,
      error: undefined,
      resultBlob: undefined,
      outputName: buildOutputName(f.file.name),
    }));

    for (const entry of state.files) {
      const outputName = entry.outputName!;
      const options: ProcessingOptions = {
        input_file: entry.sourceFile,
        output_name: outputName,
        output_format:
          state.outputFormat === "same"
            ? undefined
            : (state.outputFormat as AudioFormat),
        volume: state.volume ?? undefined,
        trim: state.trim ?? undefined,
        bitrate: state.bitrate || undefined,
        sample_rate: state.sampleRate ?? undefined,
        silence_remove: state.silenceRemove ?? undefined,
      };

      const result = await processFile(options, (progress) => {
        state.updateFileProgress(
          progress.file_name,
          progress.percentage,
          progress.status === "completed" ? "completed" : "processing",
        );
      });

      if (result.success && result.blob) {
        state.setFileResult(entry.id, result.blob, outputName, result.outputInfo ?? undefined);
      } else if (result.error) {
        state.updateFileError(entry.file.name, result.error);
      }
    }

    state.isProcessing = false;
    state.processingDone = true;
  }

  function downloadAll() {
    for (const entry of state.files) {
      if (entry.resultBlob && entry.outputName) {
        downloadBlob(entry.resultBlob, entry.outputName);
      }
    }
  }
</script>

{#if state.files.length > 0}
  <section class="processing-form">
    <h2>処理設定</h2>
    <div class="settings-grid">
      <FormatSettings />
      <BitrateSettings />
      <SampleRateSettings />
      <VolumeSettings />
      <TrimSettings />
      <SilenceRemoveSettings />
    </div>
    <div class="actions">
      <button
        class="clear-btn"
        onclick={() => state.clearFiles()}
        disabled={state.isProcessing}
      >
        全てクリア
      </button>
      {#if state.processingDone && state.files.some((f) => f.resultBlob)}
        <button class="download-btn" onclick={downloadAll}>
          全てダウンロード
        </button>
      {/if}
      <button
        class="start-btn"
        onclick={startProcessing}
        disabled={state.files.length === 0 || state.isProcessing}
      >
        {#if state.isProcessing}
          処理中...
        {:else}
          処理開始
        {/if}
      </button>
    </div>
  </section>
{/if}

<style>
  .processing-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #d4d4d8;
  }
  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .actions {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
  }
  .clear-btn {
    padding: 10px 20px;
    border-radius: 8px;
    border: 1px solid #3f3f36;
    background: #28281f;
    color: #a3a3a3;
    font-size: 0.9rem;
    cursor: pointer;
    box-shadow: none;
  }
  .clear-btn:hover:not(:disabled) {
    background: #3f3f36;
    color: #e4e4e7;
  }
  .download-btn {
    padding: 10px 20px;
    border-radius: 8px;
    border: 1px solid #22c55e33;
    background: #22c55e22;
    color: #22c55e;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: none;
  }
  .download-btn:hover {
    background: #22c55e33;
  }
  .start-btn {
    padding: 10px 32px;
    border-radius: 8px;
    border: none;
    background: #a3a825;
    color: white;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: none;
    margin-left: auto;
  }
  .start-btn:hover:not(:disabled) {
    background: #8a8c2a;
  }
  .start-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .clear-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
