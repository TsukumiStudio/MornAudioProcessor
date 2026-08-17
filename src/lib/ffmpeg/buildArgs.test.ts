import { describe, expect, it } from "vitest";
import { buildFFmpegArgs } from "./buildArgs";
import { buildFFmpegArgs as legacyBuildFFmpegArgs } from "./__tests__/legacyBuildArgs";
import {
  allSubFilterNames,
  generateAllEnabledCase,
  generateCase,
} from "./__tests__/corpus";

const CASE_COUNT = 500;

describe("buildFFmpegArgs は移行前の実装と完全に一致する", () => {
  it(`ランダム生成 ${CASE_COUNT} ケースで出力が同一`, () => {
    for (let seed = 1; seed <= CASE_COUNT; seed++) {
      const { options } = generateCase(seed);
      expect(buildFFmpegArgs(options), `seed=${seed}`).toEqual(
        legacyBuildFFmpegArgs(options),
      );
    }
  });

  it("全サブフィルタを同時に有効化しても同一（グループ間の適用順を固定）", () => {
    const options = generateAllEnabledCase();
    expect(buildFFmpegArgs(options)).toEqual(legacyBuildFFmpegArgs(options));
  });

  it("コーパスが全サブフィルタを少なくとも 1 回有効化している", () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= CASE_COUNT; seed++) {
      for (const name of generateCase(seed).enabled) seen.add(name);
    }
    const missing = allSubFilterNames().filter((n) => !seen.has(n));
    expect(missing).toEqual([]);
  });
});

describe("ゴールデンスナップショット", () => {
  it("全フィルタ有効時の引数列", () => {
    expect(buildFFmpegArgs(generateAllEnabledCase())).toMatchSnapshot();
  });

  it("代表的なランダムケースの引数列", () => {
    for (const seed of [1, 7, 42, 99, 123]) {
      expect(buildFFmpegArgs(generateCase(seed).options)).toMatchSnapshot(
        `seed-${seed}`,
      );
    }
  });
});

describe("特殊なシリアライズ規則", () => {
  const baseOptions = {
    input_file: { name: "in.wav", size: 1 } as unknown as File,
    output_name: "out.wav",
  };

  const afOf = (args: string[]): string | undefined => {
    const i = args.indexOf("-af");
    return i >= 0 ? args[i + 1] : undefined;
  };

  it("aecho と chorus は位置引数で並ぶ", () => {
    const args = buildFFmpegArgs({
      ...baseOptions,
      effect_filter: {
        echo: { enabled: true, in_gain: 0.6, out_gain: 0.3, delays: "1000", decays: "0.5" },
        chorus: {
          enabled: true,
          in_gain: 0.5,
          out_gain: 0.9,
          delays: "50",
          decays: "0.4",
          speeds: "0.25",
          depths: "2",
        },
        flanger: { enabled: false } as never,
        phaser: { enabled: false } as never,
        tremolo: { enabled: false } as never,
        vibrato: { enabled: false } as never,
        tempo: { enabled: false } as never,
        pitch: { enabled: false } as never,
      } as never,
    } as never);
    expect(afOf(args)).toContain("aecho=0.6:0.3:1000:0.5");
    expect(afOf(args)).toContain("chorus=0.5:0.9:50:0.4:0.25:2");
  });

  it("pitch は asetrate + atempo + aresample の 3 フィルタに展開される", () => {
    const args = buildFFmpegArgs({
      ...baseOptions,
      input_sample_rate: 44100,
      effect_filter: {
        echo: { enabled: false } as never,
        chorus: { enabled: false } as never,
        flanger: { enabled: false } as never,
        phaser: { enabled: false } as never,
        tremolo: { enabled: false } as never,
        vibrato: { enabled: false } as never,
        tempo: { enabled: false } as never,
        pitch: { enabled: true, semitones: 12 },
      } as never,
    } as never);
    const af = afOf(args) ?? "";
    expect(af).toContain("asetrate=88200");
    expect(af).toContain("aresample=44100");
  });

  it("pitch は semitones=0 または入力サンプルレート不明ならスキップされる", () => {
    const make = (semitones: number, rate?: number) =>
      buildFFmpegArgs({
        ...baseOptions,
        input_sample_rate: rate,
        effect_filter: {
          echo: { enabled: false } as never,
          chorus: { enabled: false } as never,
          flanger: { enabled: false } as never,
          phaser: { enabled: false } as never,
          tremolo: { enabled: false } as never,
          vibrato: { enabled: false } as never,
          tempo: { enabled: false } as never,
          pitch: { enabled: true, semitones },
        } as never,
      } as never);
    expect(afOf(make(0, 44100))).toBeUndefined();
    expect(afOf(make(12, undefined))).toBeUndefined();
  });

  it("areverse は引数なしの裸名で出る", () => {
    const args = buildFFmpegArgs({
      ...baseOptions,
      effect_filter_ext: {
        afade_in: { enabled: false } as never,
        afade_out: { enabled: false } as never,
        acrusher: { enabled: false } as never,
        aexciter: { enabled: false } as never,
        crystalizer: { enabled: false } as never,
        areverse: { enabled: true },
        aloop: { enabled: false } as never,
        afreqshift: { enabled: false } as never,
        apulsator: { enabled: false } as never,
        adelay: { enabled: false } as never,
        compensationdelay: { enabled: false } as never,
        dcshift: { enabled: false } as never,
        apad: { enabled: false } as never,
      } as never,
    } as never);
    expect(afOf(args)).toBe("areverse");
  });

  it("WAV 出力のビット解像度は PCM コーデック指定になる", () => {
    const args = buildFFmpegArgs({
      ...baseOptions,
      output_name: "out.wav",
      bit_depth: "24",
    } as never);
    expect(args).toContain("pcm_s24le");
  });

  it("FLAC の 24bit は sample_fmt と bits_per_raw_sample で指定する", () => {
    const args = buildFFmpegArgs({
      ...baseOptions,
      output_name: "out.flac",
      bit_depth: "24",
    } as never);
    expect(args.join(" ")).toContain("-sample_fmt s32 -bits_per_raw_sample 24");
  });

  it("ogg クオリティは 10 倍して -q:a になる", () => {
    const args = buildFFmpegArgs({
      ...baseOptions,
      output_name: "out.ogg",
      ogg_quality: 0.8,
    } as never);
    const i = args.indexOf("-q:a");
    expect(args[i + 1]).toBe("8");
  });

  it("アルバムアート使用時はストリームマッピングが入る", () => {
    const args = buildFFmpegArgs({
      ...baseOptions,
      output_name: "out.mp3",
      album_art: { name: "cover.jpg", size: 1 } as unknown as File,
    } as never);
    expect(args.join(" ")).toContain("-map 0:a -map 1:v");
    expect(args.join(" ")).toContain("-c:v copy");
    expect(args.join(" ")).toContain("-id3v2_version 3");
  });

  it("空文字のメタデータは引数に出さない", () => {
    const args = buildFFmpegArgs({
      ...baseOptions,
      metadata: { title: "x", artist: "" },
    } as never);
    expect(args.join(" ")).toContain("title=x");
    expect(args.join(" ")).not.toContain("artist=");
  });
});
