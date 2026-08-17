/**
 * ブラウザのネイティブデコードで PCM を取り出す。
 *
 * ffmpeg.wasm で全長デコードするより桁違いに速い（ネイティブ ffmpeg で比較しても
 * 3 分ステレオの計測が 4195ms → 38ms。wasm ならさらに差が開く）。
 * 計測そのものは src/lib/loudness.ts が担当する。
 */

/** decodeAudioData 用のコンテキスト。サンプルレートごとに使い回す */
const contexts = new Map<number, OfflineAudioContext>();

/**
 * 元のサンプルレートのままデコードするための OfflineAudioContext を返す。
 * AudioContext を使うと出力デバイスのレートへリサンプルされ、peak が僅かに動く。
 */
function contextFor(sampleRate: number): OfflineAudioContext {
  const existing = contexts.get(sampleRate);
  if (existing) return existing;
  // length は decodeAudioData には影響しないので最小で作る
  const created = new OfflineAudioContext(1, 1, sampleRate);
  contexts.set(sampleRate, created);
  return created;
}

export interface DecodedAudio {
  channels: Float32Array[];
  sampleRate: number;
  durationMs: number;
}

/**
 * ファイルをデコードしてチャンネルごとの PCM を返す。
 * デコードできない場合（対応していないコーデックなど）は null を返す。
 *
 * sampleRateHint にはヘッダから読み取ったサンプルレートを渡す。渡すとリサンプルを
 * 避けられる。範囲外や未指定のときはブラウザ既定のコンテキストにフォールバックする。
 */
export async function decodeAudioFile(
  file: Blob,
  sampleRateHint?: number | null,
): Promise<DecodedAudio | null> {
  if (typeof OfflineAudioContext === "undefined") return null;

  let context: OfflineAudioContext;
  try {
    // OfflineAudioContext が受け付けるのは概ね 8000〜96000。範囲外は既定値で作る
    const rate =
      sampleRateHint && sampleRateHint >= 8000 && sampleRateHint <= 96000
        ? sampleRateHint
        : 48000;
    context = contextFor(rate);
  } catch {
    return null;
  }

  try {
    const buffer = await file.arrayBuffer();
    const decoded = await context.decodeAudioData(buffer);
    const channels: Float32Array[] = [];
    for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
      channels.push(decoded.getChannelData(ch));
    }
    return {
      channels,
      sampleRate: decoded.sampleRate,
      durationMs: Math.round(decoded.duration * 1000),
    };
  } catch {
    // 非対応コーデック（Safari の ogg など）や壊れたファイル
    return null;
  }
}
