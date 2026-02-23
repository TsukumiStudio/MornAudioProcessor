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
    updateFile(id: string, updates: Partial<FileEntry>) {
      files = files.map((f) => (f.id === id ? { ...f, ...updates } : f));
    },
    removeFile(id: string) {
      files = files.filter((f) => f.id !== id);
      if (compareA?.type === "input" && compareA.id === id) compareA = null;
      if (compareB?.type === "input" && compareB.id === id) compareB = null;
    },
    clearInputFiles() {
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
      files = files.map((f) =>
        f.file.name === fileName ? { ...f, progress, status } : f,
      );
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
