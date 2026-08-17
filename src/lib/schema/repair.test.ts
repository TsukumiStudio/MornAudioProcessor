import { describe, expect, it } from "vitest";
import { repairGroup } from "./repair";
import { makeDefaults, serializeGroup, toStoreOption } from "./helpers";
import type { FilterDef } from "./types";
import type { RepairFilterOption } from "../types";

const group = repairGroup as unknown as Record<
  string,
  FilterDef<{ enabled: boolean }, never>
>;

/**
 * 移行前の RepairSettings.svelte のリセットブロックから転記した期待値。
 * スキーマから作らず旧コードを写すことで、転記ミスを検出できる。
 */
const LEGACY_DEFAULTS: RepairFilterOption = {
  adeclick: {
    enabled: false,
    window: 55,
    overlap: 75,
    arorder: 2,
    threshold: 2,
    burst: 2,
    method: "add",
  },
  adeclip: {
    enabled: false,
    window: 55,
    overlap: 75,
    arorder: 8,
    threshold: 10,
    hsize: 1000,
    method: "add",
  },
  afwtdn: {
    enabled: false,
    sigma: 0,
    levels: 10,
    wavet: "sym2",
    percent: 85,
    profile: false,
    adaptive: false,
    samples: 8192,
    softness: 1,
  },
  deesser: {
    enabled: false,
    i: 0,
    m: 0.5,
    f: 0.5,
    s: "i",
  },
};

describe("repair スキーマ", () => {
  it("デフォルト値が移行前のリセット値と一致する", () => {
    expect(makeDefaults<RepairFilterOption>(group)).toEqual(LEGACY_DEFAULTS);
  });

  it("パラメータの宣言順が UI 表示順・シリアライズ順と一致する", () => {
    expect(Object.keys(group)).toEqual([
      "adeclick",
      "adeclip",
      "afwtdn",
      "deesser",
    ]);
    expect(Object.keys(group.adeclick.params)).toEqual([
      "window",
      "overlap",
      "arorder",
      "threshold",
      "burst",
      "method",
    ]);
    expect(Object.keys(group.afwtdn.params)).toEqual([
      "sigma",
      "levels",
      "wavet",
      "percent",
      "profile",
      "adaptive",
      "samples",
      "softness",
    ]);
  });

  it("全 disabled なら store には null を書く", () => {
    expect(toStoreOption(makeDefaults<RepairFilterOption>(group))).toBeNull();
  });

  it("1 つでも有効なら無効なサブフィルタも含む完全なオブジェクトになる", () => {
    const values = makeDefaults<RepairFilterOption>(group);
    values.adeclick.enabled = true;
    const stored = toStoreOption(values);
    expect(stored).not.toBeNull();
    expect(Object.keys(stored!)).toEqual([
      "adeclick",
      "adeclip",
      "afwtdn",
      "deesser",
    ]);
    expect(stored!.deesser).toEqual(LEGACY_DEFAULTS.deesser);
  });

  it("store に入る値は素のオブジェクト（プロキシを漏らさない）", () => {
    const values = makeDefaults<RepairFilterOption>(group);
    values.deesser.enabled = true;
    const stored = toStoreOption(values)!;
    expect(stored).not.toBe(values);
    expect(stored.deesser).not.toBe(values.deesser);
  });

  it("有効なサブフィルタだけを宣言順にシリアライズする", () => {
    const values = makeDefaults<RepairFilterOption>(group);
    values.deesser.enabled = true;
    values.adeclip.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "adeclip=window=55:overlap=75:arorder=8:threshold=10:hsize=1000:method=add",
      "deesser=i=0:m=0.5:f=0.5:s=i",
    ]);
  });

  it("boolean は 1/0 に変換される", () => {
    const values = makeDefaults<RepairFilterOption>(group);
    values.afwtdn.enabled = true;
    expect(serializeGroup(group, values)[0]).toContain(":profile=0:adaptive=0:");
    values.afwtdn.profile = true;
    values.afwtdn.adaptive = true;
    expect(serializeGroup(group, values)[0]).toContain(":profile=1:adaptive=1:");
  });

  it("値の文字列化に丸めを入れない（softness の 1 が 1.0 にならない）", () => {
    const values = makeDefaults<RepairFilterOption>(group);
    values.afwtdn.enabled = true;
    expect(serializeGroup(group, values)[0]).toContain("sigma=0:");
    expect(serializeGroup(group, values)[0]).toContain("softness=1");
  });

  it("store が null なら何もシリアライズしない", () => {
    expect(serializeGroup(group, null)).toEqual([]);
    expect(serializeGroup(group, undefined)).toEqual([]);
  });
});
