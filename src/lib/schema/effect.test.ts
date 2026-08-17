import { describe, expect, it } from "vitest";
import { effectGroup } from "./effect";
import { makeDefaults, serializeGroup, toStoreOption } from "./helpers";
import type { FilterDef } from "./types";
import type { EffectFilterOption } from "../types";

const group = effectGroup as unknown as Record<
  string,
  FilterDef<{ enabled: boolean }, never>
>;

/**
 * 移行前の EffectSettings.svelte のリセットブロックから転記した期待値。
 * スキーマから作らず旧コードを写すことで、転記ミスを検出できる。
 */
const LEGACY_DEFAULTS: EffectFilterOption = {
  echo: {
    enabled: false,
    in_gain: 0.6,
    out_gain: 0.3,
    delays: 1000,
    decays: 0.5,
  },
  chorus: {
    enabled: false,
    in_gain: 0.4,
    out_gain: 0.4,
    delays: 55,
    decays: 0.4,
    speeds: 0.25,
    depths: 2,
  },
  flanger: {
    enabled: false,
    delay: 0,
    depth: 2,
    regen: 0,
    width: 71,
    speed: 0.5,
    shape: "sinusoidal",
    phase: 25,
    interp: "linear",
  },
  phaser: {
    enabled: false,
    in_gain: 0.4,
    out_gain: 0.74,
    delay: 3.0,
    decay: 0.4,
    speed: 0.5,
    type: "triangular",
  },
  tremolo: { enabled: false, f: 5.0, d: 0.5 },
  vibrato: { enabled: false, f: 5.0, d: 0.5 },
  tempo: { enabled: false, tempo: 1.0 },
  pitch: { enabled: false, semitones: 0 },
};

describe("effect スキーマ", () => {
  it("デフォルト値が移行前のリセット値と一致する", () => {
    expect(makeDefaults<EffectFilterOption>(group)).toEqual(LEGACY_DEFAULTS);
  });

  it("パラメータの宣言順が UI 表示順・シリアライズ順と一致する", () => {
    expect(Object.keys(group)).toEqual([
      "echo",
      "chorus",
      "flanger",
      "phaser",
      "tremolo",
      "vibrato",
      "tempo",
      "pitch",
    ]);
    expect(Object.keys(group.flanger.params)).toEqual([
      "delay",
      "depth",
      "regen",
      "width",
      "speed",
      "shape",
      "phase",
      "interp",
    ]);
  });

  it("全 disabled なら store には null を書く", () => {
    expect(toStoreOption(makeDefaults<EffectFilterOption>(group))).toBeNull();
  });

  it("1 つでも有効なら無効なサブフィルタも含む完全なオブジェクトになる", () => {
    const values = makeDefaults<EffectFilterOption>(group);
    values.echo.enabled = true;
    const stored = toStoreOption(values);
    expect(stored).not.toBeNull();
    expect(Object.keys(stored!)).toEqual(Object.keys(LEGACY_DEFAULTS));
    expect(stored!.chorus).toEqual(LEGACY_DEFAULTS.chorus);
  });

  it("aecho は全パラメータが位置引数", () => {
    const values = makeDefaults<EffectFilterOption>(group);
    values.echo.enabled = true;
    expect(serializeGroup(group, values)).toEqual(["aecho=0.6:0.3:1000:0.5"]);
  });

  it("chorus は全パラメータが位置引数", () => {
    const values = makeDefaults<EffectFilterOption>(group);
    values.chorus.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "chorus=0.4:0.4:55:0.4:0.25:2",
    ]);
  });

  it("atempo は単一の位置引数", () => {
    const values = makeDefaults<EffectFilterOption>(group);
    values.tempo.enabled = true;
    values.tempo.tempo = 1.25;
    expect(serializeGroup(group, values)).toEqual(["atempo=1.25"]);
  });

  it("flanger / aphaser / tremolo / vibrato は key=value", () => {
    const values = makeDefaults<EffectFilterOption>(group);
    values.flanger.enabled = true;
    values.phaser.enabled = true;
    values.tremolo.enabled = true;
    values.vibrato.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "flanger=delay=0:depth=2:regen=0:width=71:speed=0.5:shape=sinusoidal:phase=25:interp=linear",
      "aphaser=in_gain=0.4:out_gain=0.74:delay=3:decay=0.4:speed=0.5:type=triangular",
      "tremolo=f=5:d=0.5",
      "vibrato=f=5:d=0.5",
    ]);
  });

  it("pitch は asetrate / atempo / aresample の 3 フィルタに展開される", () => {
    const values = makeDefaults<EffectFilterOption>(group);
    values.pitch.enabled = true;
    values.pitch.semitones = 12;
    expect(serializeGroup(group, values, { input_sample_rate: 44100 })).toEqual([
      "asetrate=88200",
      "atempo=0.5",
      "aresample=44100",
    ]);
  });

  it("pitch は semitones=0 なら enabled でも何も出さない", () => {
    const values = makeDefaults<EffectFilterOption>(group);
    values.pitch.enabled = true;
    expect(serializeGroup(group, values, { input_sample_rate: 44100 })).toEqual(
      [],
    );
  });

  it("pitch は input_sample_rate が不明なら何も出さない", () => {
    const values = makeDefaults<EffectFilterOption>(group);
    values.pitch.enabled = true;
    values.pitch.semitones = 3;
    expect(serializeGroup(group, values)).toEqual([]);
  });

  it("有効なサブフィルタだけを宣言順にシリアライズする", () => {
    const values = makeDefaults<EffectFilterOption>(group);
    values.tempo.enabled = true;
    values.echo.enabled = true;
    expect(serializeGroup(group, values)).toEqual([
      "aecho=0.6:0.3:1000:0.5",
      "atempo=1",
    ]);
  });

  it("store が null なら何もシリアライズしない", () => {
    expect(serializeGroup(group, null)).toEqual([]);
    expect(serializeGroup(group, undefined)).toEqual([]);
  });
});
