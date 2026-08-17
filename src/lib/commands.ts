import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import type {
  FfmpegInfo,
  AudioFileInfo,
  ProcessingOptions,
  ProcessingResult,
  ProgressInfo,
} from "./types";
import { getFileExtension } from "./utils";
import {
  appendAlbumArtArgs,
  appendMetadata,
  appendOutputEncoding,
  buildFFmpegArgs,
  getAlbumArtVfsName,
  getExtWithDot,
} from "./ffmpeg/buildArgs";
import {
  disposeExtras,
  discardSlot,
  getPrimary,
  getSlot,
  maxParallel,
  memoryBudgetBytes,
  noteSlotUsage,
  resetPool,
  terminateAll,
} from "./ffmpeg-pool";
import {
  MemoryGate,
  estimateJobBytes,
  isFatalInstanceError,
} from "./pool-policy";
import { decodeAudioFile } from "./audio-decode";
import { analyzeLufs, analyzePeakRms } from "./loudness";

let readyPromise: Promise<FfmpegInfo> | null = null;
/** 変換バッチの実行中か（解析側が並列度を落とす判断に使う） */
let batchRunning = false;
/** 中止が要求されたか */
let cancelRequested = false;

/**
 * 実行中の変換バッチを中止する。
 * 全インスタンスを terminate すると実行中の exec が即座に reject されるので、
 * 長いファイルの途中でも待たずに止まる。未着手のファイルは pending のまま残す。
 */
export function cancelProcessing() {
  if (!batchRunning) return;
  cancelRequested = true;
  terminateAll();
}

export function isCancelRequested(): boolean {
  return cancelRequested;
}

export function initFFmpeg(
  onProgress?: (message: string) => void,
): Promise<FfmpegInfo> {
  readyPromise = (async () => {
    onProgress?.("Worker を起動中...");
    const loading = getPrimary().load();
    onProgress?.("FFmpeg コアを読み込み中...");
    // コアは gzip 転送でも 10MB 超あるため、固定タイムアウトは設けない
    // （低速回線で必ず失敗してしまうため）。失敗はネットワークエラーで検知する。
    await loading;
    onProgress?.("初期化完了");
    return { version: "ffmpeg.wasm" };
  })();
  return readyPromise;
}

/** コアの読み込み完了を待つ。読み込み中に投入されたファイルの処理に使う */
export function waitForFFmpeg(): Promise<FfmpegInfo> {
  if (!readyPromise) {
    return Promise.reject(new Error("FFmpeg の初期化が開始されていません"));
  }
  return readyPromise;
}

export function resetFFmpeg(): Promise<void> {
  const reset = resetPool().then(() => ({ version: "ffmpeg.wasm" as const }));
  // 再ロード中に waitForFFmpeg() が「準備済み」と誤答しないよう差し替える
  readyPromise = reset;
  return reset.then(() => undefined);
}

/** 単一ファイルを解析する（primary 固定）。複数件は analyzeFiles を使う */
export async function getAudioInfo(file: File): Promise<AudioFileInfo> {
  try {
    return await probeWithRecovery(file, 0);
  } finally {
    // run() を抜けたあとで判定する（実行中のインスタンスを破棄しないため）
    noteSlotUsage(0, file.size);
  }
}

/**
 * 複数ファイルをプールで並列に解析する。
 *
 * 変換バッチが走っている間は並列度 1（primary 固定）に落とす。解析と変換で
 * メモリ予算を取り合わないようにするためで、従来と同じ挙動になる。
 * 結果は完了順に onResult へ渡す（投入順とは一致しない）。
 */
export async function analyzeFiles(
  files: File[],
  onResult: (file: File, info: AudioFileInfo | null, error?: unknown) => void,
): Promise<void> {
  if (files.length === 0) return;

  const slots = batchRunning ? 1 : Math.min(maxParallel(), files.length);
  const gate = new MemoryGate(memoryBudgetBytes());
  let nextIndex = 0;

  if (import.meta.env.DEV) {
    console.info(`[pool] 解析の並列度=${slots}（${files.length} 件）`);
  }

  const worker = async (slot: number) => {
    while (true) {
      const index = nextIndex++;
      if (index >= files.length) return;
      const file = files[index];

      // 解析は中間ファイルを作らないので見積りは 1 コピー分
      const bytes = estimateJobBytes({
        inputSize: file.size,
        durationMs: null,
        sampleRate: null,
        channels: null,
        usesIntermediate: false,
      });
      await gate.admit(bytes);
      try {
        onResult(file, await probeWithRecovery(file, slot));
      } catch (e) {
        onResult(file, null, e);
      } finally {
        noteSlotUsage(slot, file.size);
        gate.release(bytes);
      }
    }
  };

  try {
    await Promise.all(Array.from({ length: slots }, (_, slot) => worker(slot)));
  } finally {
    if (!batchRunning) disposeExtras();
  }
}

