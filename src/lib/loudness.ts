/**
 * 音量計測（純粋関数）。
 *
 * ffmpeg でファイル全体をデコードして計測する代わりに、ブラウザのネイティブデコード
 * （decodeAudioData）で得た PCM から計測するために用意した。ブラウザ API に触らないので
 * Node 上のテストで ffmpeg の実測値と突き合わせられる。
 *
 * 定義は ffmpeg に合わせている:
 * - peak = 全サンプルの絶対値の最大（volumedetect の max_volume）
 * - rms  = 全チャンネル・全サンプルの二乗平均（volumedetect の mean_volume）
 * - lufs = ITU-R BS.1770-4 の Integrated Loudness（loudnorm の input_i）
 */

/** 無音時に返す下限値。ffmpeg の volumedetect も -91.0 dB 付近で打ち止まる */
const SILENCE_DB = -91;

function toDb(amplitude: number): number {
  if (amplitude <= 0) return SILENCE_DB;
  return Math.max(20 * Math.log10(amplitude), SILENCE_DB);
}

export interface PeakRms {
  peakDb: number;
  rmsDb: number;
}

/** volumedetect と同じ定義で peak と RMS を求める */
export function analyzePeakRms(channels: Float32Array[]): PeakRms {
  let peak = 0;
  let sumSquares = 0;
  let count = 0;

  for (const data of channels) {
    for (let i = 0; i < data.length; i++) {
      const v = data[i];
      const abs = v < 0 ? -v : v;
      if (abs > peak) peak = abs;
      sumSquares += v * v;
    }
    count += data.length;
  }

  if (count === 0) return { peakDb: SILENCE_DB, rmsDb: SILENCE_DB };
  return { peakDb: toDb(peak), rmsDb: toDb(Math.sqrt(sumSquares / count)) };
}

