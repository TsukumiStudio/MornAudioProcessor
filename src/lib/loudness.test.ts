import { describe, expect, it } from "vitest";
import { analyzeLufs, analyzePeakRms } from "./loudness";

/**
 * 期待値は ffmpeg 8.0 の実測値。
 * - peak / RMS: `-af volumedetect` の max_volume / mean_volume
 * - LUFS: `-af ebur128` の I（EBU R128 の参照実装）と
 *   `-af loudnorm=print_format=json` の input_i の両方
 *
 * 検証の要点: 下の makeSignal は測定に使った WAV を生成したコードと同一なので、
 * ここで再生成したサンプル列は ffmpeg に食わせたものとビット単位で一致する
 * （32bit float WAV で書き出したので量子化も挟まない）。
 */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type SignalKind =
  | "sine440"
  | "sine100"
  | "sine8k"
  | "quiet"
  | "noise"
  | "burst"
  | "silence";

function makeSignal(
  kind: SignalKind,
  seconds: number,
  sampleRate: number,
  channels: number,
): Float32Array[] {
  const n = Math.floor(seconds * sampleRate);
  const out: Float32Array[] = [];
  const rng = mulberry32(12345);
  for (let ch = 0; ch < channels; ch++) out.push(new Float32Array(n));
  for (let i = 0; i < n; i++) {
    let v: number;
    if (kind === "sine440") v = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5;
    else if (kind === "sine100") v = Math.sin((2 * Math.PI * 100 * i) / sampleRate) * 0.5;
    else if (kind === "sine8k") v = Math.sin((2 * Math.PI * 8000 * i) / sampleRate) * 0.5;
    else if (kind === "quiet") v = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.02;
    else if (kind === "noise") v = (rng() * 2 - 1) * 0.3;
    else if (kind === "burst")
      v =
        i % sampleRate < sampleRate * 0.3
          ? Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.8
          : 0;
    else v = 0;
    for (let ch = 0; ch < channels; ch++) out[ch][i] = ch === 0 ? v : v * 0.7;
  }
  return out;
}

interface Expected {
  kind: SignalKind;
  seconds: number;
  sampleRate: number;
  channels: number;
  peakDb: number;
  rmsDb: number;
  /** ffmpeg の ebur128 フィルタ（EBU R128 の参照実装、リサンプルなし） */
  ebur128: number;
  /** ffmpeg の loudnorm の input_i（内部で 192kHz にリサンプルされる） */
  loudnorm: number;
}

const FFMPEG_MEASURED: Record<string, Expected> = {
  "sine440 stereo 44.1k": {
    kind: "sine440", seconds: 5, sampleRate: 44100, channels: 2,
    peakDb: -6.0, rmsDb: -10.3, ebur128: -8.0, loudnorm: -8.05,
  },
  "sine100 stereo 44.1k": {
    kind: "sine100", seconds: 5, sampleRate: 44100, channels: 2,
    peakDb: -6.0, rmsDb: -10.3, ebur128: -9.1, loudnorm: -9.15,
  },
  "sine8k stereo 44.1k": {
    kind: "sine8k", seconds: 5, sampleRate: 44100, channels: 2,
    peakDb: -6.0, rmsDb: -10.3, ebur128: -4.0, loudnorm: -3.95,
  },
  "noise stereo 44.1k": {
    kind: "noise", seconds: 5, sampleRate: 44100, channels: 2,
    peakDb: -10.5, rmsDb: -16.5, ebur128: -10.4, loudnorm: -10.57,
  },
  "burst stereo 44.1k": {
    kind: "burst", seconds: 6, sampleRate: 44100, channels: 2,
    peakDb: -1.9, rmsDb: -11.5, ebur128: -6.9, loudnorm: -7.02,
  },
  "quiet stereo 44.1k": {
    kind: "quiet", seconds: 5, sampleRate: 44100, channels: 2,
    peakDb: -34.0, rmsDb: -38.3, ebur128: -35.9, loudnorm: -35.95,
  },
  "sine440 mono 48k": {
    kind: "sine440", seconds: 5, sampleRate: 48000, channels: 1,
    peakDb: -6.0, rmsDb: -9.0, ebur128: -9.7, loudnorm: -9.75,
  },
  "noise mono 48k": {
    kind: "noise", seconds: 5, sampleRate: 48000, channels: 1,
    peakDb: -10.5, rmsDb: -15.2, ebur128: -12.1, loudnorm: -12.27,
  },
};

