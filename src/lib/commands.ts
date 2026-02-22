import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { base } from "$app/paths";
import type {
  FfmpegInfo,
  AudioFileInfo,
  ProcessingOptions,
  ProcessingResult,
  ProgressInfo,
} from "./types";
import { getFileExtension } from "./utils";

let ffmpeg: FFmpeg | null = null;

export async function initFFmpeg(
  onProgress?: (message: string) => void,
): Promise<FfmpegInfo> {
  ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => {
    console.log("[ffmpeg]", message);
  });

  onProgress?.("Worker を起動中...");

  const loadPromise = ffmpeg.load({
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
    classWorkerURL: `${base}/ffmpeg-worker/worker.js`,
  });

  onProgress?.("FFmpeg コアを読み込み中...");

  // タイムアウト付きで待機（30秒）
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("FFmpeg の読み込みがタイムアウトしました（30秒）")),
      30000,
    ),
  );

  await Promise.race([loadPromise, timeout]);

  onProgress?.("初期化完了");
  return { version: "ffmpeg.wasm" };
}

function getFFmpeg(): FFmpeg {
  if (!ffmpeg) throw new Error("FFmpeg not initialized");
  return ffmpeg;
}

export async function resetFFmpeg(): Promise<void> {
  if (ffmpeg) {
    ffmpeg.terminate();
  }
  ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => {
    console.log("[ffmpeg]", message);
  });
  await ffmpeg.load({
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
    classWorkerURL: `${base}/ffmpeg-worker/worker.js`,
  });
}

export async function getAudioInfo(file: File): Promise<AudioFileInfo> {
  const ff = getFFmpeg();
  const tempName = "probe_input" + getExtWithDot(file.name);

  await ff.writeFile(tempName, await fetchFile(file));
  const info = await probeAudioInfo(ff, tempName, file.size);
  await ff.deleteFile(tempName);

  return { ...info, name: file.name };
}

function buildFFmpegArgs(options: ProcessingOptions): string[] {
  const inputName = "input" + getExtWithDot(options.input_file.name);
  const outputName = options.output_name;
  const args: string[] = ["-i", inputName];

  // トリミング
  if (options.trim) {
    if (options.trim.start) args.push("-ss", options.trim.start);
    if (options.trim.end) args.push("-to", options.trim.end);
  }

  // オーディオフィルタ
  const filters: string[] = [];

  if (options.silence_remove) {
    const sr = options.silence_remove;
    const parts: string[] = [];
    if (sr.remove_start) {
      parts.push(
        `start_periods=1:start_silence=0:start_threshold=${sr.threshold_db}dB`,
      );
    }
    if (sr.remove_end) {
      parts.push(
        `stop_periods=-1:stop_silence=0:stop_threshold=${sr.threshold_db}dB`,
      );
    }
    if (parts.length > 0) {
      filters.push(`silenceremove=${parts.join(":")}`);
    }
  }

  if (options.volume) {
    // normalize の場合は processFile 側で2パス処理し、adjust に変換済み
    if (options.volume.type === "adjust") {
      filters.push(`volume=${options.volume.db}dB`);
    }
  }

  if (filters.length > 0) {
    args.push("-af", filters.join(","));
  }

  // ビットレート
  if (options.bitrate) {
    args.push("-b:a", options.bitrate);
  }

  // サンプルレート
  if (options.sample_rate) {
    args.push("-ar", options.sample_rate.toString());
  }

  args.push("-y", outputName);
  return args;
}

function getExtWithDot(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.substring(dot) : "";
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
  await ff.exec(["-i", inputName, "-af", "volumedetect", "-f", "null", "-"]);
  ff.off("log", logHandler);
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
  await ff.exec([
    "-i", inputName,
    "-af", `loudnorm=I=${targetI}:TP=${targetTP}:print_format=json`,
    "-f", "null", "-",
  ]);
  ff.off("log", logHandler);
  return { input_i, input_tp, input_lra, input_thresh, target_offset };
}

async function probeAudioInfo(
  ff: FFmpeg,
  fileName: string,
  blobSize: number,
): Promise<AudioFileInfo> {
  let durationMs = 0;
  let sampleRate: string | null = null;
  let channels: number | null = null;
  let bitrate: string | null = null;
  let peakDb = 0;
  let rmsDb = 0;

  const logHandler = ({ message }: { message: string }) => {
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
    // Stream: 44100 Hz, stereo/mono
    const streamMatch = message.match(
      /Audio:.*?,\s*(\d+)\s*Hz,\s*(\w+)/,
    );
    if (streamMatch) {
      sampleRate = streamMatch[1];
      channels = streamMatch[2] === "mono" ? 1 : 2;
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
  };

  ff.on("log", logHandler);
  await ff.exec(["-i", fileName, "-af", "volumedetect", "-f", "null", "-"]);
  ff.off("log", logHandler);

  // LUFS計測（loudnormフィルタで Integrated Loudness を取得）
  let lufsValue: number | null = null;
  const lufsHandler = ({ message }: { message: string }) => {
    const iMatch = message.match(/"input_i"\s*:\s*"([-\d.]+)"/);
    if (iMatch) lufsValue = parseFloat(iMatch[1]);
  };
  ff.on("log", lufsHandler);
  try {
    await ff.exec([
      "-i", fileName,
      "-af", "loudnorm=print_format=json",
      "-f", "null", "-",
    ]);
  } catch {
    // loudnormフィルタが利用できない場合はスキップ
  }
  ff.off("log", lufsHandler);

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
    peak_db: Math.round(peakDb * 10) / 10,
    rms_db: Math.round(rmsDb * 10) / 10,
    lufs: lufsValue !== null ? Math.round(lufsValue * 10) / 10 : null,
  };
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
    default:
      return "audio/mpeg";
  }
}

