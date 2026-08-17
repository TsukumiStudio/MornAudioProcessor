import type {
  AnyControl,
  FilterDef,
  SelectControl,
  SerArg,
  SerializeCtx,
} from "./types";
import type { WidthType } from "../types";

/** key=value の引数 */
export function k<TOpt>(
  key: string,
  from: Exclude<keyof TOpt, "enabled"> & string,
): SerArg<TOpt> {
  return { key, from };
}

/** boolean を 1/0 にして key=value にする引数 */
export function kb<TOpt>(
  key: string,
  from: Exclude<keyof TOpt, "enabled"> & string,
): SerArg<TOpt> {
  return { key, from, bool: true };
}

/** 位置引数（aecho/chorus など） */
export function pos<TOpt>(
  from: Exclude<keyof TOpt, "enabled"> & string,
): SerArg<TOpt> {
  return { key: null, from };
}

/** 固定リテラル（afade の t=in など） */
export function lit(value: string): SerArg<never> {
  return { lit: value };
}

// --- 表示フォーマット（既存コードの式を逐語移植したもの） ---

/** {v > 0 ? "+" : ""}{v} dB */
export const signedDb = (v: number) => `${v > 0 ? "+" : ""}${v} dB`;
/** {v.toFixed(n)} */
export const fixed = (n: number) => (v: number) => v.toFixed(n);
/** {v.toFixed(n)} + 単位 */
export const fixedWith = (n: number, suffix: string) => (v: number) =>
  `${v.toFixed(n)}${suffix}`;
/** 生の値 + 単位 */
export const withUnit = (suffix: string) => (v: number) => `${v}${suffix}`;

// --- よく使う select プリセット ---

const WIDTH_TYPE_LABELS: Record<WidthType, string> = {
  h: "Hz",
  o: "octave",
  q: "Q",
  s: "slope",
  k: "kHz",
};

export function widthTypeSelect(def: WidthType): SelectControl<WidthType> {
  return {
    control: "select",
    default: def,
    options: (Object.keys(WIDTH_TYPE_LABELS) as WidthType[]).map((value) => ({
      value,
      label: WIDTH_TYPE_LABELS[value],
    })),
  };
}

export function polesSelect(def: 1 | 2): SelectControl<1 | 2> {
  return {
    control: "select",
    default: def,
    options: [
      { value: 1, label: "1 (6dB/oct)" },
      { value: 2, label: "2 (12dB/oct)" },
    ],
  };
}

// --- スキーマから値を組み立てる ---

type AnyFilterDef = FilterDef<{ enabled: boolean }, never>;

/** グループのデフォルト値（全 disabled + 各パラメータの default + fixed）を作る */
export function makeDefaults<TGroup>(group: Record<string, AnyFilterDef>): TGroup {
  const result: Record<string, unknown> = {};
  for (const [filterId, def] of Object.entries(group)) {
    const values: Record<string, unknown> = { enabled: false };
    for (const [paramId, control] of Object.entries(def.params)) {
      values[paramId] = (control as AnyControl).default;
    }
    if (def.fixed) Object.assign(values, def.fixed);
    result[filterId] = values;
  }
  return result as TGroup;
}

/**
 * store に書き込む値を作る。
 * 「1 つでも有効なら全サブフィルタを含む完全なオブジェクト、全 disabled なら null」
 * という既存の契約を守る（isStreamCopyEligible や MetadataSettings が依存している）。
 */
export function toStoreOption<TGroup>(values: TGroup): TGroup | null {
  const entries = Object.values(values as Record<string, { enabled?: boolean }>);
  if (!entries.some((v) => v?.enabled)) return null;
  return structuredClone(
    // $state プロキシをそのまま store へ漏らさない
    JSON.parse(JSON.stringify(values)) as TGroup,
  );
}

/** 有効なサブフィルタを宣言順にシリアライズする */
export function serializeGroup<TGroup>(
  group: Record<string, AnyFilterDef>,
  option: TGroup | undefined | null,
  ctx: SerializeCtx = {},
): string[] {
  if (!option) return [];
  const filters: string[] = [];
  for (const [filterId, def] of Object.entries(group)) {
    const values = (option as Record<string, Record<string, unknown>>)[filterId];
    if (!values?.enabled) continue;

    if ("custom" in def.serialize) {
      filters.push(
        ...def.serialize.custom(values as unknown as { enabled: boolean }, ctx),
      );
      continue;
    }

    const { name, args } = def.serialize;
    if (args.length === 0) {
      filters.push(name);
      continue;
    }
    const parts = args.map((arg) => {
      if ("lit" in arg) return arg.lit;
      const raw = values[arg.from];
      // 文字列化は既存のテンプレートリテラルと同じ String(v)。丸めや null ガードを
      // 足すと出力が変わるので絶対に入れない
      const value = arg.bool ? (raw ? 1 : 0) : raw;
      return arg.key === null ? `${value}` : `${arg.key}=${value}`;
    });
    filters.push(`${name}=${parts.join(":")}`);
  }
  return filters;
}
