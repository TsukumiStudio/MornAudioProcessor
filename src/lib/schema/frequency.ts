import type {
  BandpassOption,
  EqualizerOption,
  FrequencyFilterOption,
  HighpassOption,
  LowpassOption,
} from "../types";
import type { FilterDef } from "./types";
import {
  fixed,
  k,
  kb,
  polesSelect,
  signedDb,
  widthTypeSelect,
} from "./helpers";

const equalizer = {
  label: "イコライザー",
  ffname: "equalizer",
  doc: "equalizer",
  params: {
    frequency: { control: "number", default: 1000, min: 1, max: 999999, step: 1, unit: "Hz" },
    width_type: widthTypeSelect("q"),
    width: { control: "number", default: 1, min: 0.01, max: 99999, step: 0.01 },
    gain: { control: "range", default: 0, min: -30, max: 30, step: 0.5, format: signedDb },
    mix: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "equalizer",
    args: [
      k<EqualizerOption>("f", "frequency"),
      k<EqualizerOption>("t", "width_type"),
      k<EqualizerOption>("w", "width"),
      k<EqualizerOption>("g", "gain"),
      k<EqualizerOption>("mix", "mix"),
    ],
  },
} satisfies FilterDef<EqualizerOption>;

const highpass = {
  label: "ハイパスフィルター",
  ffname: "highpass",
  doc: "highpass",
  params: {
    frequency: { control: "number", default: 200, min: 1, max: 999999, step: 1, unit: "Hz" },
    width_type: widthTypeSelect("q"),
    width: { control: "number", default: 0.707, min: 0.01, max: 99999, step: 0.01 },
    poles: polesSelect(2),
    mix: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "highpass",
    args: [
      k<HighpassOption>("f", "frequency"),
      k<HighpassOption>("t", "width_type"),
      k<HighpassOption>("w", "width"),
      k<HighpassOption>("p", "poles"),
      k<HighpassOption>("mix", "mix"),
    ],
  },
} satisfies FilterDef<HighpassOption>;

const lowpass = {
  label: "ローパスフィルター",
  ffname: "lowpass",
  doc: "lowpass",
  params: {
    frequency: { control: "number", default: 8000, min: 1, max: 999999, step: 1, unit: "Hz" },
    width_type: widthTypeSelect("q"),
    width: { control: "number", default: 0.707, min: 0.01, max: 99999, step: 0.01 },
    poles: polesSelect(2),
    mix: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
  },
  serialize: {
    name: "lowpass",
    args: [
      k<LowpassOption>("f", "frequency"),
      k<LowpassOption>("t", "width_type"),
      k<LowpassOption>("w", "width"),
      k<LowpassOption>("p", "poles"),
      k<LowpassOption>("mix", "mix"),
    ],
  },
} satisfies FilterDef<LowpassOption>;

const bandpass = {
  label: "バンドパスフィルター",
  ffname: "bandpass",
  doc: "bandpass",
  params: {
    frequency: { control: "number", default: 1000, min: 1, max: 999999, step: 1, unit: "Hz" },
    width_type: widthTypeSelect("q"),
    width: { control: "number", default: 0.5, min: 0.01, max: 99999, step: 0.01 },
    mix: { control: "range", default: 1, min: 0, max: 1, step: 0.01, format: fixed(2) },
    csg: { control: "checkbox", default: false, desc: "constant skirt gain" },
  },
  serialize: {
    name: "bandpass",
    args: [
      k<BandpassOption>("f", "frequency"),
      k<BandpassOption>("t", "width_type"),
      k<BandpassOption>("w", "width"),
      k<BandpassOption>("mix", "mix"),
      kb<BandpassOption>("csg", "csg"),
    ],
  },
} satisfies FilterDef<BandpassOption>;

/** 宣言順が UI の表示順かつ ffmpeg のフィルタ適用順になる */
export const frequencyGroup = {
  equalizer,
  highpass,
  lowpass,
  bandpass,
} satisfies Record<keyof FrequencyFilterOption, unknown>;
