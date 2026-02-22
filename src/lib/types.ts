export interface FfmpegInfo {
  version: string;
}

export interface AudioFileInfo {
  name: string;
  duration_ms: number;
  format: string;
  bitrate: string | null;
  sample_rate: string | null;
  channels: number | null;
  peak_db: number | null;
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
  input_file: File;
  output_name: string;
  output_format?: AudioFormat;
  volume?: VolumeOption;
  trim?: TrimOption;
  bitrate?: string;
  sample_rate?: number;
  silence_remove?: SilenceRemoveOption;
}

export interface ProgressInfo {
  file_name: string;
  percentage: number;
  status: "processing" | "completed" | "error";
}

export interface ProcessingResult {
  input_name: string;
  output_name: string;
  blob: Blob | null;
  success: boolean;
  error: string | null;
  outputInfo: AudioFileInfo | null;
}

export interface FileEntry {
  id: string;
  file: AudioFileInfo;
  sourceFile: File;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
  resultBlob?: Blob;
  outputName?: string;
  outputInfo?: AudioFileInfo;
}
