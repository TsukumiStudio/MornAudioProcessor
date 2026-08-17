import type {
  FileEntry,
  OutputFileEntry,
  FfmpegInfo,
  AudioFileInfo,
  AudioFormat,
  VolumeOption,
  TrimOption,
  SilenceRemoveOption,
  NoiseReduceOption,
  FrequencyFilterOption,
  DynamicsFilterOption,
  EffectFilterOption,
  ChannelFilterOption,
  FrequencyFilterExtOption,
  DynamicsFilterExtOption,
  EffectFilterExtOption,
  RepairFilterOption,
  StereoFilterOption,
  CompareSelection,
  MetadataSettings,
} from "./types";

let ffmpegInfo = $state<FfmpegInfo | null>(null);
let ffmpegError = $state<string | null>(null);
let files = $state<FileEntry[]>([]);
let outputFiles = $state<OutputFileEntry[]>([]);
let outputFormat = $state<AudioFormat | "same">("same");
let volume = $state<VolumeOption | null>(null);
let trim = $state<TrimOption | null>(null);
let bitrate = $state<string>("");
let sampleRate = $state<number | null>(null);
let silenceRemove = $state<SilenceRemoveOption | null>(null);
let noiseReduce = $state<NoiseReduceOption | null>(null);
let frequencyFilter = $state<FrequencyFilterOption | null>(null);
let dynamicsFilter = $state<DynamicsFilterOption | null>(null);
let effectFilter = $state<EffectFilterOption | null>(null);
let channelFilter = $state<ChannelFilterOption | null>(null);
let frequencyFilterExt = $state<FrequencyFilterExtOption | null>(null);
let dynamicsFilterExt = $state<DynamicsFilterExtOption | null>(null);
let effectFilterExt = $state<EffectFilterExtOption | null>(null);
let repairFilter = $state<RepairFilterOption | null>(null);
let stereoFilter = $state<StereoFilterOption | null>(null);
let bitDepth = $state("");
let oggQuality = $state(1.0);
let metadataSettings = $state<MetadataSettings | null>(null);
let albumArt = $state<File | null>(null);
let albumArtMap = $state<Record<string, File>>({});
let compareA = $state<CompareSelection | null>(null);
let compareB = $state<CompareSelection | null>(null);
let isProcessing = $state(false);
let isDragging = $state(false);
let settingsResetCounter = $state(0);

/**
 * ファイルエントリが持つアルバムアートの objectURL を解放する。
 * blob URL はページ生存中 Blob をピン留めするため、破棄・差し替え時に必ず呼ぶ。
 * nextUrl に同じ URL が引き継がれる場合は解放しない。
 */
