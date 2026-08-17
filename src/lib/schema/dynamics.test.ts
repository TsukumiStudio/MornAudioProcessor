import { describe, expect, it } from "vitest";
import { dynamicsGroup, thresholdToDb } from "./dynamics";
import { makeDefaults, serializeGroup, toStoreOption } from "./helpers";
import type { FilterDef } from "./types";
import type { DynamicsFilterOption } from "../types";

const group = dynamicsGroup as unknown as Record<
  string,
  FilterDef<{ enabled: boolean }, never>
>;

/**
 * 移行前の DynamicsSettings.svelte のリセットブロックから転記した期待値。
 * スキーマから作らず旧コードを写すことで、転記ミスを検出できる。
 */
const LEGACY_DEFAULTS: DynamicsFilterOption = {
  compressor: {
    enabled: false,
    threshold: 0.125,
    ratio: 2,
    attack: 20,
    release: 250,
    makeup: 1,
    knee: 2.828,
    mode: "downward",
    detection: "rms",
    link: "average",
    mix: 1,
    level_in: 1,
  },
  limiter: {
    enabled: false,
    limit: 1.0,
    attack: 5,
    release: 50,
    level: false,
    level_in: 1,
    level_out: 1,
    asc: false,
    asc_level: 0.5,
  },
  gate: {
    enabled: false,
    threshold: 0.125,
    ratio: 2,
    range: 0.06125,
    attack: 20,
    release: 250,
    makeup: 1,
    knee: 2.828,
    mode: "downward",
    detection: "rms",
    link: "average",
  },
};

describe("dynamics スキーマ", () => {
  it("デフォルト値が移行前のリセット値と一致する", () => {
    expect(makeDefaults<DynamicsFilterOption>(group)).toEqual(LEGACY_DEFAULTS);
  });

  it("パラメータの宣言順が UI 表示順・シリアライズ順と一致する", () => {
    expect(Object.keys(group)).toEqual(["compressor", "limiter", "gate"]);
    expect(Object.keys(group.compressor.params)).toEqual([
      "threshold",
      "ratio",
      "attack",
      "release",
      "makeup",
      "knee",
      "mode",
      "detection",
      "link",
      "mix",
      "level_in",
    ]);
    expect(Object.keys(group.limiter.params)).toEqual([
      "limit",
      "attack",
      "release",
      "level",
      "level_in",
      "level_out",
      "asc",
      "asc_level",
    ]);
    expect(Object.keys(group.gate.params)).toEqual([
      "threshold",
      "ratio",
      "range",
      "attack",
      "release",
      "makeup",
      "knee",
      "mode",
      "detection",
      "link",
    ]);
  });

  it("全 disabled なら store には null を書く", () => {
    expect(toStoreOption(makeDefaults<DynamicsFilterOption>(group))).toBeNull();
  });

  it("1 つでも有効なら無効なサブフィルタも含む完全なオブジェクトになる", () => {
    const values = makeDefaults<DynamicsFilterOption>(group);
    values.compressor.enabled = true;
    const stored = toStoreOption(values);
    expect(stored).not.toBeNull();
    expect(Object.keys(stored!)).toEqual(["compressor", "limiter", "gate"]);
    expect(stored!.limiter).toEqual(LEGACY_DEFAULTS.limiter);
  });

  it("store に入る値は素のオブジェクト（プロキシを漏らさない）", () => {
    const values = makeDefaults<DynamicsFilterOption>(group);
    values.gate.enabled = true;
    const stored = toStoreOption(values)!;
    expect(stored).not.toBe(values);
    expect(stored.gate).not.toBe(values.gate);
  });

  it("有効なサブフィルタだけを宣言順にシリアライズする", () => {
    const values = makeDefaults<DynamicsFilterOption>(group);
    values.gate.enabled = true;
    values.compressor.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "acompressor=threshold=0.125:ratio=2:attack=20:release=250:makeup=1:knee=2.828:mode=downward:detection=rms:link=average:mix=1:level_in=1",
      "agate=threshold=0.125:ratio=2:range=0.06125:attack=20:release=250:makeup=1:knee=2.828:mode=downward:detection=rms:link=average",
    ]);
  });

  it("boolean は 1/0 に変換される（limiter の level / asc）", () => {
    const values = makeDefaults<DynamicsFilterOption>(group);
    values.limiter.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "alimiter=limit=1:attack=5:release=50:level=0:level_in=1:level_out=1:asc=0:asc_level=0.5",
    ]);
    values.limiter.level = true;
    values.limiter.asc = true;
    expect(serializeGroup(group, values)[0]).toBe(
      "alimiter=limit=1:attack=5:release=50:level=1:level_in=1:level_out=1:asc=1:asc_level=0.5",
    );
  });

  it("値の文字列化に丸めを入れない（0.06125 が 0.061 にならない）", () => {
    const values = makeDefaults<DynamicsFilterOption>(group);
    values.gate.enabled = true;
    expect(serializeGroup(group, values)[0]).toContain("range=0.06125");
  });

  it("store が null なら何もシリアライズしない", () => {
    expect(serializeGroup(group, null)).toEqual([]);
    expect(serializeGroup(group, undefined)).toEqual([]);
  });

  it("thresholdToDb は 0 以下で -inf を返す", () => {
    expect(thresholdToDb(0)).toBe("-inf");
    expect(thresholdToDb(-1)).toBe("-inf");
    expect(thresholdToDb(1)).toBe("0.0");
    expect(thresholdToDb(0.125)).toBe("-18.1");
  });
});
