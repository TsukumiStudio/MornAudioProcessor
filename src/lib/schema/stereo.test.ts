import { describe, expect, it } from "vitest";
import { stereoGroup } from "./stereo";
import { makeDefaults, serializeGroup, toStoreOption } from "./helpers";
import type { FilterDef } from "./types";
import type { StereoFilterOption } from "../types";

const group = stereoGroup as unknown as Record<
  string,
  FilterDef<{ enabled: boolean }, never>
>;

/**
 * 移行前の StereoSettings.svelte のリセットブロックから転記した期待値。
 * スキーマから作らず旧コードを写すことで、転記ミスを検出できる。
 */
const LEGACY_DEFAULTS: StereoFilterOption = {
  stereotools: {
    enabled: false,
    level_in: 1,
    level_out: 1,
    balance_in: 0,
    balance_out: 0,
    softclip: false,
    mutel: false,
    muter: false,
    phasel: false,
    phaser: false,
    mode: "lr>lr",
    slev: 1,
    sbal: 0,
    mlev: 1,
    mpan: 0,
    base: 0,
    delay: 0,
    sclevel: 1,
    phase: 0,
    bmode_in: "balance",
    bmode_out: "balance",
  },
  stereowiden: {
    enabled: false,
    delay: 20,
    feedback: 0.3,
    crossfeed: 0.3,
    drymix: 0.8,
  },
  extrastereo: {
    enabled: false,
    m: 2.5,
    c: true,
  },
  crossfeed: {
    enabled: false,
    strength: 0.2,
    range: 0.5,
    slope: 0.5,
    level_in: 0.9,
    level_out: 1,
  },
  haas: {
    enabled: false,
    level_in: 1,
    level_out: 1,
    side_gain: 1,
    middle_source: "left",
    middle_phase: false,
    left_delay: 2.05,
    left_balance: -1,
    left_gain: 1,
    left_phase: false,
    right_delay: 2.12,
    right_balance: 1,
    right_gain: 1,
    right_phase: true,
  },
  dialoguenhance: {
    enabled: false,
    original: 1,
    enhance: 1,
    voice: 2,
  },
};

describe("stereo スキーマ", () => {
  it("デフォルト値が移行前のリセット値と一致する", () => {
    expect(makeDefaults<StereoFilterOption>(group)).toEqual(LEGACY_DEFAULTS);
  });

  it("パラメータの宣言順が UI 表示順・シリアライズ順と一致する", () => {
    expect(Object.keys(group)).toEqual([
      "stereotools",
      "stereowiden",
      "extrastereo",
      "crossfeed",
      "haas",
      "dialoguenhance",
    ]);
    expect(Object.keys(group.stereotools.params)).toEqual([
      "level_in",
      "level_out",
      "balance_in",
      "balance_out",
      "softclip",
      "mutel",
      "muter",
      "phasel",
      "phaser",
      "mode",
      "slev",
      "sbal",
      "mlev",
      "mpan",
      "base",
      "delay",
      "sclevel",
      "phase",
      "bmode_in",
      "bmode_out",
    ]);
    expect(Object.keys(group.haas.params)).toEqual([
      "level_in",
      "level_out",
      "side_gain",
      "middle_source",
      "middle_phase",
      "left_delay",
      "left_balance",
      "left_gain",
      "left_phase",
      "right_delay",
      "right_balance",
      "right_gain",
      "right_phase",
    ]);
  });

  it("全 disabled なら store には null を書く", () => {
    expect(toStoreOption(makeDefaults<StereoFilterOption>(group))).toBeNull();
  });

  it("1 つでも有効なら無効なサブフィルタも含む完全なオブジェクトになる", () => {
    const values = makeDefaults<StereoFilterOption>(group);
    values.stereotools.enabled = true;
    const stored = toStoreOption(values);
    expect(stored).not.toBeNull();
    expect(Object.keys(stored!)).toEqual([
      "stereotools",
      "stereowiden",
      "extrastereo",
      "crossfeed",
      "haas",
      "dialoguenhance",
    ]);
    expect(stored!.haas).toEqual(LEGACY_DEFAULTS.haas);
  });

  it("store に入る値は素のオブジェクト（プロキシを漏らさない）", () => {
    const values = makeDefaults<StereoFilterOption>(group);
    values.crossfeed.enabled = true;
    const stored = toStoreOption(values)!;
    expect(stored).not.toBe(values);
    expect(stored.crossfeed).not.toBe(values.crossfeed);
  });

  it("有効なサブフィルタだけを宣言順にシリアライズする", () => {
    const values = makeDefaults<StereoFilterOption>(group);
    values.dialoguenhance.enabled = true;
    values.stereowiden.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "stereowiden=delay=20:feedback=0.3:crossfeed=0.3:drymix=0.8",
      "dialoguenhance=original=1:enhance=1:voice=2",
    ]);
  });

  it("stereotools の 5 つの boolean が全て 1/0 に変換される", () => {
    const values = makeDefaults<StereoFilterOption>(group);
    values.stereotools.enabled = true;
    expect(serializeGroup(group, values)[0]).toBe(
      "stereotools=level_in=1:level_out=1:balance_in=0:balance_out=0:softclip=0:mutel=0:muter=0:phasel=0:phaser=0:mode=lr>lr:slev=1:sbal=0:mlev=1:mpan=0:base=0:delay=0:sclevel=1:phase=0:bmode_in=balance:bmode_out=balance",
    );
    values.stereotools.softclip = true;
    values.stereotools.mutel = true;
    values.stereotools.muter = true;
    values.stereotools.phasel = true;
    values.stereotools.phaser = true;
    expect(serializeGroup(group, values)[0]).toContain(
      "softclip=1:mutel=1:muter=1:phasel=1:phaser=1",
    );
  });

  it("haas の boolean も 1/0 になる（デフォルトで right_phase だけ 1）", () => {
    const values = makeDefaults<StereoFilterOption>(group);
    values.haas.enabled = true;
    expect(serializeGroup(group, values)[0]).toBe(
      "haas=level_in=1:level_out=1:side_gain=1:middle_source=left:middle_phase=0:left_delay=2.05:left_balance=-1:left_gain=1:left_phase=0:right_delay=2.12:right_balance=1:right_gain=1:right_phase=1",
    );
  });

  it("extrastereo の c はデフォルト true なので c=1", () => {
    const values = makeDefaults<StereoFilterOption>(group);
    values.extrastereo.enabled = true;
    expect(serializeGroup(group, values)[0]).toBe("extrastereo=m=2.5:c=1");
    values.extrastereo.c = false;
    expect(serializeGroup(group, values)[0]).toBe("extrastereo=m=2.5:c=0");
  });

  it("値の文字列化に丸めを入れない（2.05 が 2.1 にならない）", () => {
    const values = makeDefaults<StereoFilterOption>(group);
    values.haas.enabled = true;
    expect(serializeGroup(group, values)[0]).toContain("left_delay=2.05");
  });

  it("store が null なら何もシリアライズしない", () => {
    expect(serializeGroup(group, null)).toEqual([]);
    expect(serializeGroup(group, undefined)).toEqual([]);
  });
});