describe("analyzePeakRms は volumedetect と一致する", () => {
  for (const [name, e] of Object.entries(FFMPEG_MEASURED)) {
    it(`${name}`, () => {
      const { peakDb, rmsDb } = analyzePeakRms(
        makeSignal(e.kind, e.seconds, e.sampleRate, e.channels),
      );
      // volumedetect の表示は 0.1dB 刻みなので、その丸め幅で比較する
      expect(peakDb).toBeCloseTo(e.peakDb, 1);
      expect(rmsDb).toBeCloseTo(e.rmsDb, 1);
    });
  }
});

describe("analyzeLufs は ebur128（参照実装）と一致する", () => {
  for (const [name, e] of Object.entries(FFMPEG_MEASURED)) {
    it(`${name}`, () => {
      const lufs = analyzeLufs(
        makeSignal(e.kind, e.seconds, e.sampleRate, e.channels),
        e.sampleRate,
      );
      expect(lufs).not.toBeNull();
      // ebur128 の表示が 0.1 LU 刻みなので、正解値自体の粒度が ±0.05 ある
      expect(Math.abs((lufs as number) - e.ebur128)).toBeLessThan(0.1);
    });
  }
});

describe("loudnorm の input_i との差", () => {
  // loudnorm は内部で 192kHz にアップサンプルしてから測るため、広帯域信号では
  // ebur128 と 0.1〜0.2 LU ずれる（実測: ノイズで 0.17〜0.18）。
  // アプリの表示は現在 loudnorm 由来なので、JS 計測へ切り替えると表示値が
  // この幅だけ動く。どれだけ動くかをここで固定しておく。
  for (const [name, e] of Object.entries(FFMPEG_MEASURED)) {
    it(`${name} は loudnorm と 0.25 LU 以内`, () => {
      const lufs = analyzeLufs(
        makeSignal(e.kind, e.seconds, e.sampleRate, e.channels),
        e.sampleRate,
      ) as number;
      expect(Math.abs(lufs - e.loudnorm)).toBeLessThan(0.25);
    });
  }
});

describe("端のケース", () => {
  it("無音は下限値になる", () => {
    const { peakDb, rmsDb } = analyzePeakRms([new Float32Array(1000)]);
    expect(peakDb).toBe(-91);
    expect(rmsDb).toBe(-91);
  });

  it("空配列でも壊れない", () => {
    expect(analyzePeakRms([])).toEqual({ peakDb: -91, rmsDb: -91 });
    expect(analyzeLufs([], 44100)).toBeNull();
  });

  it("400ms 未満は LUFS を測れないので null", () => {
    const short = makeSignal("sine440", 0.2, 44100, 1);
    expect(analyzeLufs(short, 44100)).toBeNull();
  });

  it("無音の LUFS は絶対ゲートで全ブロックが落ちて null", () => {
    expect(analyzeLufs([new Float32Array(44100)], 44100)).toBeNull();
  });

  it("フルスケールのサインは peak 0dB になる", () => {
    const n = 44100;
    const data = new Float32Array(n);
    for (let i = 0; i < n; i++) data[i] = Math.sin((2 * Math.PI * 1000 * i) / 44100);
    expect(analyzePeakRms([data]).peakDb).toBeCloseTo(0, 1);
  });

  it("サンプルレートごとに K 特性を作り直している（44.1k と 48k で近い値になる）", () => {
    const a = analyzeLufs(makeSignal("sine440", 5, 44100, 1), 44100) as number;
    const b = analyzeLufs(makeSignal("sine440", 5, 48000, 1), 48000) as number;
    expect(Math.abs(a - b)).toBeLessThan(0.15);
  });
});