function revokeAlbumArt(entry: FileEntry, nextUrl?: string | null) {
  const url = entry.file?.albumArtUrl;
  if (url && url !== nextUrl) URL.revokeObjectURL(url);
}

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
    get outputFiles() {
      return outputFiles;
    },
    set outputFiles(v) {
      outputFiles = v;
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
    get noiseReduce() {
      return noiseReduce;
    },
    set noiseReduce(v) {
      noiseReduce = v;
    },
    get frequencyFilter() {
      return frequencyFilter;
    },
    set frequencyFilter(v: FrequencyFilterOption | null) {
      frequencyFilter = v;
    },
    get dynamicsFilter() {
      return dynamicsFilter;
    },
    set dynamicsFilter(v: DynamicsFilterOption | null) {
      dynamicsFilter = v;
    },
    get effectFilter() {
      return effectFilter;
    },
    set effectFilter(v: EffectFilterOption | null) {
      effectFilter = v;
    },
    get channelFilter() {
      return channelFilter;
    },
    set channelFilter(v: ChannelFilterOption | null) {
      channelFilter = v;
    },
    get frequencyFilterExt() {
      return frequencyFilterExt;
    },
    set frequencyFilterExt(v: FrequencyFilterExtOption | null) {
      frequencyFilterExt = v;
    },
    get dynamicsFilterExt() {
      return dynamicsFilterExt;
    },
    set dynamicsFilterExt(v: DynamicsFilterExtOption | null) {
      dynamicsFilterExt = v;
    },
    get effectFilterExt() {
      return effectFilterExt;
    },
    set effectFilterExt(v: EffectFilterExtOption | null) {
      effectFilterExt = v;
    },
    get repairFilter() {
      return repairFilter;
    },
    set repairFilter(v: RepairFilterOption | null) {
      repairFilter = v;
    },
    get stereoFilter() {
      return stereoFilter;
    },
    set stereoFilter(v: StereoFilterOption | null) {
      stereoFilter = v;
    },
    get bitDepth() {
      return bitDepth;
    },
    set bitDepth(v: string) {
      bitDepth = v;
    },
    get oggQuality() {
      return oggQuality;
    },
    set oggQuality(v: number) {
      oggQuality = v;
    },
    get metadataSettings() {
      return metadataSettings;
    },
    set metadataSettings(v: MetadataSettings | null) {
      metadataSettings = v;
    },
    get albumArt() {
      return albumArt;
    },
    set albumArt(v: File | null) {
      albumArt = v;
    },
    get albumArtMap() {
      return albumArtMap;
    },
    set albumArtMap(v: Record<string, File>) {
      albumArtMap = v;
    },
    get compareA() {
      return compareA;
    },
    set compareA(v: CompareSelection | null) {
      compareA = v;
    },
    get compareB() {
      return compareB;
    },
    set compareB(v: CompareSelection | null) {
      compareB = v;
    },
    toggleCompareA(sel: CompareSelection) {
      if (compareA && compareA.type === sel.type && compareA.id === sel.id) {
        compareA = null;
      } else {
        if (compareB && compareB.type === sel.type && compareB.id === sel.id) {
          compareB = null;
        }
        compareA = sel;
      }
    },
    toggleCompareB(sel: CompareSelection) {
      if (compareB && compareB.type === sel.type && compareB.id === sel.id) {
        compareB = null;
      } else {
        if (compareA && compareA.type === sel.type && compareA.id === sel.id) {
          compareA = null;
        }
        compareB = sel;
      }
    },
    get isProcessing() {
      return isProcessing;
    },
    set isProcessing(v) {
      isProcessing = v;
    },
    get isDragging() {
      return isDragging;
    },
    set isDragging(v) {
      isDragging = v;
    },
    get settingsResetCounter() {
      return settingsResetCounter;
    },
    resetSettings() {
      outputFormat = "same";
      volume = null;
      trim = null;
      bitrate = "";
      sampleRate = null;
      silenceRemove = null;
      noiseReduce = null;
      frequencyFilter = null;
      dynamicsFilter = null;
      effectFilter = null;
      channelFilter = null;
      frequencyFilterExt = null;
      dynamicsFilterExt = null;
      effectFilterExt = null;
      repairFilter = null;
      stereoFilter = null;
      bitDepth = "";
      oggQuality = 1.0;
      metadataSettings = null;
      albumArt = null;
      albumArtMap = {};
      settingsResetCounter++;
    },
    addFile(entry: FileEntry) {
      files = [...files, entry];
    },
    /** 対象エントリが存在して更新できた場合に true を返す */
    updateFile(id: string, updates: Partial<FileEntry>): boolean {
      const entry = files.find((f) => f.id === id);
      if (!entry) return false;
      // ファイル情報を差し替える場合、旧アルバムアートの objectURL を解放する
      if (updates.file && updates.file !== entry.file) {
        revokeAlbumArt(entry, updates.file.albumArtUrl);
      }
      // 配列を作り直すと each 全体の差分計算が走るため、その場更新にする
      Object.assign(entry, updates);
      return true;
    },
    /** 指定エントリの現在の状態（存在しなければ null） */
    getFileStatus(id: string): FileEntry["status"] | null {
      return files.find((f) => f.id === id)?.status ?? null;
    },
    removeFile(id: string) {
      const entry = files.find((f) => f.id === id);
      if (entry) revokeAlbumArt(entry);
      files = files.filter((f) => f.id !== id);
      if (compareA?.type === "input" && compareA.id === id) compareA = null;
      if (compareB?.type === "input" && compareB.id === id) compareB = null;
    },
    clearInputFiles() {
      for (const entry of files) revokeAlbumArt(entry);
      files = [];
      if (compareA?.type === "input") compareA = null;
      if (compareB?.type === "input") compareB = null;
    },
    clearOutputFiles() {
      outputFiles = [];
      if (compareA?.type === "output") compareA = null;
      if (compareB?.type === "output") compareB = null;
    },
    updateFileProgress(
      fileName: string,
      progress: number,
      status: FileEntry["status"],
    ) {
      // 進捗は高頻度に更新されるため、配列を作り直さずその場更新にする
      const entry = files.find((f) => f.file.name === fileName);
      if (!entry) return;
      entry.progress = progress;
      entry.status = status;
    },
    addOutputResult(
      outputName: string,
      blob: Blob,
      outputInfo: AudioFileInfo | null,
    ) {
      const existing = outputFiles.findIndex((f) => f.outputName === outputName);
      const entry: OutputFileEntry = {
        id: existing >= 0 ? outputFiles[existing].id : crypto.randomUUID(),
        outputName,
        resultBlob: blob,
        outputInfo,
        status: "completed",
      };
      if (existing >= 0) {
        outputFiles = outputFiles.map((f, i) => (i === existing ? entry : f));
      } else {
        outputFiles = [...outputFiles, entry];
      }
    },
    addOutputError(outputName: string, error: string) {
      const existing = outputFiles.findIndex((f) => f.outputName === outputName);
      const entry: OutputFileEntry = {
        id: existing >= 0 ? outputFiles[existing].id : crypto.randomUUID(),
        outputName,
        status: "error",
        error,
      };
      if (existing >= 0) {
        outputFiles = outputFiles.map((f, i) => (i === existing ? entry : f));
      } else {
        outputFiles = [...outputFiles, entry];
      }
    },
  };
}
