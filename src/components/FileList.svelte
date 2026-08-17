<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import { downloadBlob } from "$lib/commands";
  import { ZipTooLargeError, createZipBlob } from "$lib/zip";
  import FileListItem from "./FileListItem.svelte";
  import OutputFileItem from "./OutputFileItem.svelte";

  const appState = getAppState();

  let zipping = $state(false);
  let zipProgress = $state(0);
  let zipError = $state<string | null>(null);

  function completedOutputs() {
    return appState.outputFiles.filter((f) => f.resultBlob);
  }

  /** ZIP を作れない場合の退避。1 ファイルずつダウンロードする */
  function downloadEachFile() {
    for (const entry of completedOutputs()) {
      downloadBlob(entry.resultBlob!, entry.outputName);
    }
  }

  async function downloadAll() {
    const outputs = completedOutputs();
    if (outputs.length === 0) return;
    // 1 ファイルだけなら ZIP にせずそのまま渡す
    if (outputs.length === 1) {
      downloadBlob(outputs[0].resultBlob!, outputs[0].outputName);
      return;
    }

    zipping = true;
    zipProgress = 0;
    zipError = null;
    try {
      const zip = await createZipBlob(
        outputs.map((entry) => ({
          name: entry.outputName,
          blob: entry.resultBlob!,
        })),
        (done, total) => {
          zipProgress = Math.round((done / total) * 100);
        },
      );
      downloadBlob(zip, zipFileName());
    } catch (e) {
      console.error("ZIP の作成に失敗しました", e);
      zipError =
        e instanceof ZipTooLargeError
          ? "4GB を超えるため個別にダウンロードします"
          : "ZIP を作れなかったため個別にダウンロードします";
      downloadEachFile();
    } finally {
      zipping = false;
    }
  }

  function zipFileName(): string {
    const now = new Date();
    const p = (v: number) => String(v).padStart(2, "0");
    return `MornAudioProcessor_${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}_${p(now.getHours())}${p(now.getMinutes())}${p(now.getSeconds())}.zip`;
  }
</script>

{#if appState.files.length > 0 || appState.outputFiles.length > 0}
  <div class="file-panels">
    <div class="panel">
      <div class="panel-header">
        <h3>入力ファイル ({appState.files.length})</h3>
        {#if appState.files.length > 0}
          <button
            class="panel-btn clear-btn"
            onclick={() => appState.clearInputFiles()}
            disabled={appState.isProcessing}
          >
            リストをクリア
          </button>
        {/if}
      </div>
      <div class="panel-items">
        {#if appState.files.length > 0}
          {#each appState.files as entry (entry.id)}
            <FileListItem
              {entry}
              onRemove={(id) => appState.removeFile(id)}
              disabled={appState.isProcessing}
            />
          {/each}
        {:else}
          <div class="placeholder">
            ファイルをドラッグ＆ドロップまたはクリックで追加
          </div>
        {/if}
      </div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <h3>出力ファイル ({appState.outputFiles.length})</h3>
        <div class="panel-header-actions">
          {#if appState.outputFiles.some((f) => f.resultBlob)}
            <button
              class="panel-btn download-btn"
              onclick={downloadAll}
              disabled={zipping}
            >
              {#if zipping}
                ZIP 作成中 {zipProgress}%
              {:else if appState.outputFiles.filter((f) => f.resultBlob).length > 1}
                ZIP でまとめてダウンロード
              {:else}
                ダウンロード
              {/if}
            </button>
          {/if}
          {#if appState.outputFiles.length > 0}
            <button
              class="panel-btn clear-btn"
              onclick={() => appState.clearOutputFiles()}
              disabled={appState.isProcessing}
            >
              リストをクリア
            </button>
          {/if}
        </div>
      </div>
      {#if zipError}
        <div class="zip-error">{zipError}</div>
      {/if}
      <div class="panel-items">
        {#if appState.outputFiles.length > 0}
          {#each appState.outputFiles as entry (entry.id)}
            <OutputFileItem {entry} />
          {/each}
        {:else}
          <div class="placeholder">
            処理を開始すると変換結果が表示されます
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .file-panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .panel-header-actions {
    display: flex;
    gap: 6px;
  }
  .panel-header h3 {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
    color: #a3a3a3;
  }
  .panel-btn {
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
    box-shadow: none;
  }
  .panel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .clear-btn {
    border: 1px solid #3f3f36;
    background: #28281f;
    color: #a3a3a3;
  }
  .clear-btn:hover:not(:disabled) {
    background: #3f3f36;
    color: #e4e4e7;
  }
  .download-btn {
    border: 1px solid #22c55e33;
    background: #22c55e22;
    color: #22c55e;
    font-weight: 600;
  }
  .download-btn:hover {
    background: #22c55e33;
  }
  .panel-items {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 300px;
    overflow-y: auto;
  }
  .placeholder {
    padding: 24px 14px;
    text-align: center;
    font-size: 0.8rem;
    color: #525252;
    background: #1a1a16;
    border-radius: 8px;
    border: 1px dashed #2d2d26;
  }
  .zip-error {
    margin: 0 0 8px;
    padding: 6px 10px;
    font-size: 0.75rem;
    color: #f0a3a3;
    background: #2a1c1c;
    border: 1px solid #5a2b2b;
    border-radius: 6px;
  }
</style>
