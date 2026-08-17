import { getAudioInfo } from "./commands";
import { getAppState } from "./stores.svelte";
import type { AudioFileInfo } from "./types";

export const SUPPORTED_EXTENSIONS = [".mp3", ".wav", ".ogg", ".flac"];

/** 解析が終わるまで表示しておく仮の情報 */
function makePlaceholderInfo(name: string): AudioFileInfo {
  return {
    name,
    duration_ms: 0,
    format: "",
    bitrate: null,
    sample_rate: null,
    channels: null,
    bit_depth: null,
    peak_db: null,
    rms_db: null,
    lufs: null,
    metadata: {},
    albumArtUrl: null,
  };
}

export function isSupportedFile(name: string): boolean {
  const ext = name.substring(name.lastIndexOf(".")).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext);
}

/**
 * ドラッグ&ドロップとファイル選択の共通取り込み処理。
 * まずプレースホルダを登録して即座にリストへ出し、その後 1 件ずつ解析して差し替える。
 * getAudioInfo 側でコア読み込み完了を待つため、初期ロード中に投入されても受け付けられる。
 */
export async function ingestFiles(fileList: FileList | File[]): Promise<void> {
  const appState = getAppState();

  for (const file of Array.from(fileList)) {
    if (!isSupportedFile(file.name)) continue;

    const existing = appState.files.find((f) => f.file.name === file.name);
    const entryId = existing?.id ?? crypto.randomUUID();

    if (existing) {
      appState.updateFile(entryId, { status: "loading", progress: 0 });
    } else {
      appState.addFile({
        id: entryId,
        file: makePlaceholderInfo(file.name),
        sourceFile: file,
        status: "loading",
        progress: 0,
      });
    }

    try {
      const info = await getAudioInfo(file);
      // 解析中に処理が始まっていた場合、status を pending に巻き戻さない
      const current = appState.getFileStatus(entryId);
      const keepStatus = current === "processing" || current === "completed";
      const applied = appState.updateFile(
        entryId,
        keepStatus
          ? { file: info, sourceFile: file }
          : { file: info, sourceFile: file, status: "pending", progress: 0 },
      );
      // 解析中にリストから削除されていた場合、作った objectURL を解放する
      if (!applied && info.albumArtUrl) {
        URL.revokeObjectURL(info.albumArtUrl);
      }
    } catch (e) {
      console.error(`ファイル情報取得失敗: ${file.name}`, e);
      appState.updateFile(entryId, { status: "error", error: String(e) });
    }
  }
}
