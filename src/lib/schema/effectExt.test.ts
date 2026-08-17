import { describe, expect, it } from "vitest";
import { effectExtGroup } from "./effectExt";
import { makeDefaults, serializeGroup, toStoreOption } from "./helpers";
import type { FilterDef } from "./types";
import type { EffectFilterExtOption } from "../types";

const group = effectExtGroup as unknown as Record<
  string,
  FilterDef<{ enabled: boolean }, never>
>;

/**
 * 移行前の EffectSettingsExt.svelte のリセットブロックから転記した期待値。
 * スキーマから作らず旧コードを写すことで、転記ミスを検出できる。
 */
const LEGACY_DEFAULTS: EffectFilterExtOption = {
  afade_in: {
    enabled: false,
    type: "in",
    start_time: 0,
    duration: 0,
    curve: "tri",
    silence: 0,
    unity: 1,
  },
  afade_out: {
    enabled: false,
    type: "out",
    start_time: 0,
    duration: 0,
    curve: "tri",
    silence: 0,
    unity: 1,
  },
  acrusher: {
    enabled: false,
    level_in: 1,
    level_out: 1,
    bits: 8,
    mix: 0.5,
    mode: "lin",
    dc: 1,
    aa: 0.5,
    samples: 1,
    lfo: false,
    lforange: 20,
    lforate: 0.3,
  },
  aexciter: {
    enabled: false,
    level_in: 1,
    level_out: 1,
    amount: 1,
    drive: 8.5,
    blend: 0,
    freq: 7500,
    ceil: 9999,
    listen: false,
  },
  crystalizer: {
    enabled: false,
    i: 2,
    c: true,
  },
  areverse: {
    enabled: false,
  },
  aloop: {
    enabled: false,
    loop: 0,
    size: 0,
    start: 0,
  },
  afreqshift: {
    enabled: false,
    shift: 0,
    level: 1,
    order: 8,
  },
  apulsator: {
    enabled: false,
    level_in: 1,
    level_out: 1,
    mode: "sine",
    amount: 1,
    offset_l: 0,
    offset_r: 0.5,
    width: 1,
    timing: "bpm",
    bpm: 120,
    ms: 500,
    hz: 2,
  },
  adelay: {
    enabled: false,
    delays: "0",
    all: false,
  },
  compensationdelay: {
    enabled: false,
    mm: 0,
    cm: 0,
    m: 0,
    dry: 0,
    wet: 1,
    temp: 20,
  },
  dcshift: {
    enabled: false,
    shift: 0,
    limitergain: 0,
  },
  apad: {
    enabled: false,
    pad_dur: 0,
    whole_dur: 0,
  },
};

describe("effectExt スキーマ", () => {
  it("デフォルト値が移行前のリセット値と一致する", () => {
    expect(makeDefaults<EffectFilterExtOption>(group)).toEqual(LEGACY_DEFAULTS);
  });

  it("afade の type は UI に出さず fixed として store に載る", () => {
    const values = makeDefaults<EffectFilterExtOption>(group);
    expect(values.afade_in.type).toBe("in");
    expect(values.afade_out.type).toBe("out");
    expect(Object.keys(group.afade_in.params)).toEqual([
      "start_time",
      "duration",
      "curve",
      "silence",
      "unity",
    ]);
  });

  it("パラメータの宣言順が UI 表示順・シリアライズ順と一致する", () => {
    expect(Object.keys(group)).toEqual([
      "afade_in",
      "afade_out",
      "acrusher",
      "aexciter",
      "crystalizer",
      "areverse",
      "aloop",
      "afreqshift",
      "apulsator",
      "adelay",
      "compensationdelay",
      "dcshift",
      "apad",
    ]);
  });

  it("全 disabled なら store には null を書く", () => {
    expect(
      toStoreOption(makeDefaults<EffectFilterExtOption>(group)),
    ).toBeNull();
  });

  it("1 つでも有効なら無効なサブフィルタも含む完全なオブジェクトになる", () => {
    const values = makeDefaults<EffectFilterExtOption>(group);
    values.areverse.enabled = true;
    const stored = toStoreOption(values);
    expect(stored).not.toBeNull();
    expect(Object.keys(stored!)).toEqual(Object.keys(LEGACY_DEFAULTS));
    expect(stored!.afade_in).toEqual(LEGACY_DEFAULTS.afade_in);
  });

  it("afade は t=in / t=out の固定リテラルと st / d のキー名変換で出る", () => {
    const values = makeDefaults<EffectFilterExtOption>(group);
    values.afade_in.enabled = true;
    values.afade_in.start_time = 1.5;
    values.afade_in.duration = 3;
    values.afade_out.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "afade=t=in:st=1.5:d=3:curve=tri:silence=0:unity=1",
      "afade=t=out:st=0:d=0:curve=tri:silence=0:unity=1",
    ]);
  });

  it("areverse はパラメータなしなので裸名で出る", () => {
    const values = makeDefaults<EffectFilterExtOption>(group);
    values.areverse.enabled = true;
    expect(serializeGroup(group, values)).toEqual(["areverse"]);
  });

  it("adelay は delays が位置引数、all が 1/0 の key=value になる", () => {
    const values = makeDefaults<EffectFilterExtOption>(group);
    values.adelay.enabled = true;
    values.adelay.delays = "1500|0|500";
    expect(serializeGroup(group, values)).toEqual(["adelay=1500|0|500:all=0"]);
    values.adelay.all = true;
    expect(serializeGroup(group, values)).toEqual(["adelay=1500|0|500:all=1"]);
  });

  it("boolean は 1/0 に変換される", () => {
    const values = makeDefaults<EffectFilterExtOption>(group);
    values.crystalizer.enabled = true;
    expect(serializeGroup(group, values)).toEqual(["crystalizer=i=2:c=1"]);
    values.crystalizer.c = false;
    expect(serializeGroup(group, values)).toEqual(["crystalizer=i=2:c=0"]);
  });

  it("store が null なら何もシリアライズしない", () => {
    expect(serializeGroup(group, null)).toEqual([]);
    expect(serializeGroup(group, undefined)).toEqual([]);
  });
});
