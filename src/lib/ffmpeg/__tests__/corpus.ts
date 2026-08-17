import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ProcessingOptions } from "../../types";

/**
 * src/lib/types.ts を解析して、全フィルタ・全パラメータを機械的に列挙する。
 *
 * 手書きのケース表にすると新しいフィルタを追加したときにテストが追従しないので、
 * 型定義そのものを唯一の一覧として使う。
 */

const TYPES_PATH = fileURLToPath(new URL("../../types.ts", import.meta.url));
const source = readFileSync(TYPES_PATH, "utf-8");

type Fields = { name: string; type: string }[];

function parseInterfaces(): Map<string, Fields> {
  const result = new Map<string, Fields>();
  const re = /export interface (\w+)\s*\{([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const fields: Fields = [];
    for (const line of m[2].split("\n")) {
      const f = line.trim().match(/^(\w+)\??:\s*(.+?);?$/);
      if (f) fields.push({ name: f[1], type: f[2].trim().replace(/;$/, "") });
    }
    result.set(m[1], fields);
  }
  return result;
}

function parseUnionAliases(): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const re = /export type (\w+)\s*=\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const literals = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    if (literals.length > 0 && !m[2].includes("{")) {
      result.set(m[1], literals);
    }
  }
  return result;
}

const interfaces = parseInterfaces();
const unionAliases = parseUnionAliases();

/** 決定的な擬似乱数（seed 固定で CI が再現する） */
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 数値パラメータに入れる候補。境界・小数・負値・0 を含める */
const NUMBER_POOL = [0, 1, -1, 0.5, 0.707, 2.828, 12, -70, 100, 1000, 0.0625, 99999];
/** 文字列パラメータ（compand の points や adelay の delays など） */
const STRING_POOL = ["0", "0.8", "-70/-70|-60/-20|1/0", "1500|0|500", "0.3"];

function valueForType(type: string, rng: () => number): unknown {
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length) % arr.length];

  if (type === "boolean") return rng() < 0.5;
  if (type === "number") return pick(NUMBER_POOL);
  if (type === "string") return pick(STRING_POOL);

  // 数値リテラルの union（例: 1 | 2、1 | 2 | 4 | 8）
  const numericLiterals = type.match(/^\s*\d+(\s*\|\s*\d+)+\s*$/);
  if (numericLiterals) {
    return pick(type.split("|").map((s) => Number(s.trim())));
  }
  // 文字列リテラルの union
  if (/^"[^"]*"(\s*\|\s*"[^"]*")*$/.test(type.trim())) {
    return pick([...type.matchAll(/"([^"]+)"/g)].map((x) => x[1]));
  }
  // 型エイリアス経由の union（WidthType など）
  const alias = unionAliases.get(type);
  if (alias) return pick(alias);
  // ネストしたインターフェイス
  if (interfaces.has(type)) return buildFromInterface(type, rng);

  throw new Error(`コーパス生成器が未対応の型です: ${type}`);
}

function buildFromInterface(name: string, rng: () => number): Record<string, unknown> {
  const fields = interfaces.get(name);
  if (!fields) throw new Error(`インターフェイスが見つかりません: ${name}`);
  const obj: Record<string, unknown> = {};
  for (const f of fields) obj[f.name] = valueForType(f.type, rng);
  return obj;
}

/** enabled を持つサブフィルタを、指定確率で有効化しつつ生成する */
function buildGroup(
  name: string,
  rng: () => number,
  enableRate: number,
): Record<string, unknown> {
  const group = buildFromInterface(name, rng);
  for (const value of Object.values(group)) {
    if (value && typeof value === "object" && "enabled" in value) {
      (value as { enabled: boolean }).enabled = rng() < enableRate;
    }
  }
  return group;
}

/** buildFFmpegArgs はファイル名しか見ないので、名前だけの File で足りる */
export function fakeFile(name: string): File {
  return { name, size: 1024 } as unknown as File;
}