/**
 * 解析中に wasm がトラップした場合、そのインスタンスは以降も使えない。
 * 作り直して 1 回だけやり直す。これが無いと 1 件の失敗（メモリ不足など）で
 * 残り全ファイルが同じエラーを出し続ける。
 */
async function probeWithRecovery(
  file: File,
  slot: number,
): Promise<AudioFileInfo> {
  try {
    return await runProbe(file, slot);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (!isFatalInstanceError(message)) throw e;

    console.warn(
      `FFmpeg インスタンスが壊れたため作り直して再試行します: ${file.name}`,
      e,
    );
    discardSlot(slot);
    return runProbe(file, slot);
  }
}

/**
 * 1 ファイルを解析する。
 *
 * ffmpeg にはヘッダとメタデータの読み取り（とアルバムアート抽出）だけを任せ、
 * peak/RMS/LUFS はブラウザのネイティブデコード + JS 計測で求める。
 * ネイティブデコードに失敗した場合だけ ffmpeg でフルデコード計測にフォールバックする。
 */
async function runProbe(file: File, slot: number): Promise<AudioFileInfo> {
  const header = await probeWithFFmpeg(file, slot, false);
  const measured = await measureWithNativeDecode(header, file);
  if (measured) return measured;

  // 非対応コーデックなど。従来どおり ffmpeg でフルデコード計測にフォールバックする
  if (import.meta.env.DEV) {
    console.info(`[probe] ネイティブデコード不可のため ffmpeg で計測: ${file.name}`);
  }
  return probeWithFFmpeg(file, slot, true);
}

/**
 * ヘッダ情報にネイティブデコードで求めた peak/RMS/LUFS を載せて返す。
 * デコードできなければ null（呼び出し側が ffmpeg 計測にフォールバックする）。
 */
async function measureWithNativeDecode(
  header: AudioFileInfo,
  source: Blob,
): Promise<AudioFileInfo | null> {
  // ヘッダから読めたサンプルレートを渡してリサンプルを避ける
  const hintedRate = header.sample_rate ? parseInt(header.sample_rate, 10) : null;
  const decoded = await decodeAudioFile(source, hintedRate);
  if (!decoded) return null;

  const { peakDb, rmsDb } = analyzePeakRms(decoded.channels);
  const lufs = analyzeLufs(decoded.channels, decoded.sampleRate);

  return {
    ...header,
    // 長さはデコード結果の方が正確（mp3 のヘッダはパディング分だけ長く出る）
    duration_ms: decoded.durationMs || header.duration_ms,
    peak_db: Math.round(peakDb * 10) / 10,
    rms_db: Math.round(rmsDb * 10) / 10,
    lufs: lufs !== null ? Math.round(lufs * 10) / 10 : null,
  };
}

function probeWithFFmpeg(
  file: File,
  slot: number,
  measure: boolean,
): Promise<AudioFileInfo> {
  // インスタンス内は直列。変換中に投入された場合もそのキューで順番待ちする
  return getSlot(slot).run(async (ff) => {
    const tempName = "probe_input" + getExtWithDot(file.name);
    const artOut = "probe_art_extract.jpg";
    // アート抽出を試みたか（試していないファイルを削除しようとしないため）
    let hasArtOutput = false;

    try {
      await ff.writeFile(tempName, await fetchFile(file));
      const { hasVideoStream, ...info } = await probeAudioInfo(
        ff,
        tempName,
        file.size,
        measure,
      );

      // アルバムアートは映像ストリームがある場合だけ抽出する。
      // 無いファイルに対して抽出 exec を走らせると必ず失敗し、それを繰り返すと
      // ffmpeg.wasm の worker が固まって以降のファイルが一切処理されなくなる
      // （実測: 17 ファイル目前後でハング）。
      let albumArtUrl: string | null = null;
      if (hasVideoStream) {
        hasArtOutput = true;
        try {
          // -update 1 は単一画像を書き出す指定。付けないと image2 muxer が
          // 「連番パターンがない」と警告し、終了コードも信頼できなくなる。
          // 成否は終了コードではなく書き出されたバイト列で判断する。
          await ff.exec([
            "-i", tempName, "-an", "-vcodec", "copy", "-update", "1", "-y", artOut,
          ]);
          const artData = await ff.readFile(artOut);
          if (artData instanceof Uint8Array && artData.length > 100) {
            const mime = artData[0] === 0x89 && artData[1] === 0x50 ? "image/png" : "image/jpeg";
            albumArtUrl = URL.createObjectURL(new Blob([artData], { type: mime }));
          }
        } catch {}
      }

      return { ...info, name: file.name, albumArtUrl };
    } finally {
      const cleanup = hasArtOutput ? [tempName, artOut] : [tempName];
      for (const name of cleanup) {
        try {
          await ff.deleteFile(name);
        } catch {}
      }
    }
  });
}

