import type {
  ChorusOption,
  EchoOption,
  EffectFilterOption,
  FlangerOption,
  PhaserOption,
  PitchOption,
  TempoOption,
  TremoloOption,
  VibratoOption,
} from "../types";
import type { FilterDef } from "./types";
import { fixed, fixedWith, k, plainSelect, pos, withUnit } from "./helpers";


/** {v > 0 ? "+" : ""}{v} */
const signed = (v: number) => `${v > 0 ? "+" : ""}${v}`;

/** aecho は全パラメータが位置引数 */
const echo = {
  label: "エコー",
  ffname: "aecho",
  doc: "aecho",
  params: {
    in_gain: { control: "range", default: 0.6, min: 0, max: 1, step: 0.01, format: fixed(2) },
    out_gain: { control: "range", default: 0.3, min: 0, max: 1, step: 0.01, format: fixed(2) },
    delays: { control: "number", default: 1000, min: 0, max: 90000, step: 1, unit: "ms" },
    decays: { control: "range", default: 0.5, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "aecho",
    args: [
      pos<EchoOption>("in_gain"),
      pos<EchoOption>("out_gain"),
      pos<EchoOption>("delays"),
      pos<EchoOption>("decays"),
    ],
  },
} satisfies FilterDef<EchoOption>;

/** chorus も全パラメータが位置引数 */
const chorus = {
  label: "コーラス",
  ffname: "chorus",
  doc: "chorus",
  params: {
    in_gain: { control: "range", default: 0.4, min: 0, max: 1, step: 0.01, format: fixed(2) },
    out_gain: { control: "range", default: 0.4, min: 0, max: 1, step: 0.01, format: fixed(2) },
    delays: { control: "number", default: 55, min: 0, max: 1000, step: 1, unit: "ms" },
    decays: { control: "range", default: 0.4, min: 0, max: 1, step: 0.01, format: fixed(2) },
    speeds: { control: "number", default: 0.25, min: 0.01, max: 10, step: 0.01, unit: "Hz" },
    depths: { control: "number", default: 2, min: 0, max: 100, step: 0.1, unit: "ms" },
  },
  serialize: {
    name: "chorus",
    args: [
      pos<ChorusOption>("in_gain"),
      pos<ChorusOption>("out_gain"),
      pos<ChorusOption>("delays"),
      pos<ChorusOption>("decays"),
      pos<ChorusOption>("speeds"),
      pos<ChorusOption>("depths"),
    ],
  },
} satisfies FilterDef<ChorusOption>;

const flanger = {
  label: "フランジャー",
  ffname: "flanger",
  doc: "flanger",
  params: {
    delay: { control: "range", default: 0, min: 0, max: 30, step: 0.1, format: fixedWith(1, " ms") },
    depth: { control: "range", default: 2, min: 0, max: 10, step: 0.1, format: fixedWith(1, " ms") },
    regen: { control: "range", default: 0, min: -95, max: 95, step: 1, format: withUnit("%") },
    width: { control: "range", default: 71, min: 0, max: 100, step: 1, format: withUnit("%") },
    speed: { control: "range", default: 0.5, min: 0.1, max: 10, step: 0.1, format: fixedWith(1, " Hz") },
    shape: plainSelect<FlangerOption["shape"]>("sinusoidal", [
      "sinusoidal",
      "triangular",
    ]),
    phase: { control: "range", default: 25, min: 0, max: 100, step: 1, format: withUnit("%") },
    interp: plainSelect<FlangerOption["interp"]>("linear", [
      "linear",
      "quadratic",
    ]),
  },
  serialize: {
    name: "flanger",
    args: [
      k<FlangerOption>("delay", "delay"),
      k<FlangerOption>("depth", "depth"),
      k<FlangerOption>("regen", "regen"),
      k<FlangerOption>("width", "width"),
      k<FlangerOption>("speed", "speed"),
      k<FlangerOption>("shape", "shape"),
      k<FlangerOption>("phase", "phase"),
      k<FlangerOption>("interp", "interp"),
    ],
  },
} satisfies FilterDef<FlangerOption>;

const phaser = {
  label: "フェイザー",
  ffname: "aphaser",
  doc: "aphaser",
  params: {
    in_gain: { control: "range", default: 0.4, min: 0, max: 1, step: 0.01, format: fixed(2) },
    out_gain: { control: "range", default: 0.74, min: 0, max: 2, step: 0.01, format: fixed(2) },
    delay: { control: "range", default: 3.0, min: 0, max: 5, step: 0.1, format: fixedWith(1, " ms") },
    decay: { control: "range", default: 0.4, min: 0, max: 0.99, step: 0.01, format: fixed(2) },
    speed: { control: "range", default: 0.5, min: 0.1, max: 2, step: 0.01, format: fixedWith(2, " Hz") },
    type: plainSelect<PhaserOption["type"]>("triangular", [
      "triangular",
      "sinusoidal",
    ]),
  },
  serialize: {
    name: "aphaser",
    args: [
      k<PhaserOption>("in_gain", "in_gain"),
      k<PhaserOption>("out_gain", "out_gain"),
      k<PhaserOption>("delay", "delay"),
      k<PhaserOption>("decay", "decay"),
      k<PhaserOption>("speed", "speed"),
      k<PhaserOption>("type", "type"),
    ],
  },
} satisfies FilterDef<PhaserOption>;

const tremolo = {
  label: "トレモロ",
  ffname: "tremolo",
  doc: "tremolo",
  params: {
    f: { control: "range", default: 5.0, min: 0.1, max: 20, step: 0.1, format: fixedWith(1, " Hz") },
    d: { control: "range", default: 0.5, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "tremolo",
    args: [k<TremoloOption>("f", "f"), k<TremoloOption>("d", "d")],
  },
} satisfies FilterDef<TremoloOption>;

const vibrato = {
  label: "ビブラート",
  ffname: "vibrato",
  doc: "vibrato",
  params: {
    f: { control: "range", default: 5.0, min: 0.1, max: 20, step: 0.1, format: fixedWith(1, " Hz") },
    d: { control: "range", default: 0.5, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "vibrato",
    args: [k<VibratoOption>("f", "f"), k<VibratoOption>("d", "d")],
  },
} satisfies FilterDef<VibratoOption>;

/** atempo は単一の位置引数 */
const tempo = {
  label: "テンポ変更",
  ffname: "atempo",
  doc: "atempo",
  params: {
    tempo: { control: "range", default: 1.0, min: 0.5, max: 4, step: 0.01, format: fixedWith(2, "x") },
  },
  serialize: {
    name: "atempo",
    args: [pos<TempoOption>("tempo")],
  },
} satisfies FilterDef<TempoOption>;

/**
 * ピッチ変更は asetrate / atempo / aresample の 3 フィルタに展開される。
 * semitones が 0、または入力サンプルレートが不明なら enabled でも何も出さない
 * （移行前の buildArgs の条件をそのまま移植）。
 */
const pitch = {
  label: "ピッチ変更",
  // 表示名は asetrate+atempo だが doc アンカーは asetrate
  ffname: "asetrate+atempo",
  doc: "asetrate",
  params: {
    semitones: { control: "range", default: 0, min: -12, max: 12, step: 1, format: signed },
  },
  serialize: {
    custom: (opt, ctx) => {
      if (opt.semitones === 0 || !ctx.input_sample_rate) return [];
      const ratio = Math.pow(2, opt.semitones / 12);
      const origRate = ctx.input_sample_rate;
      const newRate = Math.round(origRate * ratio);
      const tempoCompensation = 1 / ratio;
      return [
        `asetrate=${newRate}`,
        `atempo=${tempoCompensation}`,
        `aresample=${origRate}`,
      ];
    },
  },
} satisfies FilterDef<PitchOption>;

/** 宣言順が UI の表示順かつ ffmpeg のフィルタ適用順になる */
export const effectGroup = {
  echo,
  chorus,
  flanger,
  phaser,
  tremolo,
  vibrato,
  tempo,
  pitch,
} satisfies Record<keyof EffectFilterOption, unknown>;
