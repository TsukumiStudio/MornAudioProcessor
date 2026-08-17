import type {
  BalanceMode,
  CrossfeedOption,
  DialoguenhanceOption,
  ExtrastereoOption,
  HaasOption,
  StereoFilterOption,
  StereoMode,
  StereotoolsOption,
  StereowidenOption,
} from "../types";
import type { FilterDef, SelectControl } from "./types";
import { fixed, fixedWith, k, kb, withUnit } from "./helpers";

const STEREO_MODES: readonly StereoMode[] = [
  "lr>lr",
  "lr>ms",
  "ms>lr",
  "lr>ll",
  "lr>rr",
  "lr>l+r",
  "lr>rl",
  "ms>ll",
  "ms>rr",
  "ms>rl",
  "lr>l-r",
];

const BALANCE_MODES: readonly BalanceMode[] = ["balance", "amplitude", "power"];

/** 値そのままをラベルにする select（mode / bmode / middle_source） */
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

const stereotools = {
  label: "ステレオツール",
  ffname: "stereotools",
  doc: "stereotools",
  params: {
    level_in: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    level_out: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    balance_in: { control: "range", default: 0, min: -1, max: 1, step: 0.01, format: fixed(2) },
    balance_out: { control: "range", default: 0, min: -1, max: 1, step: 0.01, format: fixed(2) },
    softclip: { control: "checkbox", default: false },
    mutel: { control: "checkbox", default: false },
    muter: { control: "checkbox", default: false },
    phasel: { control: "checkbox", default: false },
    phaser: { control: "checkbox", default: false },
    mode: plainSelect<StereoMode>("lr>lr", STEREO_MODES),
    slev: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    sbal: { control: "range", default: 0, min: -1, max: 1, step: 0.01, format: fixed(2) },
    mlev: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    mpan: { control: "range", default: 0, min: -1, max: 1, step: 0.01, format: fixed(2) },
    base: { control: "range", default: 0, min: -1, max: 1, step: 0.01, format: fixed(2) },
    delay: { control: "range", default: 0, min: -20, max: 20, step: 0.1, format: fixedWith(1, " ms") },
    sclevel: { control: "range", default: 1, min: 1, max: 100, step: 1 },
    phase: { control: "range", default: 0, min: 0, max: 360, step: 1, format: withUnit("°") },
    bmode_in: plainSelect<BalanceMode>("balance", BALANCE_MODES),
    bmode_out: plainSelect<BalanceMode>("balance", BALANCE_MODES),
  },
  serialize: {
    name: "stereotools",
    args: [
      k<StereotoolsOption>("level_in", "level_in"),
      k<StereotoolsOption>("level_out", "level_out"),
      k<StereotoolsOption>("balance_in", "balance_in"),
      k<StereotoolsOption>("balance_out", "balance_out"),
      kb<StereotoolsOption>("softclip", "softclip"),
      kb<StereotoolsOption>("mutel", "mutel"),
      kb<StereotoolsOption>("muter", "muter"),
      kb<StereotoolsOption>("phasel", "phasel"),
      kb<StereotoolsOption>("phaser", "phaser"),
      k<StereotoolsOption>("mode", "mode"),
      k<StereotoolsOption>("slev", "slev"),
      k<StereotoolsOption>("sbal", "sbal"),
      k<StereotoolsOption>("mlev", "mlev"),
      k<StereotoolsOption>("mpan", "mpan"),
      k<StereotoolsOption>("base", "base"),
      k<StereotoolsOption>("delay", "delay"),
      k<StereotoolsOption>("sclevel", "sclevel"),
      k<StereotoolsOption>("phase", "phase"),
      k<StereotoolsOption>("bmode_in", "bmode_in"),
      k<StereotoolsOption>("bmode_out", "bmode_out"),
    ],
  },
} satisfies FilterDef<StereotoolsOption>;

