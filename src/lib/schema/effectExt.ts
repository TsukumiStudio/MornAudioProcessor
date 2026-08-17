import type {
  AcrusherOption,
  AdelayOption,
  AexciterOption,
  AfadeOption,
  AfreqshiftOption,
  AloopOption,
  ApadOption,
  ApulsatorOption,
  AreverseOption,
  CompensationdelayOption,
  CrystalizerOption,
  DcshiftOption,
  EffectFilterExtOption,
} from "../types";
import type { FilterDef, SelectControl, SerArg } from "./types";
import { fixed, fixedWith, k, kb, lit, pos, withUnit } from "./helpers";

/** 値そのままをラベルにする select（curve / mode / timing） */
function plainSelect<V extends string>(
  def: V,
  values: readonly V[],
): SelectControl<V> {
  return {
    control: "select",
    default: def,
    options: values.map((value) => ({ value, label: value })),
  };
}

const AFADE_CURVES = [
  "tri",
  "qsin",
  "esin",
  "hsin",
  "log",
  "ipar",
  "qua",
  "cub",
  "squ",
  "cbr",
  "par",
  "exp",
  "iqsin",
  "ihsin",
  "dese",
  "desi",
  "losi",
  "sinc",
  "isinc",
  "nofade",
] as const;

/**
 * フェードイン / フェードアウトは同じ afade フィルタで、方向だけが違う。
 * `type` は UI に出さず fixed で持ち、出力側は t=in / t=out の固定リテラルで表す。
 */
function afadeDef(dir: "in" | "out", label: string) {
  return {
    label,
    ffname: "afade",
    doc: "afade",
    fixed: { type: dir },
    params: {
      start_time: { control: "range", default: 0, min: 0, max: 300, step: 0.1, format: fixedWith(1, " sec") },
      duration: { control: "range", default: 0, min: 0, max: 300, step: 0.1, format: fixedWith(1, " sec") },
      curve: plainSelect<AfadeOption["curve"]>("tri", [...AFADE_CURVES]),
      silence: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
      unity: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    },
    serialize: {
      name: "afade",
      args: [
        // lit() の戻りは SerArg<never> なので、混在配列の要素型に合わせる
        lit(`t=${dir}`) as SerArg<AfadeOption>,
        k<AfadeOption>("st", "start_time"),
        k<AfadeOption>("d", "duration"),
        k<AfadeOption>("curve", "curve"),
        k<AfadeOption>("silence", "silence"),
        k<AfadeOption>("unity", "unity"),
      ],
    },
  } satisfies FilterDef<AfadeOption, "type">;
}

const afade_in = afadeDef("in", "フェードイン");
const afade_out = afadeDef("out", "フェードアウト");

