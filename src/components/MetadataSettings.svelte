<script lang="ts">
  import { getAppState } from "$lib/stores.svelte";
  import type { AudioFormat, MetadataFieldSetting, MetadataSettings } from "$lib/types";

  const appState = getAppState();

  const formatFields: Record<AudioFormat, string[]> = {
    mp3: [
      "title", "artist", "album", "album_artist", "composer", "genre",
      "track", "disc", "date", "comment", "copyright", "publisher",
      "encoded_by", "language",
    ],
    flac: [
      "title", "artist", "album", "album_artist", "composer", "genre",
      "track", "disc", "date", "comment", "copyright", "publisher",
    ],
    ogg: [
      "title", "artist", "album", "album_artist", "composer", "genre",
      "track", "disc", "date", "comment", "copyright", "publisher",
    ],
    wav: [
      "title", "artist", "album", "comment", "genre", "copyright", "date",
    ],
  };

  const fieldLabels: Record<string, string> = {
    title: "タイトル",
    artist: "アーティスト",
    album: "アルバム",
    album_artist: "アルバムアーティスト",
    composer: "作曲者",
    genre: "ジャンル",
    track: "トラック番号",
    disc: "ディスク番号",
    date: "日付",
    comment: "コメント",
    copyright: "著作権",
    publisher: "発行元",
    encoded_by: "エンコーダ",
    language: "言語",
  };

  let fieldModes: Record<string, string> = $state({});
  let bulkValues: Record<string, string> = $state({});
  let individualValues: Record<string, Record<string, string>> = $state({});

  // Album art state
  let albumArtMode: string = $state("unchanged");
  let albumArtBulkFile: File | null = $state(null);
  let albumArtBulkPreview: string | null = $state(null);
  let albumArtFiles: Record<string, File> = $state({});
  let albumArtPreviews: Record<string, string> = $state({});

  let formatActive = $derived(appState.outputFormat !== "same");
  let currentFormat = $derived(
    formatActive ? (appState.outputFormat as AudioFormat) : null,
  );
  let currentFields = $derived(
    currentFormat ? formatFields[currentFormat] ?? [] : [],
  );
  let individualFieldsList = $derived(
    currentFields.filter((f) => (fieldModes[f] ?? "unchanged") === "individual"),
  );
  let isMp3 = $derived(currentFormat === "mp3");
  let hasIndividualContent = $derived(
    individualFieldsList.length > 0 || (isMp3 && albumArtMode === "individual"),
  );

  let noAudioProcessing = $derived(
    appState.volume === null &&
    appState.trim === null &&
    !appState.bitrate &&
    appState.sampleRate === null &&
    !appState.bitDepth &&
    appState.silenceRemove === null &&
    appState.noiseReduce === null &&
    appState.frequencyFilter === null &&
    appState.dynamicsFilter === null &&
    appState.effectFilter === null &&
    appState.channelFilter === null &&
    appState.frequencyFilterExt === null &&
    appState.dynamicsFilterExt === null &&
    appState.effectFilterExt === null &&
    appState.repairFilter === null &&
    appState.stereoFilter === null,
  );

  const hiddenMetaKeys = new Set(["encoder", "major_brand", "minor_version", "compatible_brands"]);

  function formatMetaSummary(meta: Record<string, string>): string {
    const entries = Object.entries(meta)
      .filter(([k, v]) => v && !hiddenMetaKeys.has(k))
      .map(([k, v]) => `${fieldLabels[k] ?? k}: ${v}`);
    return entries.length > 0 ? entries.join(" / ") : "(なし)";
  }

  // Album art handlers
  function handleAlbumArtBulk(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) {
      albumArtBulkFile = file;
      if (albumArtBulkPreview) URL.revokeObjectURL(albumArtBulkPreview);
      albumArtBulkPreview = URL.createObjectURL(file);
    }
    input.value = "";
  }

  function clearAlbumArtBulk() {
    albumArtBulkFile = null;
    if (albumArtBulkPreview) {
      URL.revokeObjectURL(albumArtBulkPreview);
      albumArtBulkPreview = null;
    }
  }

  function handleAlbumArtIndividual(fileId: string, e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (file) {
      albumArtFiles[fileId] = file;
      if (albumArtPreviews[fileId]) URL.revokeObjectURL(albumArtPreviews[fileId]);
      albumArtPreviews[fileId] = URL.createObjectURL(file);
    }
    input.value = "";
  }

  function clearAlbumArtIndividual(fileId: string) {
    if (albumArtPreviews[fileId]) {
      URL.revokeObjectURL(albumArtPreviews[fileId]);
    }
    const { [fileId]: _f, ...restFiles } = albumArtFiles;
    albumArtFiles = restFiles;
    const { [fileId]: _p, ...restPreviews } = albumArtPreviews;
    albumArtPreviews = restPreviews;
  }

  function clearAllAlbumArt() {
    clearAlbumArtBulk();
    for (const url of Object.values(albumArtPreviews)) {
      URL.revokeObjectURL(url);
    }
    albumArtFiles = {};
    albumArtPreviews = {};
    albumArtMode = "unchanged";
  }

  // Push metadata settings to store
  $effect(() => {
    const fields = currentFields;
    const fileList = appState.files;

    if (!formatActive || fields.length === 0) {
      appState.metadataSettings = null;
      return;
    }

    const settings: MetadataSettings = {};
    let hasNonDefault = false;

    for (const field of fields) {
      const mode = (fieldModes[field] ?? "unchanged") as MetadataFieldSetting["mode"];
      if (mode !== "unchanged") hasNonDefault = true;

      const bv = bulkValues[field] ?? "";
      const iv: Record<string, string> = {};
      if (mode === "individual") {
        for (const file of fileList) {
          const v = individualValues[field]?.[file.id] ?? "";
          if (v) iv[file.id] = v;
        }
      }

      settings[field] = { mode, bulkValue: bv, individualValues: iv };
    }

    appState.metadataSettings = hasNonDefault ? settings : null;
  });

  // Push album art to store
  $effect(() => {
    if (!isMp3 || albumArtMode === "unchanged") {
      appState.albumArt = null;
      appState.albumArtMap = {};
    } else if (albumArtMode === "bulk") {
      appState.albumArt = albumArtBulkFile;
      appState.albumArtMap = {};
    } else if (albumArtMode === "individual") {
      appState.albumArt = null;
      appState.albumArtMap = { ...albumArtFiles };
    }
  });

  // Reset
  let lastResetCounter = appState.settingsResetCounter;
  $effect(() => {
    const current = appState.settingsResetCounter;
    if (current !== lastResetCounter) {
      lastResetCounter = current;
      fieldModes = {};
      bulkValues = {};
      individualValues = {};
      clearAllAlbumArt();
    }
  });
