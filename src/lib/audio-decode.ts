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

export interface Loudness {
  peakDb: number;
  rmsDb: number;
  lufs: number | null;
}

/**
 * 計測用の Worker。使い回すが、失敗したら破棄して次回作り直す。
 * Worker が使えない環境ではメインスレッドで計測する（値は同じ）。
 */
let worker: Worker | null = null;
let workerBroken = false;

function getWorker(): Worker | null {
  if (workerBroken) return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./loudness-worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onerror = () => {
      workerBroken = true;
      worker?.terminate();
      worker = null;
    };
    return worker;
  } catch {
    workerBroken = true;
    return null;
  }
}

/** 要求と応答を対応づける連番 */
let nextRequestId = 1;

/**
 * PCM から peak/RMS/LUFS を求める。
 *
 * 計測はメインスレッドだと 5 分ステレオで約 1.5 秒 UI を塞ぐため Worker に渡す。
 * PCM は転送（ゼロコピー）するので、呼び出し後に channels の中身は使えない。
 *
 * 解析は複数ファイルが並列に走るため、Worker には同時に複数の要求が飛ぶ。
 * message イベントは登録された全リスナに配られるので、要求ごとに id を振って
 * 自分の応答だけを拾う。これが無いと最初に返った 1 件の計測値が、待機中の
 * 全ファイルの結果として使われてしまう。
 */
export async function measureLoudness(
  decoded: DecodedAudio,
): Promise<Loudness> {
  const w = getWorker();
  if (!w) {
    const { analyzeLufs, analyzePeakRms } = await import("./loudness");
    const { peakDb, rmsDb } = analyzePeakRms(decoded.channels);
    return { peakDb, rmsDb, lufs: analyzeLufs(decoded.channels, decoded.sampleRate) };
  }

  const id = nextRequestId++;

  return new Promise<Loudness>((resolve, reject) => {
    const cleanup = () => {
      w.removeEventListener("message", onMessage);
      w.removeEventListener("error", onError);
    };
    const onMessage = (event: MessageEvent<Loudness & { id: number }>) => {
      // 他のファイルの応答は無視する（そのファイルのリスナが受け取る）
      if (event.data?.id !== id) return;
      cleanup();
      const { peakDb, rmsDb, lufs } = event.data;
      resolve({ peakDb, rmsDb, lufs });
    };
    const onError = (event: ErrorEvent) => {
      cleanup();
      reject(event.error ?? new Error("計測 Worker が失敗しました"));
    };
    w.addEventListener("message", onMessage);
    w.addEventListener("error", onError);
    w.postMessage(
      { id, channels: decoded.channels, sampleRate: decoded.sampleRate },
      // PCM を転送してコピーを避ける（デコード結果はこの後使わない）
      decoded.channels.map((c) => c.buffer),
    );
  });
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