const acrusher = {
  label: "ビットクラッシャー",
  ffname: "acrusher",
  doc: "acrusher",
  params: {
    level_in: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    level_out: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    bits: { control: "number", default: 8, min: 1, max: 64, step: 1 },
    mix: { control: "range", default: 0.5, min: 0, max: 1, step: 0.01, format: fixed(2) },
    mode: plainSelect<AcrusherOption["mode"]>("lin", ["lin", "log"]),
    dc: { control: "range", default: 1, min: 0.25, max: 4, step: 0.01, format: fixed(2) },
    aa: { control: "range", default: 0.5, min: 0, max: 1, step: 0.01, format: fixed(2) },
    samples: { control: "number", default: 1, min: 1, max: 250, step: 1 },
    lfo: { control: "checkbox", default: false, desc: "enable LFO" },
    lforange: { control: "number", default: 20, min: 1, max: 250, step: 1 },
    lforate: { control: "range", default: 0.3, min: 0.01, max: 200, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "acrusher",
    args: [
      k<AcrusherOption>("level_in", "level_in"),
      k<AcrusherOption>("level_out", "level_out"),
      k<AcrusherOption>("bits", "bits"),
      k<AcrusherOption>("mix", "mix"),
      k<AcrusherOption>("mode", "mode"),
      k<AcrusherOption>("dc", "dc"),
      k<AcrusherOption>("aa", "aa"),
      k<AcrusherOption>("samples", "samples"),
      kb<AcrusherOption>("lfo", "lfo"),
      k<AcrusherOption>("lforange", "lforange"),
      k<AcrusherOption>("lforate", "lforate"),
    ],
  },
} satisfies FilterDef<AcrusherOption>;

const aexciter = {
  label: "エキサイター",
  ffname: "aexciter",
  doc: "aexciter",
  params: {
    level_in: { control: "range", default: 1, min: 0, max: 64, step: 0.01, format: fixed(2) },
    level_out: { control: "range", default: 1, min: 0, max: 64, step: 0.01, format: fixed(2) },
    amount: { control: "range", default: 1, min: 0, max: 64, step: 0.01, format: fixed(2) },
    drive: { control: "range", default: 8.5, min: 0.1, max: 10, step: 0.1, format: fixed(1) },
    blend: { control: "range", default: 0, min: -10, max: 10, step: 0.1, format: fixed(1) },
    freq: { control: "number", default: 7500, min: 2000, max: 12000, step: 1, unit: "Hz" },
    ceil: { control: "number", default: 9999, min: 9999, max: 20000, step: 1, unit: "Hz" },
    listen: { control: "checkbox", default: false, desc: "listen mode" },
  },
  serialize: {
    name: "aexciter",
    args: [
      k<AexciterOption>("level_in", "level_in"),
      k<AexciterOption>("level_out", "level_out"),
      k<AexciterOption>("amount", "amount"),
      k<AexciterOption>("drive", "drive"),
      k<AexciterOption>("blend", "blend"),
      k<AexciterOption>("freq", "freq"),
      k<AexciterOption>("ceil", "ceil"),
      kb<AexciterOption>("listen", "listen"),
    ],
  },
} satisfies FilterDef<AexciterOption>;

const crystalizer = {
  label: "クリスタライザー",
  ffname: "crystalizer",
  doc: "crystalizer",
  params: {
    i: { control: "range", default: 2, min: -10, max: 10, step: 0.1, format: fixed(1) },
    c: { control: "checkbox", default: true, desc: "clipping prevention" },
  },
  serialize: {
    name: "crystalizer",
    args: [k<CrystalizerOption>("i", "i"), kb<CrystalizerOption>("c", "c")],
  },
} satisfies FilterDef<CrystalizerOption>;

/** パラメータを持たないので出力は `areverse` の裸名、UI も param 行なし */
const areverse = {
  label: "リバース",
  ffname: "areverse",
  doc: "areverse",
  params: {},
  serialize: {
    name: "areverse",
    args: [],
  },
} satisfies FilterDef<AreverseOption>;

const aloop = {
  label: "ループ",
  ffname: "aloop",
  doc: "aloop",
  params: {
    loop: { control: "number", default: 0, min: -1, max: 99999, step: 1 },
    size: { control: "number", default: 0, min: 0, max: 99999, step: 1 },
    start: { control: "number", default: 0, min: -1, max: 99999, step: 1 },
  },
  serialize: {
    name: "aloop",
    args: [
      k<AloopOption>("loop", "loop"),
      k<AloopOption>("size", "size"),
      k<AloopOption>("start", "start"),
    ],
  },
} satisfies FilterDef<AloopOption>;

const afreqshift = {
  label: "周波数シフト",
  ffname: "afreqshift",
  doc: "afreqshift",
  params: {
    shift: { control: "range", default: 0, min: -10000, max: 10000, step: 1, format: withUnit(" Hz") },
    level: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    order: { control: "number", default: 8, min: 1, max: 16, step: 1 },
  },
  serialize: {
    name: "afreqshift",
    args: [
      k<AfreqshiftOption>("shift", "shift"),
      k<AfreqshiftOption>("level", "level"),
      k<AfreqshiftOption>("order", "order"),
    ],
  },
} satisfies FilterDef<AfreqshiftOption>;

const apulsator = {
  label: "パルセーター",
  ffname: "apulsator",
  doc: "apulsator",
  params: {
    level_in: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    level_out: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    mode: plainSelect<ApulsatorOption["mode"]>("sine", [
      "sine",
      "triangle",
      "square",
      "sawup",
      "sawdown",
    ]),
    amount: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    offset_l: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
    offset_r: { control: "range", default: 0.5, min: 0, max: 1, step: 0.01, format: fixed(2) },
    width: { control: "range", default: 1, min: 0, max: 2, step: 0.01, format: fixed(2) },
    timing: plainSelect<ApulsatorOption["timing"]>("bpm", ["bpm", "ms", "hz"]),
    bpm: { control: "range", default: 120, min: 30, max: 300, step: 1 },
    ms: { control: "range", default: 500, min: 10, max: 2000, step: 1, format: withUnit(" ms") },
    hz: { control: "range", default: 2, min: 0.01, max: 100, step: 0.01, format: fixedWith(2, " Hz") },
  },
  serialize: {
    name: "apulsator",
    args: [
      k<ApulsatorOption>("level_in", "level_in"),
      k<ApulsatorOption>("level_out", "level_out"),
      k<ApulsatorOption>("mode", "mode"),
      k<ApulsatorOption>("amount", "amount"),
      k<ApulsatorOption>("offset_l", "offset_l"),
      k<ApulsatorOption>("offset_r", "offset_r"),
      k<ApulsatorOption>("width", "width"),
      k<ApulsatorOption>("timing", "timing"),
      k<ApulsatorOption>("bpm", "bpm"),
      k<ApulsatorOption>("ms", "ms"),
      k<ApulsatorOption>("hz", "hz"),
    ],
  },
} satisfies FilterDef<ApulsatorOption>;

/** delays は位置引数、all だけ key=value */
const adelay = {
  label: "ディレイ",
  ffname: "adelay",
  doc: "adelay",
  params: {
    delays: { control: "text", default: "0" },
    all: { control: "checkbox", default: false, desc: "apply to all channels" },
  },
  serialize: {
    name: "adelay",
    args: [pos<AdelayOption>("delays"), kb<AdelayOption>("all", "all")],
  },
} satisfies FilterDef<AdelayOption>;

const compensationdelay = {
  label: "補正ディレイ",
  ffname: "compensationdelay",
  doc: "compensationdelay",
  params: {
    mm: { control: "number", default: 0, min: 0, max: 10, step: 1 },
    cm: { control: "number", default: 0, min: 0, max: 100, step: 1 },
    m: { control: "number", default: 0, min: 0, max: 100, step: 1 },
    dry: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
    wet: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    temp: { control: "range", default: 20, min: -50, max: 50, step: 0.5, format: fixed(1) },
  },
  serialize: {
    name: "compensationdelay",
    args: [
      k<CompensationdelayOption>("mm", "mm"),
      k<CompensationdelayOption>("cm", "cm"),
      k<CompensationdelayOption>("m", "m"),
      k<CompensationdelayOption>("dry", "dry"),
      k<CompensationdelayOption>("wet", "wet"),
      k<CompensationdelayOption>("temp", "temp"),
    ],
  },
} satisfies FilterDef<CompensationdelayOption>;

const dcshift = {
  label: "DCシフト",
  ffname: "dcshift",
  doc: "dcshift",
  params: {
    shift: { control: "range", default: 0, min: -1, max: 1, step: 0.01, format: fixed(2) },
    limitergain: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "dcshift",
    args: [
      k<DcshiftOption>("shift", "shift"),
      k<DcshiftOption>("limitergain", "limitergain"),
    ],
  },
} satisfies FilterDef<DcshiftOption>;

const apad = {
  label: "パディング",
  ffname: "apad",
  doc: "apad",
  params: {
    pad_dur: { control: "range", default: 0, min: 0, max: 300, step: 0.1, format: fixedWith(1, " sec") },
    whole_dur: { control: "range", default: 0, min: 0, max: 300, step: 0.1, format: fixedWith(1, " sec") },
  },
  serialize: {
    name: "apad",
    args: [
      k<ApadOption>("pad_dur", "pad_dur"),
      k<ApadOption>("whole_dur", "whole_dur"),
    ],
  },
} satisfies FilterDef<ApadOption>;

/** 宣言順が UI の表示順かつ ffmpeg のフィルタ適用順になる */
export const effectExtGroup = {
  afade_in,
  afade_out,
  acrusher,
  aexciter,
  crystalizer,
  areverse,
  aloop,
  afreqshift,
  apulsator,
  adelay,
  compensationdelay,
  dcshift,
  apad,
} satisfies Record<keyof EffectFilterExtOption, unknown>;
