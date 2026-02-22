export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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

export function getFileExtension(path: string): string {
  const lastDot = path.lastIndexOf(".");
  return lastDot >= 0 ? path.substring(lastDot + 1).toLowerCase() : "";
}

export function getFileName(path: string): string {
  const sep = path.includes("\\") ? "\\" : "/";
  const parts = path.split(sep);
  return parts[parts.length - 1] || path;
}

export function getDirectory(path: string): string {
  const sep = path.includes("\\") ? "\\" : "/";
  const parts = path.split(sep);
  parts.pop();
  return parts.join(sep);
}

export function replaceExtension(path: string, newExt: string): string {
  const lastDot = path.lastIndexOf(".");
  if (lastDot >= 0) {
    return path.substring(0, lastDot + 1) + newExt;
  }
  return path + "." + newExt;
}