async function detectVolume(
  ff: FFmpeg,
  inputName: string,
): Promise<{ peak: number; rms: number }> {
  let peak = 0;
  let rms = 0;
  const logHandler = ({ message }: { message: string }) => {
    const peakMatch = message.match(/max_volume:\s*([-\d.]+)\s*dB/);
    if (peakMatch) peak = parseFloat(peakMatch[1]);
    const rmsMatch = message.match(/mean_volume:\s*([-\d.]+)\s*dB/);
    if (rmsMatch) rms = parseFloat(rmsMatch[1]);
  };
  ff.on("log", logHandler);
  try {
    // 計測失敗を検知せず 0 を使うと、無加工同然の出力を「成功」として返してしまう
    await execChecked(ff, ["-i", inputName, "-af", "volumedetect", "-f", "null", "-"]);
  } finally {
    ff.off("log", logHandler);
  }
  return { peak, rms };
}

interface LufsMeasurement {
  input_i: number;
  input_tp: number;
  input_lra: number;
  input_thresh: number;
  target_offset: number;
}

async function detectLufs(
  ff: FFmpeg,
  inputName: string,
  targetI: number = -14,
  targetTP: number = -1,
): Promise<LufsMeasurement> {
  let input_i = 0;
  let input_tp = 0;
  let input_lra = 0;
  let input_thresh = 0;
  let target_offset = 0;
  const logHandler = ({ message }: { message: string }) => {
    const iMatch = message.match(/"input_i"\s*:\s*"([-\d.]+)"/);
    if (iMatch) input_i = parseFloat(iMatch[1]);
    const tpMatch = message.match(/"input_tp"\s*:\s*"([-\d.]+)"/);
    if (tpMatch) input_tp = parseFloat(tpMatch[1]);
    const lraMatch = message.match(/"input_lra"\s*:\s*"([-\d.]+)"/);
    if (lraMatch) input_lra = parseFloat(lraMatch[1]);
    const threshMatch = message.match(/"input_thresh"\s*:\s*"([-\d.]+)"/);
    if (threshMatch) input_thresh = parseFloat(threshMatch[1]);
    const offsetMatch = message.match(/"target_offset"\s*:\s*"([-\d.]+)"/);
    if (offsetMatch) target_offset = parseFloat(offsetMatch[1]);
  };
  ff.on("log", logHandler);
  try {
    // 計測失敗を検知せず 0 を使うと、約 14dB 小さい出力を「成功」として返してしまう
    await execChecked(ff, [
      "-i", inputName,
      "-af", `loudnorm=I=${targetI}:TP=${targetTP}:print_format=json`,
      "-f", "null", "-",
    ]);
  } finally {
    ff.off("log", logHandler);
  }
  return { input_i, input_tp, input_lra, input_thresh, target_offset };
}

/** プローブ結果。hasVideoStream は埋め込みアルバムアートの有無判定に使う */
type ProbeResult = AudioFileInfo & { hasVideoStream: boolean };

/**
 * ffmpeg でファイル情報を読む。
 * measure=false のときはデコードせずヘッダとメタデータだけを読む（既定）。
 * peak/RMS/LUFS はブラウザのネイティブデコード + JS 計測に任せるほうが桁違いに速い。
 * measure=true は JS 側でデコードできなかった場合のフォールバック。
 */