export async function processFile(
  options: ProcessingOptions,
  onProgress?: (info: ProgressInfo) => void,
): Promise<ProcessingResult> {
  const ff = getFFmpeg();
  const inputName = "input" + getExtWithDot(options.input_file.name);
  const outputName = options.output_name;

  try {
    // 進捗リスナー
    const progressHandler = ({
      progress,
    }: {
      progress: number;
      time: number;
    }) => {
      onProgress?.({
        file_name: options.input_file.name,
        percentage: Math.min(Math.round(progress * 100), 99),
        status: "processing",
      });
    };
    ff.on("progress", progressHandler);

    // ファイル書き込み
    await ff.writeFile(inputName, await fetchFile(options.input_file));

    const isNormalize =
      options.volume?.type === "normalize_peak" ||
      options.volume?.type === "normalize_rms";
    const isLufsNormalize = options.volume?.type === "normalize_lufs";

    if (isLufsNormalize) {
      // LUFS正規化（loudnorm 2パスモード）:
      // 1. 音量以外のフィルタを適用した中間WAVを生成
      // 2. loudnorm で計測
      // 3. 計測値を使って loudnorm 2パス目を実行（linear mode）
      const tempName = "temp_intermediate.wav";
      const intermediateOptions: ProcessingOptions = {
        ...options,
        output_name: tempName,
        volume: undefined,
      };
      const intermediateArgs = buildFFmpegArgs(intermediateOptions);
      await ff.exec(intermediateArgs);

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

      const finalArgs = ["-i", tempName, "-af", loudnormFilter];
      if (options.bitrate) finalArgs.push("-b:a", options.bitrate);
      if (options.sample_rate) finalArgs.push("-ar", options.sample_rate.toString());
      finalArgs.push("-y", outputName);
      await ff.exec(finalArgs);

      await ff.deleteFile(tempName);
    } else if (isNormalize) {
      // 正規化（補正パス付き）:
      // 1. 音量以外のフィルタを適用した中間WAVを生成
      // 2. 中間ファイルのピーク/RMSを計測し音量調整して出力
      // 3. 出力を実測し、ズレがあれば補正して再出力
      const tempName = "temp_intermediate.wav";
      const intermediateOptions: ProcessingOptions = {
        ...options,
        output_name: tempName,
        volume: undefined,
      };
      const intermediateArgs = buildFFmpegArgs(intermediateOptions);
      await ff.exec(intermediateArgs);

      const vol = options.volume!;
      const targetDb = (vol.type === "normalize_peak" || vol.type === "normalize_rms")
        ? (vol.target_db ?? -1)
        : -1;
      const measured = await detectVolume(ff, tempName);
      const currentValue =
        vol.type === "normalize_rms" ? measured.rms : measured.peak;
      const adjustment = targetDb - currentValue;

      const buildFinalArgs = (db: number) => {
        const args = ["-i", tempName, "-af", `volume=${db}dB`];
        if (options.bitrate) args.push("-b:a", options.bitrate);
        if (options.sample_rate) args.push("-ar", options.sample_rate.toString());
        args.push("-y", outputName);
        return args;
      };

      // 初回エンコード
      let appliedDb = Math.round(adjustment * 100) / 100;
      await ff.exec(buildFinalArgs(appliedDb));

      // 補正パス（最大2回）: ロッシー形式でズレていたら再エンコード
      for (let pass = 0; pass < 2; pass++) {
        const actual = await detectVolume(ff, outputName);
        const actualValue =
          vol.type === "normalize_rms" ? actual.rms : actual.peak;
        const error = targetDb - actualValue;
        if (Math.abs(error) <= 0.1) break;
        appliedDb = Math.round((appliedDb + error) * 100) / 100;
        await ff.exec(buildFinalArgs(appliedDb));
      }

      await ff.deleteFile(tempName);
    } else {
      // 通常処理: 1パス
      const args = buildFFmpegArgs(options);
      await ff.exec(args);
    }

    // 結果読み込み
    const data = await ff.readFile(outputName);
    const blob = new Blob([data], { type: getMimeType(outputName) });

    // 出力ファイルのプローブ（クリーンアップ前）
    const outputInfo = await probeAudioInfo(ff, outputName, blob.size);

    ff.off("progress", progressHandler);

    onProgress?.({
      file_name: options.input_file.name,
      percentage: 100,
      status: "completed",
    });

    // クリーンアップ
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);

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

    // クリーンアップ（エラー時）
    try {
      await ff.deleteFile(inputName);
    } catch {}
    try {
      await ff.deleteFile(outputName);
    } catch {}

    return {
      input_name: options.input_file.name,
      output_name: outputName,
      blob: null,
      success: false,
      error: e instanceof Error ? e.message : String(e),
      outputInfo: null,
    };
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
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

