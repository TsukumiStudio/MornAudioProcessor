import type {
  CompressorOption,
  DynamicsFilterOption,
  GateOption,
  LimiterOption,
} from "../types";
import type { FilterDef } from "./types";
import { fixed, k, kb, plainSelect, withUnit } from "./helpers";


const modeSelect = () =>
  plainSelect<"downward" | "upward">("downward", ["downward", "upward"]);
const detectionSelect = () => plainSelect<"peak" | "rms">("rms", ["peak", "rms"]);
const linkSelect = () =>
  plainSelect<"average" | "maximum">("average", ["average", "maximum"]);

/** 移行前の thresholdToDb を逐語移植（0 以下は -inf） */
export function thresholdToDb(v: number): string {
  if (v <= 0) return "-inf";
  return (20 * Math.log10(v)).toFixed(1);
}

/** {thresholdToDb(v)} dB */
const thresholdDb = (v: number) => `${thresholdToDb(v)} dB`;

const compressor = {
  label: "コンプレッサー",
  ffname: "acompressor",
  doc: "acompressor",
  params: {
    threshold: { control: "range", default: 0.125, min: 0.001, max: 1, step: 0.001, format: thresholdDb },
    ratio: { control: "range", default: 2, min: 1, max: 20, step: 0.5, format: withUnit(":1") },
    attack: { control: "range", default: 20, min: 0.01, max: 2000, step: 1, format: withUnit(" ms") },
    release: { control: "range", default: 250, min: 0.01, max: 9000, step: 1, format: withUnit(" ms") },
    makeup: { control: "range", default: 1, min: 1, max: 64, step: 0.5, format: withUnit("x") },
    knee: { control: "range", default: 2.828, min: 1, max: 8, step: 0.1, format: fixed(1) },
    mode: modeSelect(),
    detection: detectionSelect(),
    link: linkSelect(),
    mix: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    level_in: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "acompressor",
    args: [
      k<CompressorOption>("threshold", "threshold"),
      k<CompressorOption>("ratio", "ratio"),
      k<CompressorOption>("attack", "attack"),
      k<CompressorOption>("release", "release"),
      k<CompressorOption>("makeup", "makeup"),
      k<CompressorOption>("knee", "knee"),
      k<CompressorOption>("mode", "mode"),
      k<CompressorOption>("detection", "detection"),
      k<CompressorOption>("link", "link"),
      k<CompressorOption>("mix", "mix"),
      k<CompressorOption>("level_in", "level_in"),
    ],
  },
} satisfies FilterDef<CompressorOption>;

const limiter = {
  label: "リミッター",
  ffname: "alimiter",
  doc: "alimiter",
  params: {
    limit: { control: "range", default: 1.0, min: 0.0625, max: 1, step: 0.001, format: thresholdDb },
    attack: { control: "range", default: 5, min: 0.1, max: 80, step: 0.1, format: withUnit(" ms") },
    release: { control: "range", default: 50, min: 1, max: 8000, step: 1, format: withUnit(" ms") },
    level: { control: "checkbox", default: false, desc: "auto level" },
    level_in: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    level_out: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    asc: { control: "checkbox", default: false, desc: "adaptive release" },
    asc_level: { control: "range", default: 0.5, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "alimiter",
    args: [
      k<LimiterOption>("limit", "limit"),
      k<LimiterOption>("attack", "attack"),
      k<LimiterOption>("release", "release"),
      kb<LimiterOption>("level", "level"),
      k<LimiterOption>("level_in", "level_in"),
      k<LimiterOption>("level_out", "level_out"),
      kb<LimiterOption>("asc", "asc"),
      k<LimiterOption>("asc_level", "asc_level"),
    ],
  },
} satisfies FilterDef<LimiterOption>;

const gate = {
  label: "ノイズゲート",
  ffname: "agate",
  doc: "agate",
  params: {
    threshold: { control: "range", default: 0.125, min: 0, max: 1, step: 0.001, format: thresholdDb },
    ratio: { control: "range", default: 2, min: 1, max: 20, step: 0.5, format: withUnit(":1") },
    range: { control: "range", default: 0.06125, min: 0, max: 1, step: 0.001, format: fixed(3) },
    attack: { control: "range", default: 20, min: 0.01, max: 9000, step: 1, format: withUnit(" ms") },
    release: { control: "range", default: 250, min: 0.01, max: 9000, step: 1, format: withUnit(" ms") },
    makeup: { control: "range", default: 1, min: 1, max: 64, step: 0.5, format: withUnit("x") },
    knee: { control: "range", default: 2.828, min: 1, max: 8, step: 0.1, format: fixed(1) },
    mode: modeSelect(),
    detection: detectionSelect(),
    link: linkSelect(),
  },
  serialize: {
    name: "agate",
    args: [
      k<GateOption>("threshold", "threshold"),
      k<GateOption>("ratio", "ratio"),
      k<GateOption>("range", "range"),
      k<GateOption>("attack", "attack"),
      k<GateOption>("release", "release"),
      k<GateOption>("makeup", "makeup"),
      k<GateOption>("knee", "knee"),
      k<GateOption>("mode", "mode"),
      k<GateOption>("detection", "detection"),
      k<GateOption>("link", "link"),
    ],
  },
} satisfies FilterDef<GateOption>;

/** 宣言順が UI の表示順かつ ffmpeg のフィルタ適用順になる */
export const dynamicsGroup = {
  compressor,
  limiter,
  gate,
} satisfies Record<keyof DynamicsFilterOption, unknown>;