async function probeAudioInfo(
  ff: FFmpeg,
  fileName: string,
  blobSize: number,
  measure = false,
): Promise<ProbeResult> {
  let durationMs = 0;
  let hasVideoStream = false;
  let sampleRate: string | null = null;
  let channels: number | null = null;
  let bitrate: string | null = null;
  let bitDepth: string | null = null;
  let peakDb = 0;
  let rmsDb = 0;
  let lufsValue: number | null = null;
  let parsedMetadata: Record<string, string> = {};
  let inMetadata = false;
  let metadataCaptured = false;

  const logHandler = ({ message }: { message: string }) => {
    // 映像ストリーム（= 埋め込みアルバムアート）の有無。
    // 無いのにアート抽出 exec を走らせると失敗し、それを繰り返すと
    // ffmpeg.wasm の worker が固まるため、事前に判定して呼ばないようにする。
    if (/Stream #\d+:\d+.*: Video:/.test(message)) {
      hasVideoStream = true;
    }
    // メタデータブロックの解析（最初の Metadata: ブロックのみ）
    if (!metadataCaptured && /^\s+Metadata:\s*$/.test(message)) {
      inMetadata = true;
      return;
    }
    if (inMetadata) {
      const metaMatch = message.match(/^\s{4,}(\S+)\s*:\s*(.+)$/);
      if (metaMatch) {
        parsedMetadata[metaMatch[1].toLowerCase()] = metaMatch[2].trim();
        return;
      } else {
        inMetadata = false;
        metadataCaptured = true;
      }
    }
    // Duration: 00:00:03.25
    const durMatch = message.match(
      /Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/,
    );
    if (durMatch) {
      const h = parseInt(durMatch[1]);
      const m = parseInt(durMatch[2]);
      const s = parseInt(durMatch[3]);
      const cs = parseInt(durMatch[4].padEnd(2, "0").substring(0, 2));
      durationMs = (h * 3600 + m * 60 + s) * 1000 + cs * 10;
    }
    // Stream: Audio: codec, 44100 Hz, stereo, s16, ...
    // 入力ストリームの行（最初の1件）だけを使う。loudnorm は出力を 192kHz に
    // アップサンプルするため、後続の Output 行を拾うとサンプルレートが化ける。
    if (sampleRate === null) {
      const streamMatch = message.match(
        /Audio:.*?,\s*(\d+)\s*Hz,\s*(\w+)/,
      );
      if (streamMatch) {
        sampleRate = streamMatch[1];
        channels = streamMatch[2] === "mono" ? 1 : 2;
      }
    }
    // codec name: pcm_s24le, pcm_f32le, etc. (入力ストリームの最初の検出のみ使用)
    if (!bitDepth) {
      const codecMatch = message.match(/Audio:\s*(pcm_\w+)/);
      if (codecMatch) {
        const codec = codecMatch[1];
        const pcmMatch = codec.match(/^pcm_(s|f)(\d+)/);
        if (pcmMatch) {
          const isFloat = pcmMatch[1] === "f";
          bitDepth = isFloat ? `${pcmMatch[2]}-bit float` : `${pcmMatch[2]}-bit`;
        }
      }
    }
    // fallback: sample format (s16, s32, flt, fltp, dbl, dblp, etc.)
    if (!bitDepth) {
      const fmtMatch = message.match(
        /Audio:.*?,\s*\d+\s*Hz,\s*\w+,\s*(\w+)/,
      );
      if (fmtMatch) {
        const fmt = fmtMatch[1];
        if (fmt === "flt" || fmt === "fltp") {
          bitDepth = "32-bit float";
        } else if (fmt === "dbl" || fmt === "dblp") {
          bitDepth = "64-bit float";
        } else {
          const bitsMatch = fmt.match(/^s(\d+)/);
          if (bitsMatch) bitDepth = `${bitsMatch[1]}-bit`;
        }
      }
    }
    // max_volume
    const volMatch = message.match(/max_volume:\s*([-\d.]+)\s*dB/);
    if (volMatch) {
      peakDb = parseFloat(volMatch[1]);
    }
    // mean_volume (RMS)
    const rmsMatch = message.match(/mean_volume:\s*([-\d.]+)\s*dB/);
    if (rmsMatch) {
      rmsDb = parseFloat(rmsMatch[1]);
    }
    // LUFS（loudnorm の Integrated Loudness）
    const iMatch = message.match(/"input_i"\s*:\s*"([-\d.]+)"/);
    if (iMatch) lufsValue = parseFloat(iMatch[1]);
  };

  ff.on("log", logHandler);
  try {
    if (measure) {
      // peak/RMS と LUFS を 1 パスで計測する。
      // volumedetect を loudnorm より前に置くことで、loudnorm の利得適用前の値を測る。
      // exec は失敗しても reject せず非 0 を返すだけなので、コードで分岐する。
      const code = await ff.exec([
        "-i", fileName,
        "-af", "volumedetect,loudnorm=print_format=json",
        "-f", "null", "-",
      ]);
      if (code !== 0) {
        // loudnorm を連結できない入力向けフォールバック: volumedetect のみで再計測
        await ff.exec(["-i", fileName, "-af", "volumedetect", "-f", "null", "-"]);
      }
    } else {
      // ヘッダとメタデータだけ読む。出力を指定しないので ffmpeg はデコードせずに
      // 「At least one output file must be specified」で終わる（非 0 だが期待どおり）。
      // 実測: 3 分ステレオでフルデコード計測 4195ms に対し 38ms
      await ff.exec(["-i", fileName]);
    }
  } catch {
    // 表示用の情報なので、計測できなくても処理は続行する
  } finally {
    ff.off("log", logHandler);
  }

  const ext = getFileExtension(fileName).toLowerCase();
  const estimatedBitrate =
    durationMs > 0
      ? Math.round((blobSize * 8) / (durationMs / 1000) / 1000) + "kbps"
      : null;

  return {
    name: fileName,
    duration_ms: durationMs,
    format: ext || "unknown",
    bitrate: bitrate ?? estimatedBitrate,
    sample_rate: sampleRate,
    channels,
    bit_depth: bitDepth,
    peak_db: Math.round(peakDb * 10) / 10,
    rms_db: Math.round(rmsDb * 10) / 10,
    lufs: lufsValue !== null ? Math.round(lufsValue * 10) / 10 : null,
    metadata: parsedMetadata,
    albumArtUrl: null,
    hasVideoStream,
  };
}