</script>

{#if !formatActive}
  <p class="hint">出力フォーマットを指定すると、メタデータ項目が表示されます。</p>
{:else}
  <div class="metadata-settings">
    <div class="copy-status-group">
      <div class="copy-status" class:active={noAudioProcessing} class:dim={!noAudioProcessing}>
        ストリームコピー — 形式が同じでかつ他の処理がない場合、音声データは無変更でメタデータのみ書き換えます
      </div>
      <div class="copy-status" class:active={!noAudioProcessing} class:dim={noAudioProcessing}>
        再エンコード — 他の処理設定が有効なため、音声データは再エンコードされます
      </div>
    </div>
    <div class="field-settings">
      {#each currentFields as field}
        <div class="field-row">
          <span class="field-label">{fieldLabels[field]}</span>
          <select
            class="mode-select"
            value={fieldModes[field] ?? "unchanged"}
            onchange={(e) => {
              const mode = e.currentTarget.value;
              fieldModes[field] = mode;
              if (mode === "individual" && !individualValues[field]) {
                const iv: Record<string, string> = {};
                for (const file of appState.files) {
                  const existing = file.file.metadata[field];
                  if (existing) iv[file.id] = existing;
                }
                individualValues[field] = iv;
              }
            }}
            disabled={appState.isProcessing}
          >
            <option value="unchanged">変更しない</option>
            <option value="bulk">一括設定</option>
            <option value="individual">個別設定</option>
          </select>
          {#if (fieldModes[field] ?? "unchanged") === "bulk"}
            <input
              type="text"
              class="bulk-input"
              value={bulkValues[field] ?? ""}
              oninput={(e) => { bulkValues[field] = e.currentTarget.value; }}
              disabled={appState.isProcessing}
              placeholder={fieldLabels[field]}
            />
          {/if}
        </div>
      {/each}

      {#if isMp3}
        <div class="field-row">
          <span class="field-label">アルバムアート</span>
          <select
            class="mode-select"
            value={albumArtMode}
            onchange={(e) => { albumArtMode = e.currentTarget.value; }}
            disabled={appState.isProcessing}
          >
            <option value="unchanged">変更しない</option>
            <option value="bulk">一括設定</option>
            <option value="individual">個別設定</option>
          </select>
          {#if albumArtMode === "bulk"}
            {#if albumArtBulkFile && albumArtBulkPreview}
              <div class="art-inline">
                <img src={albumArtBulkPreview} alt="" class="art-thumb-sm" />
                <span class="art-filename-sm">{albumArtBulkFile.name}</span>
                <button class="art-clear-btn-sm" onclick={clearAlbumArtBulk} disabled={appState.isProcessing}>&times;</button>
              </div>
            {:else}
              <label class="art-pick-label" class:disabled={appState.isProcessing}>
                <input type="file" accept="image/jpeg,image/png" onchange={handleAlbumArtBulk} disabled={appState.isProcessing} class="art-file-input" />
                画像を選択
              </label>
            {/if}
          {/if}
        </div>
      {/if}
    </div>

    {#if appState.files.length > 0}
      <div class="file-list-section">
        <div class="section-label">入力ファイル情報</div>
        {#each appState.files as file}
          <div class="file-meta-card">
            <div class="file-meta-header">
              {#if file.file.albumArtUrl}
                <img src={file.file.albumArtUrl} alt="" class="file-art-thumb" />
              {/if}
              <div class="file-meta-text">
                <span class="file-name" title={file.file.name}>{file.file.name}</span>
                <span class="meta-summary">{formatMetaSummary(file.file.metadata)}</span>
              </div>
            </div>
            {#if hasIndividualContent}
              <div class="individual-fields">
                {#each individualFieldsList as field}
                  <div class="individual-row">
                    <label class="ind-label" for="ind-{file.id}-{field}">{fieldLabels[field]}</label>
                    <input
                      id="ind-{file.id}-{field}"
                      type="text"
                      class="ind-input"
                      value={individualValues[field]?.[file.id] ?? ""}
                      oninput={(e) => {
                        if (!individualValues[field]) individualValues[field] = {};
                        individualValues[field][file.id] = e.currentTarget.value;
                      }}
                      disabled={appState.isProcessing}
                      placeholder={fieldLabels[field]}
                    />
                  </div>
                {/each}
                {#if isMp3 && albumArtMode === "individual"}
                  <div class="individual-row">
                    <span class="ind-label">アルバムアート</span>
                    {#if albumArtFiles[file.id] && albumArtPreviews[file.id]}
                      <div class="art-inline">
                        <img src={albumArtPreviews[file.id]} alt="" class="art-thumb-sm" />
                        <span class="art-filename-sm">{albumArtFiles[file.id].name}</span>
                        <button class="art-clear-btn-sm" onclick={() => clearAlbumArtIndividual(file.id)} disabled={appState.isProcessing}>&times;</button>
                      </div>
                    {:else}
                      <label class="art-pick-label" class:disabled={appState.isProcessing}>
                        <input type="file" accept="image/jpeg,image/png" onchange={(e) => handleAlbumArtIndividual(file.id, e)} disabled={appState.isProcessing} class="art-file-input" />
                        画像を選択
                      </label>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  .metadata-settings {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .hint {
    font-size: 0.8rem;
    color: #737373;
    margin: 0;
  }
  .copy-status-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .copy-status {
    font-size: 0.75rem;
    padding: 6px 10px;
    border-radius: 6px;
    background: #a3a3a30e;
    color: #a3a3a3;
    border: 1px solid #3f3f36;
    transition: opacity 0.15s;
  }
  .copy-status.active {
    background: #22c55e12;
    color: #22c55e;
    border-color: #22c55e33;
  }
  .copy-status.dim {
    opacity: 0.3;
  }
  .field-settings {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .field-label {
    font-size: 0.8rem;
    color: #a3a3a3;
    min-width: 140px;
    text-align: right;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .mode-select {
    padding: 3px 6px;
    border: 1px solid #3f3f36;
    border-radius: 4px;
    background: #1a1a16;
    color: #e4e4e7;
    font-size: 0.8rem;
    outline: none;
    flex-shrink: 0;
  }
  .mode-select:focus {
    border-color: #a3a825;
  }
  .mode-select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .bulk-input {
    flex: 1;
    padding: 3px 8px;
    border: 1px solid #3f3f36;
    border-radius: 4px;
    background: #1a1a16;
    color: #e4e4e7;
    font-size: 0.8rem;
    outline: none;
    min-width: 0;
  }
  .bulk-input:focus {
    border-color: #a3a825;
  }
  .bulk-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .bulk-input::placeholder {
    color: #52524e;
  }
  .file-list-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid #3f3f36;
    padding-top: 12px;
  }
  .section-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #a3a3a3;
  }
  .file-meta-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 6px 10px;
    background: #1a1a16;
    border: 1px solid #2d2d26;
    border-radius: 6px;
  }
  .file-meta-header {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .file-art-thumb {
    width: 36px;
    height: 36px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #3f3f36;
    flex-shrink: 0;
  }
  .file-meta-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .file-name {
    font-size: 0.8rem;
    font-weight: 500;
    color: #e4e4e7;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .meta-summary {
    font-size: 0.75rem;
    color: #737373;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .individual-fields {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-top: 4px;
  }
  .individual-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ind-label {
    font-size: 0.8rem;
    color: #a3a3a3;
    white-space: nowrap;
    min-width: 100px;
    text-align: right;
    flex-shrink: 0;
  }
  .ind-input {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid #3f3f36;
    border-radius: 4px;
    background: #28281f;
    color: #e4e4e7;
    font-size: 0.85rem;
    outline: none;
  }
  .ind-input:focus {
    border-color: #a3a825;
  }
  .ind-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ind-input::placeholder {
    color: #52524e;
  }
  /* Album art inline styles */
  .art-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }
  .art-thumb-sm {
    width: 28px;
    height: 28px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #3f3f36;
    flex-shrink: 0;
  }
  .art-filename-sm {
    font-size: 0.75rem;
    color: #a3a3a3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .art-clear-btn-sm {
    padding: 2px 8px;
    border: 1px solid #3f3f36;
    border-radius: 4px;
    background: #28281f;
    color: #a3a3a3;
    font-size: 0.8rem;
    cursor: pointer;
    flex-shrink: 0;
    line-height: 1;
  }
  .art-clear-btn-sm:hover:not(:disabled) {
    background: #3f3f36;
    color: #e4e4e7;
  }
  .art-clear-btn-sm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .art-pick-label {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border: 1px dashed #3f3f36;
    border-radius: 4px;
    background: #1a1a16;
    color: #a3a3a3;
    font-size: 0.8rem;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  .art-pick-label:hover:not(.disabled) {
    border-color: #a3a825;
    color: #e4e4e7;
  }
  .art-pick-label.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .art-file-input {
    display: none;
  }
</style>
