export interface FfmpegInfo {
  ffmpeg_path: string;
  ffprobe_path: string;
  version: string;
}

export interface AudioFileInfo {
  path: string;
  duration_ms: number;
  format: string;
  bitrate: string | null;
  sample_rate: string | null;
  channels: number | null;
}

export type AudioFormat = "mp3" | "wav" | "ogg";

export type VolumeOption =
  | { type: "normalize"; target_lufs?: number }
  | { type: "adjust"; db: number };

export interface TrimOption {
  start?: string;
  end?: string;
}

export interface SilenceRemoveOption {
  remove_start: boolean;
  remove_end: boolean;
  threshold_db: number;
}

export interface ProcessingOptions {
  input_path: string;
  output_path: string;
  output_format?: AudioFormat;
  volume?: VolumeOption;
  trim?: TrimOption;
  bitrate?: string;
  sample_rate?: number;
  silence_remove?: SilenceRemoveOption;
}

export interface ProgressInfo {
  file_name: string;
  current_time_ms: number;
  total_duration_ms: number;
  percentage: number;
  status: "processing" | "completed" | "error";
}

export interface ProcessingResult {
  input_path: string;
  output_path: string;
  success: boolean;
  error: string | null;
}

export interface FileEntry {
  id: string;
  file: AudioFileInfo;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
}