/** 音声処理が不要でストリームコピー可能か判定 */
function isStreamCopyEligible(options: ProcessingOptions): boolean {
  const inputExt = getFileExtension(options.input_file.name).toLowerCase();
  const outputExt = getFileExtension(options.output_name).toLowerCase();
  if (inputExt !== outputExt) return false;

  return (
    !options.volume &&
    !options.trim &&
    !options.bitrate &&
    !options.sample_rate &&
    !options.bit_depth &&
    !options.silence_remove &&
    !options.noise_reduce &&
    !options.frequency_filter &&
    !options.dynamics_filter &&
    !options.effect_filter &&
    !options.channel_filter &&
    !options.frequency_filter_ext &&
    !options.dynamics_filter_ext &&
    !options.effect_filter_ext &&
    !options.repair_filter &&
    !options.stereo_filter
  );
}

function getMimeType(name: string): string {
  const ext = getFileExtension(name).toLowerCase();
  switch (ext) {
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "flac":
      return "audio/flac";
    default:
      return "audio/mpeg";
  }
}

/** 正規化時の中間ファイル名 */
const INTERMEDIATE_NAME = "temp_intermediate.wav";

/**
 * 変換用の exec。終了コードを検査して失敗を例外にする。
 * ffmpeg.wasm の exec は失敗しても reject しないため、これを省くと
 * 壊れた出力ファイルをそのまま「成功」として扱ってしまう。
 */
const EXEC_FAILURE_PREFIX = "ffmpeg の実行に失敗しました";

async function execChecked(ff: FFmpeg, args: string[]): Promise<void> {
  const code = await ff.exec(args);
  if (code !== 0) {
    throw new Error(`${EXEC_FAILURE_PREFIX}（終了コード ${code}）`);
  }
}

/** exec の終了コード起因の失敗（= インスタンスは健全）か */
function isExecFailure(e: unknown): boolean {
  return e instanceof Error && e.message.startsWith(EXEC_FAILURE_PREFIX);
}

/** 可逆（非圧縮・ロスレス）出力かどうか */
function isLosslessOutput(outputName: string): boolean {
  const ext = getFileExtension(outputName).toLowerCase();
  return ext === "wav" || ext === "flac";
}

/**
 * 正規化用の中間ファイル生成引数を組み立てる。
 * 音量・メタデータ・アルバムアート・出力エンコード指定は最終パスの担当なので中間からは外す。
 * （特にアルバムアートを渡すと WAV muxer が映像ストリームを扱えず exec が失敗する）
 * 中間は pcm_f32le 固定で、量子化誤差と 0dBFS 超過時のクリップを避ける。
 */
function buildIntermediateArgs(options: ProcessingOptions): string[] {
  return buildFFmpegArgs({
    ...options,
    output_name: INTERMEDIATE_NAME,
    volume: undefined,
    album_art: undefined,
    metadata: undefined,
    bitrate: undefined,
    ogg_quality: undefined,
    bit_depth: "f32",
  });
}

export interface ProcessingJob {
  options: ProcessingOptions;
  /** メモリ見積り用。解析済みの情報が無ければ null でよい */
  durationMs: number | null;
  sampleRate: number | null;
  channels: number | null;
}