/** 2 次 IIR（Direct Form I）。BS.1770 の K 特性フィルタに使う */
interface Biquad {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

/**
 * BS.1770-4 の K 特性フィルタ係数。
 * 規格は 48kHz の係数を示しているため、他のレートでは同じ設計式から作り直す。
 * （48kHz 固定の係数を流用すると 44.1kHz で 0.1 LU 程度ずれる）
 */
function kWeightingFilters(sampleRate: number): [Biquad, Biquad] {
  // 第 1 段: 高域を +4dB 持ち上げるシェルビング
  const f0 = 1681.974450955533;
  const G = 3.999843853973347;
  const Q = 0.7071752369554196;

  const K = Math.tan((Math.PI * f0) / sampleRate);
  const Vh = Math.pow(10, G / 20);
  const Vb = Math.pow(Vh, 0.4996667741545416);
  const a0 = 1 + K / Q + K * K;

  const shelf: Biquad = {
    b0: (Vh + (Vb * K) / Q + K * K) / a0,
    b1: (2 * (K * K - Vh)) / a0,
    b2: (Vh - (Vb * K) / Q + K * K) / a0,
    a1: (2 * (K * K - 1)) / a0,
    a2: (1 - K / Q + K * K) / a0,
  };

  // 第 2 段: 低域を落とすハイパス
  const f0h = 38.13547087602444;
  const Qh = 0.5003270373238773;
  const Kh = Math.tan((Math.PI * f0h) / sampleRate);

  const highpass: Biquad = {
    b0: 1,
    b1: -2,
    b2: 1,
    a1: (2 * (Kh * Kh - 1)) / (1 + Kh / Qh + Kh * Kh),
    a2: (1 - Kh / Qh + Kh * Kh) / (1 + Kh / Qh + Kh * Kh),
  };

  return [shelf, highpass];
}

/**
 * K 特性フィルタを通しながら 100ms ごとの二乗和を貯める。
 *
 * フィルタ結果を全長分保持しない（libebur128 と同じサブブロック方式）。
 * 5 分ステレオだと Float64 の中間配列だけで 200MB 以上になり、長尺ファイルで
 * メモリを圧迫するため、1 パスでサブブロックの和まで畳み込む。
 * 演算は倍精度で行う。Float32 に丸めると広帯域信号で誤差が積み上がり、
 * ffmpeg (libebur128 も double 演算) との差が 0.2 LU 程度まで開く。
 */
function subBlockSums(
  data: Float32Array,
  shelf: Biquad,
  highpass: Biquad,
  subBlockSize: number,
): Float64Array {
  const count = Math.floor(data.length / subBlockSize);
  const sums = new Float64Array(count);

  // 1 段目（シェルビング）と 2 段目（ハイパス）の状態
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let z1 = 0, z2 = 0, w1 = 0, w2 = 0;

  for (let block = 0; block < count; block++) {
    const start = block * subBlockSize;
    const end = start + subBlockSize;
    let acc = 0;
    for (let i = start; i < end; i++) {
      const x0 = data[i];
      const y0 =
        shelf.b0 * x0 + shelf.b1 * x1 + shelf.b2 * x2 - shelf.a1 * y1 - shelf.a2 * y2;
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;

      const w0 =
        highpass.b0 * y0 + highpass.b1 * z1 + highpass.b2 * z2 -
        highpass.a1 * w1 - highpass.a2 * w2;
      z2 = z1;
      z1 = y0;
      w2 = w1;
      w1 = w0;

      acc += w0 * w0;
    }
    sums[block] = acc;
  }
  return sums;
}

/** チャンネルごとの重み。5.1 のサラウンドは +1.5dB だが、本アプリは最大 2ch */
function channelWeight(index: number): number {
  return index <= 1 ? 1 : 1.41;
}

/**
 * BS.1770-4 の Integrated Loudness（LUFS）。
 *
 * 400ms ブロック・75% オーバーラップで求めたラウドネスに対し、
 * 絶対ゲート (-70 LUFS) と相対ゲート (ゲート後平均 -10 LU) をかけて平均する。
 */
export function analyzeLufs(
  channels: Float32Array[],
  sampleRate: number,
): number | null {
  if (channels.length === 0 || sampleRate <= 0) return null;

  // 400ms ブロックを 100ms サブブロック 4 個の和として求める（75% オーバーラップ）
  const subBlockSize = Math.round(sampleRate * 0.1);
  const blockSize = subBlockSize * 4;
  const length = channels[0].length;
  if (length < blockSize) return null; // 400ms 未満は測れない

  const [shelf, highpass] = kWeightingFilters(sampleRate);
  const perChannel = channels.map((data) =>
    subBlockSums(data, shelf, highpass, subBlockSize),
  );

  const subBlockCount = Math.min(...perChannel.map((s) => s.length));
  const blockPowers: number[] = [];
  for (let start = 0; start + 4 <= subBlockCount; start++) {
    let power = 0;
    for (let ch = 0; ch < perChannel.length; ch++) {
      const sums = perChannel[ch];
      const sum =
        sums[start] + sums[start + 1] + sums[start + 2] + sums[start + 3];
      power += channelWeight(ch) * (sum / blockSize);
    }
    blockPowers.push(power);
  }
  if (blockPowers.length === 0) return null;

  const loudnessOf = (power: number) =>
    power > 0 ? -0.691 + 10 * Math.log10(power) : -Infinity;

  // 絶対ゲート
  const absoluteGated = blockPowers.filter((p) => loudnessOf(p) > -70);
  if (absoluteGated.length === 0) return null;

  // 相対ゲート（絶対ゲート通過分の平均から -10 LU）
  const meanAbsolute =
    absoluteGated.reduce((a, b) => a + b, 0) / absoluteGated.length;
  const relativeThreshold = loudnessOf(meanAbsolute) - 10;
  const gated = absoluteGated.filter((p) => loudnessOf(p) > relativeThreshold);
  if (gated.length === 0) return null;

  const meanGated = gated.reduce((a, b) => a + b, 0) / gated.length;
  return loudnessOf(meanGated);
}
