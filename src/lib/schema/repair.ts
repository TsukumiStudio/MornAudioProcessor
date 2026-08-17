import type {
  AdeclickOption,
  AdeclipOption,
  AfwtdnOption,
  DeesserOption,
  RepairFilterOption,
} from "../types";
import type { FilterDef } from "./types";
import { fixed, k, kb, withUnit } from "./helpers";

/** add / save の 2 択（adeclick と adeclip で共通） */
const methodSelect = {
  control: "select",
  default: "add",
  options: [
    { value: "add", label: "add" },
    { value: "save", label: "save" },
  ],
} as const;

const adeclick = {
  label: "クリック除去",
  ffname: "adeclick",
  doc: "adeclick",
  params: {
    window: { control: "range", default: 55, min: 10, max: 100, step: 1, format: withUnit(" ms") },
    overlap: { control: "range", default: 75, min: 50, max: 95, step: 1, format: withUnit(" %") },
    arorder: { control: "range", default: 2, min: 0, max: 25, step: 1, format: withUnit(" %") },
    threshold: { control: "range", default: 2, min: 1, max: 100, step: 1 },
    burst: { control: "range", default: 2, min: 0, max: 10, step: 1, format: withUnit(" %") },
    method: methodSelect,
  },
  serialize: {
    name: "adeclick",
    args: [
      k<AdeclickOption>("window", "window"),
      k<AdeclickOption>("overlap", "overlap"),
      k<AdeclickOption>("arorder", "arorder"),
      k<AdeclickOption>("threshold", "threshold"),
      k<AdeclickOption>("burst", "burst"),
      k<AdeclickOption>("method", "method"),
    ],
  },
} satisfies FilterDef<AdeclickOption>;

const adeclip = {
  label: "クリップ除去",
  ffname: "adeclip",
  doc: "adeclip",
  params: {
    window: { control: "range", default: 55, min: 10, max: 100, step: 1, format: withUnit(" ms") },
    overlap: { control: "range", default: 75, min: 50, max: 95, step: 1, format: withUnit(" %") },
    arorder: { control: "range", default: 8, min: 0, max: 25, step: 1, format: withUnit(" %") },
    threshold: { control: "range", default: 10, min: 1, max: 100, step: 1 },
    hsize: { control: "number", default: 1000, min: 100, max: 9999, step: 1 },
    method: methodSelect,
  },
  serialize: {
    name: "adeclip",
    args: [
      k<AdeclipOption>("window", "window"),
      k<AdeclipOption>("overlap", "overlap"),
      k<AdeclipOption>("arorder", "arorder"),
      k<AdeclipOption>("threshold", "threshold"),
      k<AdeclipOption>("hsize", "hsize"),
      k<AdeclipOption>("method", "method"),
    ],
  },
} satisfies FilterDef<AdeclipOption>;

const afwtdn = {
  label: "ウェーブレットノイズ除去",
  ffname: "afwtdn",
  doc: "afwtdn",
  params: {
    sigma: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
    levels: { control: "number", default: 10, min: 1, max: 12, step: 1 },
    wavet: {
      control: "select",
      default: "sym2",
      options: [
        { value: "sym2", label: "sym2" },
        { value: "sym4", label: "sym4" },
        { value: "rbior68", label: "rbior68" },
        { value: "deb10", label: "deb10" },
        { value: "sym10", label: "sym10" },
        { value: "coif5", label: "coif5" },
        { value: "bl3", label: "bl3" },
      ],
    },
    percent: { control: "range", default: 85, min: 0, max: 100, step: 1, format: withUnit(" %") },
    profile: { control: "checkbox", default: false, desc: "noise profile" },
    adaptive: { control: "checkbox", default: false, desc: "adaptive mode" },
    samples: { control: "number", default: 8192, min: 512, max: 65536, step: 1 },
    softness: { control: "range", default: 1, min: 0, max: 10, step: 0.1, format: fixed(1) },
  },
  serialize: {
    name: "afwtdn",
    args: [
      k<AfwtdnOption>("sigma", "sigma"),
      k<AfwtdnOption>("levels", "levels"),
      k<AfwtdnOption>("wavet", "wavet"),
      k<AfwtdnOption>("percent", "percent"),
      kb<AfwtdnOption>("profile", "profile"),
      kb<AfwtdnOption>("adaptive", "adaptive"),
      k<AfwtdnOption>("samples", "samples"),
      k<AfwtdnOption>("softness", "softness"),
    ],
  },
} satisfies FilterDef<AfwtdnOption>;

const deesser = {
  label: "ディエッサー",
  ffname: "deesser",
  doc: "deesser",
  params: {
    i: { control: "range", default: 0, min: 0, max: 1, step: 0.01, format: fixed(2) },
    m: { control: "range", default: 0.5, min: 0, max: 1, step: 0.01, format: fixed(2) },
    f: { control: "range", default: 0.5, min: 0, max: 1, step: 0.01, format: fixed(2) },
    s: {
      control: "select",
      default: "i",
      options: [
        { value: "i", label: "i" },
        { value: "o", label: "o" },
        { value: "e", label: "e" },
      ],
    },
  },
  serialize: {
    name: "deesser",
    args: [
      k<DeesserOption>("i", "i"),
      k<DeesserOption>("m", "m"),
      k<DeesserOption>("f", "f"),
      k<DeesserOption>("s", "s"),
    ],
  },
} satisfies FilterDef<DeesserOption>;

/** 宣言順が UI の表示順かつ ffmpeg のフィルタ適用順になる */
export const repairGroup = {
  adeclick,
  adeclip,
  afwtdn,
  deesser,
} satisfies Record<keyof RepairFilterOption, unknown>;