/**
 * 複数ファイルをインスタンスプールで並列処理する。
 *
 * 並列度は端末に応じて自動決定するが、各インスタンスが wasm ヒープと MEMFS 上の
 * 入出力を抱えるため、メモリ見積りの合計が予算を超える場合は同時実行数を絞る。
 * 巨大ファイルばかりの場合は自然に直列（従来と同じ挙動）へ退化する。
 *
 * 結果は完了順に onResult へ渡す（投入順とは一致しない）。
 */
export async function processFiles(
  jobs: ProcessingJob[],
  onProgress?: (info: ProgressInfo) => void,
  onResult?: (result: ProcessingResult, index: number) => void,
): Promise<void> {
  if (jobs.length === 0) return;

  // 変換中は解析側の並列度を 1 に落とさせる（メモリ予算を取り合わないため）
  batchRunning = true;
  cancelRequested = false;
  const budget = memoryBudgetBytes();
  const slots = Math.min(maxParallel(), jobs.length);

  const estimates = jobs.map((job) =>
    estimateJobBytes({
      inputSize: job.options.input_file.size,
      durationMs: job.durationMs,
      sampleRate: job.sampleRate,
      channels: job.channels,
      usesIntermediate: usesIntermediateFile(job.options),
    }),
  );

  if (import.meta.env.DEV) {
    const mib = (n: number) => Math.round(n / 1024 / 1024) + "MiB";
    console.info(
      `[pool] 並列度=${slots} 予算=${mib(budget)} 見積り=[${estimates.map(mib).join(", ")}]`,
    );
  }

  let nextIndex = 0;
  const gate = new MemoryGate(budget);

  /** 指定スロットで 1 件処理する。run() 自体の失敗も結果オブジェクトに正規化する */
  const runOnSlot = async (
    slot: number,
    job: ProcessingJob,
    progress?: (info: ProgressInfo) => void,
  ): Promise<ProcessingResult> => {
    try {
      return await getSlot(slot).run((ff) =>
        runProcessFile(ff, job.options, progress),
      );
    } catch (e) {
      return {
        input_name: job.options.input_file.name,
        output_name: job.options.output_name,
        blob: null,
        success: false,
        error: e instanceof Error ? e.message : String(e),
        outputInfo: null,
        instanceBroken: true,
      };
    }
  };

  const worker = async (slot: number) => {
    while (true) {
      // 中止されたら未着手のファイルには手を付けない（pending のまま残す）
      if (cancelRequested) return;
      const index = nextIndex++;
      if (index >= jobs.length) return;

      const bytes = estimates[index];
      await gate.admit(bytes);
      try {
        let result = await runOnSlot(slot, jobs[index], onProgress);
        if (cancelRequested) {
          // 中止による失敗はエラーとして扱わない
          onResult?.({ ...result, success: false, cancelled: true }, index);
          return;
        }
        if (result.instanceBroken) {
          // メモリ確保失敗などでインスタンスが壊れた可能性がある。作り直して
          // 1 回だけやり直す（メモリ圧による一時的な失敗はこれで救える）
          discardSlot(slot);
          result = await runOnSlot(slot, jobs[index], onProgress);
          if (result.instanceBroken) discardSlot(slot);
        } else {
          // 累積処理量が閾値を超えたらインスタンスを作り直して wasm ヒープを解放する
          noteSlotUsage(slot, bytes);
        }
        onResult?.(result, index);
      } finally {
        gate.release(bytes);
      }
    }
  };

  try {
    await Promise.all(Array.from({ length: slots }, (_, slot) => worker(slot)));
  } finally {
    batchRunning = false;
    // Emscripten のヒープは縮まないので、バッチ後に primary 以外を解放する
    disposeExtras();
  }
}

/** 正規化パス（中間ファイルを作る）かどうか */
function usesIntermediateFile(options: ProcessingOptions): boolean {
  return (
    options.volume?.type === "normalize_peak" ||
    options.volume?.type === "normalize_rms" ||
    options.volume?.type === "normalize_lufs"
  );
}

/** 単一ファイルを primary で処理する（並列処理は processFiles を使う） */
export function processFile(
  options: ProcessingOptions,
  onProgress?: (info: ProgressInfo) => void,
): Promise<ProcessingResult> {
  return getPrimary().run((ff) => runProcessFile(ff, options, onProgress));
}

