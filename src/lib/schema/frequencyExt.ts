import type {
  AdynamicequalizerOption,
  AllpassFilterOption,
  AsubboostOption,
  AsubcutOption,
  AsupercutOption,
  BandrejectOption,
  BassOption,
  FrequencyFilterExtOption,
  TiltshelfOption,
  TrebleOption,
} from "../types";
import type { FilterDef, SelectControl } from "./types";
import {
  fixed,
  fixedWith,
  k,
  plainSelect,
  polesSelect,
  signedDb,
  widthTypeSelect,
  withUnit,
} from "./helpers";


/** allpass の order（polesSelect と違いラベルは数値そのまま） */
function orderSelect(def: 1 | 2): SelectControl<1 | 2> {
  return {
    control: "select",
    default: def,
    options: [
      { value: 1, label: "1" },
      { value: 2, label: "2" },
    ],
  };
}

const bass = {
  label: "バスブースト",
  ffname: "bass",
  doc: "bass_002c-lowshelf",
  params: {
    gain: { control: "range", default: 0, min: -30, max: 30, step: 0.5, format: signedDb },
    frequency: { control: "number", default: 100, min: 1, max: 999999, step: 1, unit: "Hz" },
    width_type: widthTypeSelect("h"),
    width: { control: "number", default: 80, min: 0.01, max: 99999, step: 0.01 },
    poles: polesSelect(2),
    mix: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "bass",
    args: [
      k<BassOption>("g", "gain"),
      k<BassOption>("f", "frequency"),
      k<BassOption>("t", "width_type"),
      k<BassOption>("w", "width"),
      k<BassOption>("p", "poles"),
      k<BassOption>("m", "mix"),
    ],
  },
} satisfies FilterDef<BassOption>;

const treble = {
  label: "トレブル",
  ffname: "treble",
  doc: "treble_002c-highshelf_002c-tiltshelf",
  params: {
    gain: { control: "range", default: 0, min: -30, max: 30, step: 0.5, format: signedDb },
    frequency: { control: "number", default: 3000, min: 1, max: 999999, step: 1, unit: "Hz" },
    width_type: widthTypeSelect("h"),
    width: { control: "number", default: 500, min: 0.01, max: 99999, step: 0.01 },
    poles: polesSelect(2),
    mix: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "treble",
    args: [
      k<TrebleOption>("g", "gain"),
      k<TrebleOption>("f", "frequency"),
      k<TrebleOption>("t", "width_type"),
      k<TrebleOption>("w", "width"),
      k<TrebleOption>("p", "poles"),
      k<TrebleOption>("m", "mix"),
    ],
  },
} satisfies FilterDef<TrebleOption>;

const bandreject = {
  label: "バンドリジェクト",
  ffname: "bandreject",
  doc: "bandreject",
  params: {
    frequency: { control: "number", default: 1000, min: 1, max: 999999, step: 1, unit: "Hz" },
    width_type: widthTypeSelect("q"),
    width: { control: "number", default: 1, min: 0.01, max: 99999, step: 0.01 },
    mix: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "bandreject",
    args: [
      k<BandrejectOption>("f", "frequency"),
      k<BandrejectOption>("t", "width_type"),
      k<BandrejectOption>("w", "width"),
      k<BandrejectOption>("m", "mix"),
    ],
  },
} satisfies FilterDef<BandrejectOption>;

const tiltshelf = {
  label: "チルトシェルフ",
  ffname: "tiltshelf",
  doc: "tiltshelf",
  params: {
    gain: { control: "range", default: 0, min: -30, max: 30, step: 0.5, format: signedDb },
    frequency: { control: "number", default: 1000, min: 1, max: 999999, step: 1, unit: "Hz" },
    width_type: widthTypeSelect("h"),
    width: { control: "number", default: 500, min: 0.01, max: 99999, step: 0.01 },
    poles: polesSelect(2),
    mix: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "tiltshelf",
    args: [
      k<TiltshelfOption>("g", "gain"),
      k<TiltshelfOption>("f", "frequency"),
      k<TiltshelfOption>("t", "width_type"),
      k<TiltshelfOption>("w", "width"),
      k<TiltshelfOption>("p", "poles"),
      k<TiltshelfOption>("m", "mix"),
    ],
  },
} satisfies FilterDef<TiltshelfOption>;

const allpass = {
  label: "オールパス",
  ffname: "allpass",
  doc: "allpass",
  params: {
    frequency: { control: "number", default: 1000, min: 1, max: 999999, step: 1, unit: "Hz" },
    width_type: widthTypeSelect("q"),
    width: { control: "number", default: 0.707, min: 0.01, max: 99999, step: 0.01 },
    mix: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    order: orderSelect(2),
  },
  serialize: {
    name: "allpass",
    args: [
      k<AllpassFilterOption>("f", "frequency"),
      k<AllpassFilterOption>("t", "width_type"),
      k<AllpassFilterOption>("w", "width"),
      k<AllpassFilterOption>("m", "mix"),
      k<AllpassFilterOption>("o", "order"),
    ],
  },
} satisfies FilterDef<AllpassFilterOption>;

