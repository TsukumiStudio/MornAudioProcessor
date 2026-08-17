import type {
  ApsyclipOption,
  AsoftclipOption,
  CompandOption,
  DynamicsFilterExtOption,
  DynaudnormOption,
  SpeechnormOption,
} from "../types";
import type { FilterDef } from "./types";
import { fixed, fixedWith, k, kb, plainSelect, signedDb } from "./helpers";


const dynaudnorm = {
  label: "ダイナミック正規化",
  ffname: "dynaudnorm",
  doc: "dynaudnorm",
  params: {
    framelen: { control: "number", default: 500, min: 10, max: 8000, step: 1 },
    gausssize: { control: "number", default: 31, min: 3, max: 301, step: 2 },
    peak: { control: "range", default: 0.95, min: 0, max: 1, step: 0.01, format: fixed(2) },
    maxgain: { control: "range", default: 10, min: 1, max: 100, step: 1 },
    targetrms: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
    coupling: { control: "checkbox", default: true, desc: "channel coupling" },
    correctdc: { control: "checkbox", default: false, desc: "DC correction" },
    altboundary: { control: "checkbox", default: false, desc: "alternative boundary" },
    compress: { control: "range", default: 0, min: 0, max: 30, step: 0.5, format: fixed(1) },
    threshold: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
    overlap: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "dynaudnorm",
    args: [
      k<DynaudnormOption>("framelen", "framelen"),
      k<DynaudnormOption>("gausssize", "gausssize"),
      k<DynaudnormOption>("peak", "peak"),
      k<DynaudnormOption>("maxgain", "maxgain"),
      k<DynaudnormOption>("targetrms", "targetrms"),
      kb<DynaudnormOption>("coupling", "coupling"),
      kb<DynaudnormOption>("correctdc", "correctdc"),
      kb<DynaudnormOption>("altboundary", "altboundary"),
      k<DynaudnormOption>("compress", "compress"),
      k<DynaudnormOption>("threshold", "threshold"),
      k<DynaudnormOption>("overlap", "overlap"),
    ],
  },
} satisfies FilterDef<DynaudnormOption>;

const speechnorm = {
  label: "スピーチ正規化",
  ffname: "speechnorm",
  doc: "speechnorm",
  params: {
    peak: { control: "range", default: 0.95, min: 0, max: 1, step: 0.01, format: fixed(2) },
    expansion: { control: "range", default: 2, min: 1, max: 50, step: 0.5, format: fixed(1) },
    compression: { control: "range", default: 2, min: 1, max: 50, step: 0.5, format: fixed(1) },
    threshold: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
    raise: { control: "range", default: 0.001, min: 0, max: 1, step: 0.001, format: fixed(3) },
    fall: { control: "range", default: 0.001, min: 0, max: 1, step: 0.001, format: fixed(3) },
    invert: { control: "checkbox", default: false, desc: "invert filtering" },
    link: { control: "checkbox", default: false, desc: "link channels" },
    rms: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "speechnorm",
    args: [
      k<SpeechnormOption>("peak", "peak"),
      k<SpeechnormOption>("expansion", "expansion"),
      k<SpeechnormOption>("compression", "compression"),
      k<SpeechnormOption>("threshold", "threshold"),
      k<SpeechnormOption>("raise", "raise"),
      k<SpeechnormOption>("fall", "fall"),
      kb<SpeechnormOption>("invert", "invert"),
      kb<SpeechnormOption>("link", "link"),
      k<SpeechnormOption>("rms", "rms"),
    ],
  },
} satisfies FilterDef<SpeechnormOption>;

const compand = {
  label: "コンパンド",
  ffname: "compand",
  doc: "compand",
  params: {
    // attacks / decays / points は `|` `/` 区切りの文字列をそのまま渡す
    attacks: { control: "text", default: "0" },
    decays: { control: "text", default: "0.8" },
    points: { control: "text", default: "-70/-70|-60/-20|1/0" },
    soft_knee: { control: "range", default: 0.01, min: 0, max: 1, step: 0.001, format: fixed(3) },
    gain: { control: "range", default: 0, min: -30, max: 30, step: 0.5, format: signedDb },
    volume: { control: "range", default: 0, min: -30, max: 30, step: 0.5, format: signedDb },
    delay: { control: "range", default: 0, min: 0, max: 5, step: 0.01, format: fixedWith(2, " sec") },
  },
  serialize: {
    name: "compand",
    args: [
      k<CompandOption>("attacks", "attacks"),
      k<CompandOption>("decays", "decays"),
      k<CompandOption>("points", "points"),
      // ffmpeg 側のキーはハイフン付き、store のフィールド名はアンダースコア
      k<CompandOption>("soft-knee", "soft_knee"),
      k<CompandOption>("gain", "gain"),
      k<CompandOption>("volume", "volume"),
      k<CompandOption>("delay", "delay"),
    ],
  },
} satisfies FilterDef<CompandOption>;

const asoftclip = {
  label: "ソフトクリップ",
  ffname: "asoftclip",
  doc: "asoftclip",
  params: {
    type: plainSelect<AsoftclipOption["type"]>("hard", [
      "hard",
      "tanh",
      "atan",
      "cubic",
      "exp",
      "alg",
      "quintic",
      "sin",
      "erf",
    ]),
    threshold: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    output: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    param: { control: "range", default: 1, min: 0, max: 10, step: 0.01, format: fixed(2) },
    oversample: { control: "range", default: 1, min: 1, max: 64, step: 1 },
  },
  serialize: {
    name: "asoftclip",
    args: [
      k<AsoftclipOption>("type", "type"),
      k<AsoftclipOption>("threshold", "threshold"),
      k<AsoftclipOption>("output", "output"),
      k<AsoftclipOption>("param", "param"),
      k<AsoftclipOption>("oversample", "oversample"),
    ],
  },
} satisfies FilterDef<AsoftclipOption>;

const apsyclip = {
  label: "サイコアコースティッククリップ",
  ffname: "apsyclip",
  doc: "apsyclip",
  params: {
    level_in: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    level_out: { control: "range", default: 1, min: 0.015625, max: 64, step: 0.01, format: fixed(2) },
    clip: { control: "range", default: 1, min: 0, max: 2, step: 0.01, format: fixed(2) },
    diff: { control: "checkbox", default: false, desc: "output difference" },
    adaptive: { control: "range", default: 0.5, min: 0, max: 1, step: 0.01, format: fixed(2) },
    iterations: { control: "number", default: 10, min: 1, max: 20, step: 1 },
    level: { control: "checkbox", default: false, desc: "auto level" },
  },
  serialize: {
    name: "apsyclip",
    args: [
      k<ApsyclipOption>("level_in", "level_in"),
      k<ApsyclipOption>("level_out", "level_out"),
      k<ApsyclipOption>("clip", "clip"),
      kb<ApsyclipOption>("diff", "diff"),
      k<ApsyclipOption>("adaptive", "adaptive"),
      k<ApsyclipOption>("iterations", "iterations"),
      kb<ApsyclipOption>("level", "level"),
    ],
  },
} satisfies FilterDef<ApsyclipOption>;

/** 宣言順が UI の表示順かつ ffmpeg のフィルタ適用順になる */
export const dynamicsExtGroup = {
  dynaudnorm,
  speechnorm,
  compand,
  asoftclip,
  apsyclip,
} satisfies Record<keyof DynamicsFilterExtOption, unknown>;
