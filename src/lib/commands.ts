import { invoke, Channel } from "@tauri-apps/api/core";
import type {
  FfmpegInfo,
  AudioFileInfo,
  ProcessingOptions,
  ProcessingResult,
  ProgressInfo,
} from "./types";

export async function checkFfmpeg(): Promise<FfmpegInfo> {
  return invoke<FfmpegInfo>("check_ffmpeg");
}

export async function getAudioInfo(filePath: string): Promise<AudioFileInfo> {
  return invoke<AudioFileInfo>("get_audio_info", { filePath });
}

export async function processFiles(
  files: ProcessingOptions[],
  onProgress: (progress: ProgressInfo) => void,
): Promise<ProcessingResult[]> {
  const channel = new Channel<ProgressInfo>();
  channel.onmessage = onProgress;

  return invoke<ProcessingResult[]>("process_files", {
    files,
    onProgress: channel,
  });
}