const asubboost = {
  label: "サブブースト",
  ffname: "asubboost",
  doc: "asubboost",
  params: {
    dry: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    wet: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    boost: { control: "range", default: 2, min: 1, max: 12, step: 0.1, format: fixedWith(1, " dB") },
    decay: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
    feedback: { control: "range", default: 0.9, min: 0, max: 1, step: 0.01, format: fixed(2) },
    cutoff: { control: "number", default: 100, min: 1, max: 999999, step: 1, unit: "Hz" },
    slope: { control: "range", default: 0.5, min: 0.0001, max: 1, step: 0.0001, format: fixed(4) },
    delay: { control: "number", default: 20, min: 1, max: 100, step: 1, unit: "ms" },
  },
  serialize: {
    name: "asubboost",
    args: [
      k<AsubboostOption>("dry", "dry"),
      k<AsubboostOption>("wet", "wet"),
      k<AsubboostOption>("boost", "boost"),
      k<AsubboostOption>("decay", "decay"),
      k<AsubboostOption>("feedback", "feedback"),
      k<AsubboostOption>("cutoff", "cutoff"),
      k<AsubboostOption>("slope", "slope"),
      k<AsubboostOption>("delay", "delay"),
    ],
  },
} satisfies FilterDef<AsubboostOption>;

const asubcut = {
  label: "サブカット",
  ffname: "asubcut",
  doc: "asubcut",
  params: {
    cutoff: { control: "number", default: 20, min: 2, max: 200, step: 1, unit: "Hz" },
    order: { control: "number", default: 10, min: 3, max: 20, step: 1 },
    level: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "asubcut",
    args: [
      k<AsubcutOption>("cutoff", "cutoff"),
      k<AsubcutOption>("order", "order"),
      k<AsubcutOption>("level", "level"),
    ],
  },
} satisfies FilterDef<AsubcutOption>;

const asupercut = {
  label: "スーパーカット",
  ffname: "asupercut",
  doc: "asupercut",
  params: {
    cutoff: { control: "number", default: 20000, min: 20000, max: 192000, step: 1000, unit: "Hz" },
    order: { control: "number", default: 10, min: 3, max: 20, step: 1 },
    level: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "asupercut",
    args: [
      k<AsupercutOption>("cutoff", "cutoff"),
      k<AsupercutOption>("order", "order"),
      k<AsupercutOption>("level", "level"),
    ],
  },
} satisfies FilterDef<AsupercutOption>;

const adynamicequalizer = {
  label: "ダイナミックEQ",
  ffname: "adynamicequalizer",
  doc: "adynamicequalizer",
  params: {
    threshold: { control: "range", default: 0, min: -50, max: 50, step: 0.5, format: signedDb },
    dfrequency: { control: "number", default: 1000, min: 1, max: 999999, step: 1, unit: "Hz" },
    dqfactor: { control: "number", default: 1, min: 0.001, max: 1000, step: 0.01 },
    tfrequency: { control: "number", default: 1000, min: 1, max: 999999, step: 1, unit: "Hz" },
    tqfactor: { control: "number", default: 1, min: 0.001, max: 1000, step: 0.01 },
    attack: { control: "range", default: 20, min: 0.01, max: 2000, step: 1, format: withUnit(" ms") },
    release: { control: "range", default: 200, min: 0.01, max: 9000, step: 1, format: withUnit(" ms") },
    ratio: { control: "range", default: 1, min: 0, max: 30, step: 0.5, format: withUnit(":1") },
    makeup: { control: "range", default: 0, min: -50, max: 50, step: 0.5, format: signedDb },
    range: { control: "range", default: 50, min: -200, max: 200, step: 1, format: withUnit(" dB") },
    mode: plainSelect<AdynamicequalizerOption["mode"]>("cutbelow", [
      "listen",
      "cutbelow",
      "cutabove",
      "boostbelow",
      "boostabove",
    ]),
    dftype: plainSelect<AdynamicequalizerOption["dftype"]>("bandpass", [
      "bandpass",
      "lowpass",
      "highpass",
      "peak",
    ]),
    tftype: plainSelect<AdynamicequalizerOption["tftype"]>("bell", [
      "bell",
      "lowshelf",
      "highshelf",
    ]),
  },
  serialize: {
    name: "adynamicequalizer",
    args: [
      k<AdynamicequalizerOption>("threshold", "threshold"),
      k<AdynamicequalizerOption>("dfrequency", "dfrequency"),
      k<AdynamicequalizerOption>("dqfactor", "dqfactor"),
      k<AdynamicequalizerOption>("tfrequency", "tfrequency"),
      k<AdynamicequalizerOption>("tqfactor", "tqfactor"),
      k<AdynamicequalizerOption>("attack", "attack"),
      k<AdynamicequalizerOption>("release", "release"),
      k<AdynamicequalizerOption>("ratio", "ratio"),
      k<AdynamicequalizerOption>("makeup", "makeup"),
      k<AdynamicequalizerOption>("range", "range"),
      k<AdynamicequalizerOption>("mode", "mode"),
      k<AdynamicequalizerOption>("dftype", "dftype"),
      k<AdynamicequalizerOption>("tftype", "tftype"),
    ],
  },
} satisfies FilterDef<AdynamicequalizerOption>;

/** 宣言順が UI の表示順かつ ffmpeg のフィルタ適用順になる */
export const frequencyExtGroup = {
  bass,
  treble,
  bandreject,
  tiltshelf,
  allpass,
  asubboost,
  asubcut,
  asupercut,
  adynamicequalizer,
} satisfies Record<keyof FrequencyFilterExtOption, unknown>;
