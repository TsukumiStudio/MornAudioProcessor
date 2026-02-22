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

export async function getAudioInfo(file: File): Promise<AudioFileInfo> {
  const ext = getFileExtension(file.name).toLowerCase();
  const format = ext || "unknown";

  // Web Audio API で duration と sampleRate を取得
  const arrayBuffer = await file.arrayBuffer();
  const audioCtx = new AudioContext();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const durationMs = Math.round(audioBuffer.duration * 1000);
    const sampleRate = audioBuffer.sampleRate.toString();
    const channels = audioBuffer.numberOfChannels;

    // ビットレート推定: ファイルサイズ / 再生時間
    const bitrate =
      audioBuffer.duration > 0
        ? Math.round((file.size * 8) / audioBuffer.duration / 1000) + "kbps"
        : null;

    return {
      name: file.name,
      duration_ms: durationMs,
      format,
      bitrate,
      sample_rate: sampleRate,
      channels,
    };
  } finally {
    await audioCtx.close();
  }
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
    if (options.volume.type === "normalize") {
      const lufs = options.volume.target_lufs ?? -16;
      filters.push(`loudnorm=I=${lufs}`);
    } else {
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

    // ffmpeg 実行
    const args = buildFFmpegArgs(options);
    await ff.exec(args);

    // 結果読み込み
    const data = await ff.readFile(outputName);
    const blob = new Blob([data], { type: getMimeType(outputName) });

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