export const FILTER_GROUPS = [
  ["frequency_filter", "FrequencyFilterOption"],
  ["dynamics_filter", "DynamicsFilterOption"],
  ["effect_filter", "EffectFilterOption"],
  ["frequency_filter_ext", "FrequencyFilterExtOption"],
  ["dynamics_filter_ext", "DynamicsFilterExtOption"],
  ["effect_filter_ext", "EffectFilterExtOption"],
  ["repair_filter", "RepairFilterOption"],
  ["stereo_filter", "StereoFilterOption"],
] as const;

/** 全グループのサブフィルタ名を列挙する（網羅性のメタテスト用） */
export function allSubFilterNames(): string[] {
  const names: string[] = [];
  for (const [, iface] of FILTER_GROUPS) {
    for (const f of interfaces.get(iface) ?? []) names.push(`${iface}.${f.name}`);
  }
  return names;
}

export interface GeneratedCase {
  options: ProcessingOptions;
  /** 有効化されたサブフィルタ名（網羅性の確認に使う） */
  enabled: string[];
}

const OUTPUT_NAMES = ["out.mp3", "out.wav", "out.ogg", "out.flac"];
const BIT_DEPTHS = [undefined, "16", "24", "32", "f32", "f64"];
const INPUT_NAMES = ["in.wav", "in.mp3", "in.flac", "in.ogg"];

export function generateCase(seed: number, enableRate = 0.35): GeneratedCase {
  const rng = makeRng(seed);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length) % arr.length];

  const options: Record<string, unknown> = {
    input_file: fakeFile(pick(INPUT_NAMES)),
    output_name: pick(OUTPUT_NAMES),
    input_sample_rate: rng() < 0.8 ? pick([44100, 48000, 96000]) : undefined,
    bitrate: rng() < 0.4 ? pick(["128k", "192k", "320k"]) : undefined,
    sample_rate: rng() < 0.4 ? pick([22050, 44100, 48000]) : undefined,
    bit_depth: pick(BIT_DEPTHS),
    ogg_quality: rng() < 0.4 ? pick([0, 0.5, 1]) : undefined,
    trim: rng() < 0.3 ? { start: "00:00:01", end: "00:00:05" } : undefined,
    metadata: rng() < 0.3 ? { title: "t", artist: "a", track: "" } : undefined,
    album_art: rng() < 0.3 ? fakeFile("cover.jpg") : undefined,
    volume:
      rng() < 0.5
        ? pick([
            { type: "adjust", db: pick([-6, 0, 3.5]) },
            { type: "normalize_peak", target_db: -1 },
            { type: "normalize_rms", target_db: -14 },
            { type: "normalize_lufs", target_lufs: -14 },
          ])
        : undefined,
    silence_remove:
      rng() < 0.3
        ? {
            remove_start: rng() < 0.5,
            remove_end: rng() < 0.5,
            threshold_start_db: -50,
            threshold_end_db: -45,
          }
        : undefined,
    noise_reduce:
      rng() < 0.3
        ? pick([
            { type: "afftdn", nr: 12, nf: -25 },
            { type: "anlmdn", strength: 0.00001 },
          ])
        : undefined,
    channel_filter:
      rng() < 0.3
        ? {
            conversion: pick(["unchanged", "to_mono", "to_stereo"]),
            balance: pick([0, -0.5, 0.5]),
          }
        : undefined,
  };

  const enabled: string[] = [];
  for (const [key, iface] of FILTER_GROUPS) {
    if (rng() < 0.75) {
      const group = buildGroup(iface, rng, enableRate);
      options[key] = group;
      for (const [subName, sub] of Object.entries(group)) {
        if (sub && typeof sub === "object" && (sub as { enabled?: boolean }).enabled) {
          enabled.push(`${iface}.${subName}`);
        }
      }
    }
  }

  return { options: options as unknown as ProcessingOptions, enabled };
}

/** 全サブフィルタを一斉に有効化したケース（グループ間の適用順を固定する） */
export function generateAllEnabledCase(seed = 1): ProcessingOptions {
  const rng = makeRng(seed);
  const options: Record<string, unknown> = {
    input_file: fakeFile("in.wav"),
    output_name: "out.wav",
    input_sample_rate: 44100,
  };
  for (const [key, iface] of FILTER_GROUPS) {
    options[key] = buildGroup(iface, rng, 1);
  }
  return options as unknown as ProcessingOptions;
}
