/**
 * 音量計測を Worker で行う。
 *
 * 計測はメインスレッドで実行すると 5 分ステレオ 1 ファイルで約 1.5 秒 UI を塞ぐ
 * （実測: peak/RMS 305ms + K 特性フィルタ 568ms + ブロック集計 596ms）。
 * デコード自体は OfflineAudioContext が Worker に無いためメインスレッドで行い、
 * 得られた PCM をここへ転送して計測する。
 */
import { analyzeLufs, analyzePeakRms } from "./loudness";

export interface LoudnessRequest {
  /** 要求と応答の対応づけ。Worker を共有するので必須 */
  id: number;
  channels: Float32Array[];
  sampleRate: number;
}

export interface LoudnessResponse {
  id: number;
  peakDb: number;
  rmsDb: number;
  lufs: number | null;
}

self.onmessage = (event: MessageEvent<LoudnessRequest>) => {
  const { id, channels, sampleRate } = event.data;
  const { peakDb, rmsDb } = analyzePeakRms(channels);
  const lufs = analyzeLufs(channels, sampleRate);
  const response: LoudnessResponse = { id, peakDb, rmsDb, lufs };
  self.postMessage(response);
};