const stereowiden = {
  label: "ステレオワイド化",
  ffname: "stereowiden",
  doc: "stereowiden",
  params: {
    delay: { control: "range", default: 20, min: 1, max: 100, step: 1, format: withUnit(" ms") },
    feedback: { control: "range", default: 0.3, min: 0, max: 0.9, step: 0.01, format: fixed(2) },
    crossfeed: { control: "range", default: 0.3, min: 0, max: 0.8, step: 0.01, format: fixed(2) },
    drymix: { control: "range", default: 0.8, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "stereowiden",
    args: [
      k<StereowidenOption>("delay", "delay"),
      k<StereowidenOption>("feedback", "feedback"),
      k<StereowidenOption>("crossfeed", "crossfeed"),
      k<StereowidenOption>("drymix", "drymix"),
    ],
  },
} satisfies FilterDef<StereowidenOption>;

const extrastereo = {
  label: "エクストラステレオ",
  ffname: "extrastereo",
  doc: "extrastereo",
  params: {
    m: { control: "range", default: 2.5, min: -10, max: 10, step: 0.1, format: fixed(1) },
    c: { control: "checkbox", default: true, desc: "clipping" },
  },
  serialize: {
    name: "extrastereo",
    args: [k<ExtrastereoOption>("m", "m"), kb<ExtrastereoOption>("c", "c")],
  },
} satisfies FilterDef<ExtrastereoOption>;

const crossfeed = {
  label: "クロスフィード",
  ffname: "crossfeed",
  doc: "crossfeed",
  params: {
    strength: { control: "range", default: 0.2, min: 0, max: 1, step: 0.01, format: fixed(2) },
    range: { control: "range", default: 0.5, min: 0, max: 1, step: 0.01, format: fixed(2) },
    slope: { control: "range", default: 0.5, min: 0.01, max: 1, step: 0.01, format: fixed(2) },
    level_in: { control: "range", default: 0.9, min: 0, max: 2, step: 0.01, format: fixed(2) },
    level_out: { control: "range", default: 1, min: 0, max: 2, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "crossfeed",
    args: [
      k<CrossfeedOption>("strength", "strength"),
      k<CrossfeedOption>("range", "range"),
      k<CrossfeedOption>("slope", "slope"),
      k<CrossfeedOption>("level_in", "level_in"),
      k<CrossfeedOption>("level_out", "level_out"),
    ],
  },
} satisfies FilterDef<CrossfeedOption>;

const haas = {
  label: "ハース効果",
  ffname: "haas",
  doc: "haas",
  params: {
    level_in: { control: "range", default: 1, min: 0, max: 2, step: 0.01, format: fixed(2) },
    level_out: { control: "range", default: 1, min: 0, max: 2, step: 0.01, format: fixed(2) },
    side_gain: { control: "range", default: 1, min: 0, max: 2, step: 0.01, format: fixed(2) },
    middle_source: plainSelect<HaasOption["middle_source"]>("left", [
      "left",
      "right",
      "mid",
      "side",
    ]),
    middle_phase: { control: "checkbox", default: false },
    left_delay: { control: "range", default: 2.05, min: 0, max: 40, step: 0.01, format: fixedWith(2, " ms") },
    left_balance: { control: "range", default: -1, min: -1, max: 1, step: 0.01, format: fixed(2) },
    left_gain: { control: "range", default: 1, min: 0, max: 2, step: 0.01, format: fixed(2) },
    left_phase: { control: "checkbox", default: false },
    right_delay: { control: "range", default: 2.12, min: 0, max: 40, step: 0.01, format: fixedWith(2, " ms") },
    right_balance: { control: "range", default: 1, min: -1, max: 1, step: 0.01, format: fixed(2) },
    right_gain: { control: "range", default: 1, min: 0, max: 2, step: 0.01, format: fixed(2) },
    right_phase: { control: "checkbox", default: true },
  },
  serialize: {
    name: "haas",
    args: [
      k<HaasOption>("level_in", "level_in"),
      k<HaasOption>("level_out", "level_out"),
      k<HaasOption>("side_gain", "side_gain"),
      k<HaasOption>("middle_source", "middle_source"),
      kb<HaasOption>("middle_phase", "middle_phase"),
      k<HaasOption>("left_delay", "left_delay"),
      k<HaasOption>("left_balance", "left_balance"),
      k<HaasOption>("left_gain", "left_gain"),
      kb<HaasOption>("left_phase", "left_phase"),
      k<HaasOption>("right_delay", "right_delay"),
      k<HaasOption>("right_balance", "right_balance"),
      k<HaasOption>("right_gain", "right_gain"),
      kb<HaasOption>("right_phase", "right_phase"),
    ],
  },
} satisfies FilterDef<HaasOption>;

const dialoguenhance = {
  label: "ダイアログ強調",
  ffname: "dialoguenhance",
  doc: "dialoguenhance",
  params: {
    original: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    enhance: { control: "range", default: 1, min: 0, max: 3, step: 0.01, format: fixed(2) },
    voice: { control: "range", default: 2, min: 2, max: 32, step: 1 },
  },
  serialize: {
    name: "dialoguenhance",
    args: [
      k<DialoguenhanceOption>("original", "original"),
      k<DialoguenhanceOption>("enhance", "enhance"),
      k<DialoguenhanceOption>("voice", "voice"),
    ],
  },
} satisfies FilterDef<DialoguenhanceOption>;

/** 宣言順が UI の表示順かつ ffmpeg のフィルタ適用順になる */
export const stereoGroup = {
  stereotools,
  stereowiden,
  extrastereo,
  crossfeed,
  haas,
  dialoguenhance,
} satisfies Record<keyof StereoFilterOption, unknown>;
