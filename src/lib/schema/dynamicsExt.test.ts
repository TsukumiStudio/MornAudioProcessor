import { describe, expect, it } from "vitest";
import { dynamicsExtGroup } from "./dynamicsExt";
import { makeDefaults, serializeGroup, toStoreOption } from "./helpers";
import type { FilterDef } from "./types";
import type { DynamicsFilterExtOption } from "../types";

const group = dynamicsExtGroup as unknown as Record<
  string,
  FilterDef<{ enabled: boolean }, never>
>;

/**
 * 移行前の DynamicsSettingsExt.svelte のリセットブロックから転記した期待値。
 * スキーマから作らず旧コードを写すことで、転記ミスを検出できる。
 */
const LEGACY_DEFAULTS: DynamicsFilterExtOption = {
  dynaudnorm: {
    enabled: false,
    framelen: 500,
    gausssize: 31,
    peak: 0.95,
    maxgain: 10,
    targetrms: 0,
    coupling: true,
    correctdc: false,
    altboundary: false,
    compress: 0,
    threshold: 0,
    overlap: 0,
  },
  speechnorm: {
    enabled: false,
    peak: 0.95,
    expansion: 2,
    compression: 2,
    threshold: 0,
    raise: 0.001,
    fall: 0.001,
    invert: false,
    link: false,
    rms: 0,
  },
  compand: {
    enabled: false,
    attacks: "0",
    decays: "0.8",
    points: "-70/-70|-60/-20|1/0",
    soft_knee: 0.01,
    gain: 0,
    volume: 0,
    delay: 0,
  },
  asoftclip: {
    enabled: false,
    type: "hard",
    threshold: 1,
    output: 1,
    param: 1,
    oversample: 1,
  },
  apsyclip: {
    enabled: false,
    level_in: 1,
    level_out: 1,
    clip: 1,
    diff: false,
    adaptive: 0.5,
    iterations: 10,
    level: false,
  },
};

describe("dynamicsExt スキーマ", () => {
  it("デフォルト値が移行前のリセット値と一致する", () => {
    expect(makeDefaults<DynamicsFilterExtOption>(group)).toEqual(LEGACY_DEFAULTS);
  });

  it("パラメータの宣言順が UI 表示順・シリアライズ順と一致する", () => {
    expect(Object.keys(group)).toEqual([
      "dynaudnorm",
      "speechnorm",
      "compand",
      "asoftclip",
      "apsyclip",
    ]);
    expect(Object.keys(group.apsyclip.params)).toEqual([
      "level_in",
      "level_out",
      "clip",
      "diff",
      "adaptive",
      "iterations",
      "level",
    ]);
  });

  it("全 disabled なら store には null を書く", () => {
    expect(
      toStoreOption(makeDefaults<DynamicsFilterExtOption>(group)),
    ).toBeNull();
  });

  it("1 つでも有効なら無効なサブフィルタも含む完全なオブジェクトになる", () => {
    const values = makeDefaults<DynamicsFilterExtOption>(group);
    values.compand.enabled = true;
    const stored = toStoreOption(values);
    expect(stored).not.toBeNull();
    expect(Object.keys(stored!)).toEqual([
      "dynaudnorm",
      "speechnorm",
      "compand",
      "asoftclip",
      "apsyclip",
    ]);
    expect(stored!.speechnorm).toEqual(LEGACY_DEFAULTS.speechnorm);
  });

  it("有効なサブフィルタだけを宣言順にシリアライズする", () => {
    const values = makeDefaults<DynamicsFilterExtOption>(group);
    values.asoftclip.enabled = true;
    values.dynaudnorm.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "dynaudnorm=framelen=500:gausssize=31:peak=0.95:maxgain=10:targetrms=0:coupling=1:correctdc=0:altboundary=0:compress=0:threshold=0:overlap=0",
      "asoftclip=type=hard:threshold=1:output=1:param=1:oversample=1",
    ]);
  });

  it("compand の soft_knee はハイフン付きの soft-knee キーで出る", () => {
    const values = makeDefaults<DynamicsFilterExtOption>(group);
    values.compand.enabled = true;
    expect(serializeGroup(group, values)[0]).toBe(
      "compand=attacks=0:decays=0.8:points=-70/-70|-60/-20|1/0:soft-knee=0.01:gain=0:volume=0:delay=0",
    );
  });

  it("文字列パラメータは加工されずそのまま出る", () => {
    const values = makeDefaults<DynamicsFilterExtOption>(group);
    values.compand.enabled = true;
    values.compand.points = "-80/-80|-50/-30|0/-10";
    values.compand.attacks = "0.3|0.3";
    expect(serializeGroup(group, values)[0]).toContain("attacks=0.3|0.3");
    expect(serializeGroup(group, values)[0]).toContain(
      "points=-80/-80|-50/-30|0/-10",
    );
  });

  it("boolean は 1/0 に変換される", () => {
    const values = makeDefaults<DynamicsFilterExtOption>(group);
    values.speechnorm.enabled = true;
    values.apsyclip.enabled = true;
    const [sn, apc] = serializeGroup(group, values);
    expect(sn).toContain(":invert=0:link=0:");
    expect(apc).toContain(":diff=0:");
    expect(apc).toContain(":level=0");
    values.speechnorm.invert = true;
    values.speechnorm.link = true;
    values.apsyclip.diff = true;
    values.apsyclip.level = true;
    const [sn2, apc2] = serializeGroup(group, values);
    expect(sn2).toContain(":invert=1:link=1:");
    expect(apc2).toContain(":diff=1:");
    expect(apc2).toContain(":level=1");
  });

  it("adaptive は boolean ではなく数値として出る", () => {
    const values = makeDefaults<DynamicsFilterExtOption>(group);
    values.apsyclip.enabled = true;
    expect(serializeGroup(group, values)[0]).toContain(":adaptive=0.5:");
  });

  it("store が null なら何もシリアライズしない", () => {
    expect(serializeGroup(group, null)).toEqual([]);
    expect(serializeGroup(group, undefined)).toEqual([]);
  });
});
