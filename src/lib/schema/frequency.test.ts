import { describe, expect, it } from "vitest";
import { frequencyGroup } from "./frequency";
import { makeDefaults, serializeGroup, toStoreOption } from "./helpers";
import type { FilterDef } from "./types";
import type { FrequencyFilterOption } from "../types";

const group = frequencyGroup as unknown as Record<
  string,
  FilterDef<{ enabled: boolean }, never>
>;

/**
 * 移行前の FrequencySettings.svelte のリセットブロックから転記した期待値。
 * スキーマから作らず旧コードを写すことで、転記ミスを検出できる。
 */
const LEGACY_DEFAULTS: FrequencyFilterOption = {
  equalizer: {
    enabled: false,
    frequency: 1000,
    width_type: "q",
    width: 1,
    gain: 0,
    mix: 1,
  },
  highpass: {
    enabled: false,
    frequency: 200,
    width_type: "q",
    width: 0.707,
    poles: 2,
    mix: 1,
  },
  lowpass: {
    enabled: false,
    frequency: 8000,
    width_type: "q",
    width: 0.707,
    poles: 2,
    mix: 1,
  },
  bandpass: {
    enabled: false,
    frequency: 1000,
    width_type: "q",
    width: 0.5,
    mix: 1,
    csg: false,
  },
};

describe("frequency スキーマ", () => {
  it("デフォルト値が移行前のリセット値と一致する", () => {
    expect(makeDefaults<FrequencyFilterOption>(group)).toEqual(LEGACY_DEFAULTS);
  });

  it("パラメータの宣言順が UI 表示順・シリアライズ順と一致する", () => {
    expect(Object.keys(group)).toEqual([
      "equalizer",
      "highpass",
      "lowpass",
      "bandpass",
    ]);
    expect(Object.keys(group.equalizer.params)).toEqual([
      "frequency",
      "width_type",
      "width",
      "gain",
      "mix",
    ]);
  });

  it("全 disabled なら store には null を書く", () => {
    expect(toStoreOption(makeDefaults<FrequencyFilterOption>(group))).toBeNull();
  });

  it("1 つでも有効なら無効なサブフィルタも含む完全なオブジェクトになる", () => {
    const values = makeDefaults<FrequencyFilterOption>(group);
    values.equalizer.enabled = true;
    const stored = toStoreOption(values);
    expect(stored).not.toBeNull();
    expect(Object.keys(stored!)).toEqual([
      "equalizer",
      "highpass",
      "lowpass",
      "bandpass",
    ]);
    expect(stored!.highpass).toEqual(LEGACY_DEFAULTS.highpass);
  });

  it("store に入る値は素のオブジェクト（プロキシを漏らさない）", () => {
    const values = makeDefaults<FrequencyFilterOption>(group);
    values.bandpass.enabled = true;
    const stored = toStoreOption(values)!;
    expect(stored).not.toBe(values);
    expect(stored.bandpass).not.toBe(values.bandpass);
  });

  it("有効なサブフィルタだけを宣言順にシリアライズする", () => {
    const values = makeDefaults<FrequencyFilterOption>(group);
    values.lowpass.enabled = true;
    values.equalizer.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "equalizer=f=1000:t=q:w=1:g=0:mix=1",
      "lowpass=f=8000:t=q:w=0.707:p=2:mix=1",
    ]);
  });

  it("boolean は 1/0 に変換される", () => {
    const values = makeDefaults<FrequencyFilterOption>(group);
    values.bandpass.enabled = true;
    expect(serializeGroup(group, values)[0]).toContain(":csg=0");
    values.bandpass.csg = true;
    expect(serializeGroup(group, values)[0]).toContain(":csg=1");
  });

  it("値の文字列化に丸めを入れない（0.707 が 0.71 にならない）", () => {
    const values = makeDefaults<FrequencyFilterOption>(group);
    values.highpass.enabled = true;
    expect(serializeGroup(group, values)[0]).toContain("w=0.707");
  });

  it("store が null なら何もシリアライズしない", () => {
    expect(serializeGroup(group, null)).toEqual([]);
    expect(serializeGroup(group, undefined)).toEqual([]);
  });
});
