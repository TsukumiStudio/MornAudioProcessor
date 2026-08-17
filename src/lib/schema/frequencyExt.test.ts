import { describe, expect, it } from "vitest";
import { frequencyExtGroup } from "./frequencyExt";
import { makeDefaults, serializeGroup, toStoreOption } from "./helpers";
import type { FilterDef } from "./types";
import type { FrequencyFilterExtOption } from "../types";

const group = frequencyExtGroup as unknown as Record<
  string,
  FilterDef<{ enabled: boolean }, never>
>;

/**
 * 移行前の FrequencySettingsExt.svelte のリセットブロックから転記した期待値。
 * スキーマから作らず旧コードを写すことで、転記ミスを検出できる。
 */
const LEGACY_DEFAULTS: FrequencyFilterExtOption = {
  bass: {
    enabled: false,
    gain: 0,
    frequency: 100,
    width_type: "h",
    width: 80,
    poles: 2,
    mix: 1,
  },
  treble: {
    enabled: false,
    gain: 0,
    frequency: 3000,
    width_type: "h",
    width: 500,
    poles: 2,
    mix: 1,
  },
  bandreject: {
    enabled: false,
    frequency: 1000,
    width_type: "q",
    width: 1,
    mix: 1,
  },
  tiltshelf: {
    enabled: false,
    gain: 0,
    frequency: 1000,
    width_type: "h",
    width: 500,
    poles: 2,
    mix: 1,
  },
  allpass: {
    enabled: false,
    frequency: 1000,
    width_type: "q",
    width: 0.707,
    mix: 1,
    order: 2,
  },
  asubboost: {
    enabled: false,
    dry: 1,
    wet: 1,
    boost: 2,
    decay: 0,
    feedback: 0.9,
    cutoff: 100,
    slope: 0.5,
    delay: 20,
  },
  asubcut: {
    enabled: false,
    cutoff: 20,
    order: 10,
    level: 1,
  },
  asupercut: {
    enabled: false,
    cutoff: 20000,
    order: 10,
    level: 1,
  },
  adynamicequalizer: {
    enabled: false,
    threshold: 0,
    dfrequency: 1000,
    dqfactor: 1,
    tfrequency: 1000,
    tqfactor: 1,
    attack: 20,
    release: 200,
    ratio: 1,
    makeup: 0,
    range: 50,
    mode: "cutbelow",
    dftype: "bandpass",
    tftype: "bell",
  },
};

const FILTER_IDS = [
  "bass",
  "treble",
  "bandreject",
  "tiltshelf",
  "allpass",
  "asubboost",
  "asubcut",
  "asupercut",
  "adynamicequalizer",
];

describe("frequencyExt スキーマ", () => {
  it("デフォルト値が移行前のリセット値と一致する", () => {
    expect(makeDefaults<FrequencyFilterExtOption>(group)).toEqual(
      LEGACY_DEFAULTS,
    );
  });

  it("パラメータの宣言順が UI 表示順・シリアライズ順と一致する", () => {
    expect(Object.keys(group)).toEqual(FILTER_IDS);
    expect(Object.keys(group.bass.params)).toEqual([
      "gain",
      "frequency",
      "width_type",
      "width",
      "poles",
      "mix",
    ]);
    expect(Object.keys(group.allpass.params)).toEqual([
      "frequency",
      "width_type",
      "width",
      "mix",
      "order",
    ]);
  });

  it("全 disabled なら store には null を書く", () => {
    expect(
      toStoreOption(makeDefaults<FrequencyFilterExtOption>(group)),
    ).toBeNull();
  });

  it("1 つでも有効なら無効なサブフィルタも含む完全なオブジェクトになる", () => {
    const values = makeDefaults<FrequencyFilterExtOption>(group);
    values.bass.enabled = true;
    const stored = toStoreOption(values);
    expect(stored).not.toBeNull();
    expect(Object.keys(stored!)).toEqual(FILTER_IDS);
    expect(stored!.asubboost).toEqual(LEGACY_DEFAULTS.asubboost);
  });

  it("store に入る値は素のオブジェクト（プロキシを漏らさない）", () => {
    const values = makeDefaults<FrequencyFilterExtOption>(group);
    values.treble.enabled = true;
    const stored = toStoreOption(values)!;
    expect(stored).not.toBe(values);
    expect(stored.treble).not.toBe(values.treble);
  });

  it("短縮キー（g/f/t/w/p/m）で bass/treble/tiltshelf をシリアライズする", () => {
    const values = makeDefaults<FrequencyFilterExtOption>(group);
    values.bass.enabled = true;
    values.treble.enabled = true;
    values.tiltshelf.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "bass=g=0:f=100:t=h:w=80:p=2:m=1",
      "treble=g=0:f=3000:t=h:w=500:p=2:m=1",
      "tiltshelf=g=0:f=1000:t=h:w=500:p=2:m=1",
    ]);
  });

  it("bandreject は f/t/w/m、allpass は f/t/w/m/o の順になる", () => {
    const values = makeDefaults<FrequencyFilterExtOption>(group);
    values.bandreject.enabled = true;
    values.allpass.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "bandreject=f=1000:t=q:w=1:m=1",
      "allpass=f=1000:t=q:w=0.707:m=1:o=2",
    ]);
  });

  it("asubboost 系は長いキー名のままシリアライズする", () => {
    const values = makeDefaults<FrequencyFilterExtOption>(group);
    values.asubboost.enabled = true;
    values.asubcut.enabled = true;
    values.asupercut.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "asubboost=dry=1:wet=1:boost=2:decay=0:feedback=0.9:cutoff=100:slope=0.5:delay=20",
      "asubcut=cutoff=20:order=10:level=1",
      "asupercut=cutoff=20000:order=10:level=1",
    ]);
  });

  it("adynamicequalizer は 13 パラメータを宣言順に並べる", () => {
    const values = makeDefaults<FrequencyFilterExtOption>(group);
    values.adynamicequalizer.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "adynamicequalizer=threshold=0:dfrequency=1000:dqfactor=1:tfrequency=1000:tqfactor=1:attack=20:release=200:ratio=1:makeup=0:range=50:mode=cutbelow:dftype=bandpass:tftype=bell",
    ]);
  });

  it("有効なサブフィルタだけを宣言順にシリアライズする", () => {
    const values = makeDefaults<FrequencyFilterExtOption>(group);
    values.asubcut.enabled = true;
    values.bass.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "bass=g=0:f=100:t=h:w=80:p=2:m=1",
      "asubcut=cutoff=20:order=10:level=1",
    ]);
  });

  it("値の文字列化に丸めを入れない（0.707 が 0.71 にならない）", () => {
    const values = makeDefaults<FrequencyFilterExtOption>(group);
    values.allpass.enabled = true;
    expect(serializeGroup(group, values)[0]).toContain("w=0.707");
  });

  it("store が null なら何もシリアライズしない", () => {
    expect(serializeGroup(group, null)).toEqual([]);
    expect(serializeGroup(group, undefined)).toEqual([]);
  });
});