async function runProcessFile(
  ff: FFmpeg,
  options: ProcessingOptions,
  onProgress?: (info: ProgressInfo) => void,
): Promise<ProcessingResult> {
  const inputName = "input" + getExtWithDot(options.input_file.name);
  const outputName = options.output_name;
  const albumArtName = options.album_art
    ? getAlbumArtVfsName(options.album_art)
    : null;

  // 正規化パスで中間ファイルを作ったか（作っていない場合の削除失敗を黙殺しないため）
  let usedIntermediate = false;

  // 進捗リスナー（finally で必ず解除する）
  // ffmpeg.wasm の progress は高頻度に発火するため、丸めた % が変化した時だけ通知する
  let lastPercentage = -1;
  const progressHandler = ({
    progress,
  }: {
    progress: number;
    time: number;
  }) => {
    const percentage = Math.min(Math.round(progress * 100), 99);
    if (percentage === lastPercentage) return;
    lastPercentage = percentage;
    onProgress?.({
      file_name: options.input_file.name,
      percentage,
      status: "processing",
    });
  };
  ff.on("progress", progressHandler);

  try {
    // ファイル書き込み
    await ff.writeFile(inputName, await fetchFile(options.input_file));

    // アルバムアート書き込み
    if (options.album_art && albumArtName) {
      await ff.writeFile(albumArtName, await fetchFile(options.album_art));
    }

    const isNormalize =
      options.volume?.type === "normalize_peak" ||
      options.volume?.type === "normalize_rms";
    const isLufsNormalize = options.volume?.type === "normalize_lufs";
    usedIntermediate = isNormalize || isLufsNormalize;

    if (isStreamCopyEligible(options)) {
      // ストリームコピー: 音声データ無変更、メタデータ/アルバムアートのみ
      const args = ["-i", inputName];
      if (albumArtName) {
        args.push("-i", albumArtName, "-map", "0:a", "-map", "1:v");
      }
      args.push("-c", "copy");
      if (albumArtName) {
        const ext = getExtWithDot(outputName).toLowerCase();
        if (ext === ".mp3") args.push("-id3v2_version", "3");
      }
      appendMetadata(args, options);
      args.push("-y", outputName);
      await execChecked(ff, args);
    } else if (isLufsNormalize) {
      // LUFS正規化（loudnorm 2パスモード）:
      // 1. 音量以外のフィルタを適用した中間WAVを生成
      // 2. loudnorm で計測
      // 3. 計測値を使って loudnorm 2パス目を実行（linear mode）
      const tempName = INTERMEDIATE_NAME;
      await execChecked(ff, buildIntermediateArgs(options));

      const vol = options.volume!;
      const targetLufs = vol.type === "normalize_lufs" ? (vol.target_lufs ?? -14) : -14;
      const targetTP = -1;

      const measurement = await detectLufs(ff, tempName, targetLufs, targetTP);

      // loudnorm 2パス目: 計測値を使った線形正規化
      const loudnormFilter = [
        `loudnorm=I=${targetLufs}`,
        `TP=${targetTP}`,
        `measured_I=${measurement.input_i}`,
        `measured_TP=${measurement.input_tp}`,
        `measured_LRA=${measurement.input_lra}`,
        `measured_thresh=${measurement.input_thresh}`,
        `offset=${measurement.target_offset}`,
        `linear=true`,
      ].join(":");

      const finalArgs = ["-i", tempName];
      if (albumArtName) {
        finalArgs.push("-i", albumArtName, "-map", "0:a", "-map", "1:v");
      }
      finalArgs.push("-af", loudnormFilter);
      // loudnorm は出力を 192kHz にアップサンプルするため、明示指定が無ければ元の
      // サンプルレートへ戻す（放置すると 44.1kHz の WAV が 192kHz に化けて肥大する）。
      // フィルタ連結（aresample）ではなく出力オプションで指定する:
      // ffmpeg.wasm 5.1.4 では loudnorm,aresample の連結が
      // "Failed to inject frame into filter network" で失敗するため。
      if (!options.sample_rate && options.input_sample_rate) {
        finalArgs.push("-ar", options.input_sample_rate.toString());
      }
      appendAlbumArtArgs(finalArgs, options, outputName);
      appendOutputEncoding(finalArgs, options, outputName);
      appendMetadata(finalArgs, options);
      finalArgs.push("-y", outputName);
      await execChecked(ff, finalArgs);
    } else if (isNormalize) {
      // 正規化（補正パス付き）:
      // 1. 音量以外のフィルタを適用した中間WAVを生成
      // 2. 中間ファイルのピーク/RMSを計測し音量調整して出力
      // 3. 出力を実測し、ズレがあれば補正して再出力
      const tempName = INTERMEDIATE_NAME;
      await execChecked(ff, buildIntermediateArgs(options));

      const vol = options.volume!;
      const targetDb = (vol.type === "normalize_peak" || vol.type === "normalize_rms")
        ? (vol.target_db ?? -1)
        : -1;
      const measured = await detectVolume(ff, tempName);
      const currentValue =
        vol.type === "normalize_rms" ? measured.rms : measured.peak;
      const adjustment = targetDb - currentValue;

      const buildFinalArgs = (db: number) => {
        const args = ["-i", tempName];
        if (albumArtName) {
          args.push("-i", albumArtName, "-map", "0:a", "-map", "1:v");
        }
        args.push("-af", `volume=${db}dB`);
        appendAlbumArtArgs(args, options, outputName);
        appendOutputEncoding(args, options, outputName);
        appendMetadata(args, options);
        args.push("-y", outputName);
        return args;
      };

      // 初回エンコード
      let appliedDb = Math.round(adjustment * 100) / 100;
      await execChecked(ff, buildFinalArgs(appliedDb));

      // 補正パス（最大2回）: ロッシー形式でズレていたら再エンコード。
      // 可逆出力では volume の適用結果が測定値どおりになるため検証デコードを省く。
      if (!isLosslessOutput(outputName)) {
        for (let pass = 0; pass < 2; pass++) {
          const actual = await detectVolume(ff, outputName);
          const actualValue =
            vol.type === "normalize_rms" ? actual.rms : actual.peak;
          const error = targetDb - actualValue;
          if (Math.abs(error) <= 0.1) break;
          appliedDb = Math.round((appliedDb + error) * 100) / 100;
          await execChecked(ff, buildFinalArgs(appliedDb));
        }
      }
    } else {
      // 通常処理: 1パス
      const args = buildFFmpegArgs(options);
      await execChecked(ff, args);
    }

    // 結果読み込み
    const data = await ff.readFile(outputName);
    const blob = new Blob([data], { type: getMimeType(outputName) });

    // プローブの exec 進捗を対象ファイルの進捗として誤表示しないよう、先に解除する
    ff.off("progress", progressHandler);

    // 出力ファイルのプローブ（クリーンアップ前）。
    // 入力側と同じく、ヘッダは ffmpeg・計測はネイティブデコードで行う。
    const outputHeader = await probeAudioInfo(ff, outputName, blob.size, false);
    let outputInfo = await measureWithNativeDecode(outputHeader, blob);
    if (!outputInfo) {
      // デコードできない形式は ffmpeg で計測し直す（VFS の削除前に行う）
      outputInfo = await probeAudioInfo(ff, outputName, blob.size, true);
    }

    onProgress?.({
      file_name: options.input_file.name,
      percentage: 100,
      status: "completed",
    });

    return {
      input_name: options.input_file.name,
      output_name: outputName,
      blob,
      success: true,
      error: null,
      outputInfo,
    };
  } catch (e) {
    onProgress?.({
      file_name: options.input_file.name,
      percentage: 0,
      status: "error",
    });

    return {
      input_name: options.input_file.name,
      output_name: outputName,
      blob: null,
      success: false,
      error: e instanceof Error ? e.message : String(e),
      outputInfo: null,
      // exec の終了コード起因はファイル固有の失敗。それ以外（terminate、メモリ確保
      // 失敗、FS エラーなど）はインスタンス自体が壊れている可能性がある
      instanceBroken: !isExecFailure(e),
    };
  } finally {
    // 進捗リスナーと VFS 上の一時ファイルは成功/失敗いずれでも必ず片付ける
    ff.off("progress", progressHandler);
    const cleanupTargets = [inputName, outputName, albumArtName];
    if (usedIntermediate) cleanupTargets.push(INTERMEDIATE_NAME);
    for (const name of cleanupTargets) {
      if (!name) continue;
      try {
        await ff.deleteFile(name);
      } catch {}
    }
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  // 同期的に revoke すると Firefox / Safari でダウンロードが取りこぼされる
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// オーディオプレビュー再生（同時に1つだけ再生）
let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let onStopCallback: (() => void) | null = null;

export function playPreview(source: File | Blob, onEnded: () => void) {
  stopPreview();
  const url = URL.createObjectURL(source);
  const audio = new Audio(url);
  currentAudio = audio;
  currentUrl = url;
  onStopCallback = onEnded;
  audio.onended = () => stopPreview();
  audio.play();
}

export function stopPreview() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
  if (onStopCallback) {
    onStopCallback();
    onStopCallback = null;
  }
}

