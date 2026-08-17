import { analyzeFiles } from "./commands";
import { getAppState } from "./stores.svelte";
import type { AudioFileInfo, FileEntry } from "./types";

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
 *
 * 先に全ファイルのプレースホルダをまとめて登録してリストへ出し、そのあとで
 * プールを使って並列に解析する（大量投入時の待ち時間を短くするため）。
 * コア読み込み完了は解析側で待つので、初期ロード中に投入されても受け付けられる。
 */
export async function ingestFiles(fileList: FileList | File[]): Promise<void> {
  const appState = getAppState();

  const targets: { id: string; file: File }[] = [];
  const newEntries: FileEntry[] = [];

  for (const file of Array.from(fileList)) {
    if (!isSupportedFile(file.name)) continue;

    const existing = appState.files.find((f) => f.file.name === file.name);
    const entryId = existing?.id ?? crypto.randomUUID();

    if (existing) {
      appState.updateFile(entryId, { status: "loading", progress: 0 });
    } else {
      newEntries.push({
        id: entryId,
        file: makePlaceholderInfo(file.name),
        sourceFile: file,
        status: "loading",
        progress: 0,
      });
    }
    targets.push({ id: entryId, file });
  }

  // 1 件ずつ追加すると配列の作り直しが件数分走るため、まとめて登録する
  appState.addFiles(newEntries);
  if (targets.length === 0) return;

  const idByFile = new Map(targets.map((t) => [t.file, t.id]));

  await analyzeFiles(
    targets.map((t) => t.file),
    (file, info, error) => {
      const entryId = idByFile.get(file);
      if (!entryId) return;

      if (!info) {
        console.error(`ファイル情報取得失敗: ${file.name}`, error);
        appState.updateFile(entryId, { status: "error", error: String(error) });
        return;
      }

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
    },
  );
}
