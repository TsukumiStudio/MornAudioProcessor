export function formatDuration(ms: number, decimals: number = 0): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  if (decimals > 0) {
    return `${minutes}:${seconds.toFixed(decimals).padStart(decimals + 3, "0")}`;
  }
  return `${minutes}:${Math.floor(seconds).toString().padStart(2, "0")}`;
}

export function formatSampleRate(sampleRate: string | null): string {
  if (!sampleRate) return "-";
  const hz = parseInt(sampleRate);
  if (hz >= 1000) {
    return `${(hz / 1000).toFixed(1).replace(/\.0$/, "")}kHz`;
  }
  return `${hz}Hz`;
}

export function formatBitrate(bitrate: string | null): string {
  if (!bitrate) return "-";
  return bitrate;
}

export function formatPeakDb(peakDb: number | null): string {
  if (peakDb === null || !isFinite(peakDb)) return "-∞ dB";
  return `${peakDb > 0 ? "+" : ""}${peakDb.toFixed(1)} dB`;
}

export function formatLufs(lufs: number | null): string {
  if (lufs === null || !isFinite(lufs)) return "---";
  return `${lufs.toFixed(1)} LUFS`;
}

export function getFileExtension(path: string): string {
  const lastDot = path.lastIndexOf(".");
  return lastDot >= 0 ? path.substring(lastDot + 1).toLowerCase() : "";
}

export function replaceExtension(path: string, newExt: string): string {
  const lastDot = path.lastIndexOf(".");
  if (lastDot >= 0) {
    return path.substring(0, lastDot + 1) + newExt;
  }
  return path + "." + newExt;
}
