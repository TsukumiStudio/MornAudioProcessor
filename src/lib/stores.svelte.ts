import type {
  FileEntry,
  FfmpegInfo,
  AudioFormat,
  VolumeOption,
  TrimOption,
  SilenceRemoveOption,
} from "./types";

let ffmpegInfo = $state<FfmpegInfo | null>(null);
let ffmpegError = $state<string | null>(null);
let files = $state<FileEntry[]>([]);
let outputFormat = $state<AudioFormat | "same">("same");
let volume = $state<VolumeOption | null>(null);
let trim = $state<TrimOption | null>(null);
let bitrate = $state<string>("");
let sampleRate = $state<number | null>(null);
let silenceRemove = $state<SilenceRemoveOption | null>(null);
let isProcessing = $state(false);
let processingDone = $state(false);
let isDragging = $state(false);

export function getAppState() {
  return {
    get ffmpegInfo() {
      return ffmpegInfo;
    },
    set ffmpegInfo(v) {
      ffmpegInfo = v;
    },
    get ffmpegError() {
      return ffmpegError;
    },
    set ffmpegError(v) {
      ffmpegError = v;
    },
    get files() {
      return files;
    },
    set files(v) {
      files = v;
    },
    get outputFormat() {
      return outputFormat;
    },
    set outputFormat(v) {
      outputFormat = v;
    },
    get volume() {
      return volume;
    },
    set volume(v) {
      volume = v;
    },
    get trim() {
      return trim;
    },
    set trim(v) {
      trim = v;
    },
    get bitrate() {
      return bitrate;
    },
    set bitrate(v) {
      bitrate = v;
    },
    get sampleRate() {
      return sampleRate;
    },
    set sampleRate(v) {
      sampleRate = v;
    },
    get silenceRemove() {
      return silenceRemove;
    },
    set silenceRemove(v) {
      silenceRemove = v;
    },
    get isProcessing() {
      return isProcessing;
    },
    set isProcessing(v) {
      isProcessing = v;
    },
    get processingDone() {
      return processingDone;
    },
    set processingDone(v) {
      processingDone = v;
    },
    get isDragging() {
      return isDragging;
    },
    set isDragging(v) {
      isDragging = v;
    },
    get totalFiles() {
      return files.length;
    },
    get completedFiles() {
      return files.filter((f) => f.status === "completed").length;
    },
    get overallProgress() {
      return files.length > 0
        ? files.reduce((sum, f) => sum + f.progress, 0) / files.length
        : 0;
    },

    addFile(entry: FileEntry) {
      files = [...files, entry];
    },
    removeFile(id: string) {
      files = files.filter((f) => f.id !== id);
    },
    clearFiles() {
      files = [];
      processingDone = false;
    },
    updateFileProgress(
      fileName: string,
      progress: number,
      status: FileEntry["status"],
    ) {
      files = files.map((f) =>
        f.file.name === fileName ? { ...f, progress, status } : f,
      );
    },
    updateFileError(fileName: string, error: string) {
      files = files.map((f) =>
        f.file.name === fileName
          ? { ...f, status: "error" as const, error }
          : f,
      );
    },
    setFileResult(id: string, blob: Blob, outputName: string) {
      files = files.map((f) =>
        f.id === id ? { ...f, resultBlob: blob, outputName } : f,
      );
    },
  };
}
