/**
 * フィルタ設定のスキーマ型。
 *
 * 1 フィルタ = 1 定義に、UI メタデータ（ラベル・コントロール種別・範囲・表示形式）と
 * ffmpeg のシリアライズ規則（キー名・並び順・値変換）の両方を持たせる。
 * これで従来 4〜6 箇所に分散していたパラメータの知識が 1 箇所に集まる。
 *
 * src/lib/types.ts の手書き interface は「正」として残し、スキーマ側は `satisfies` で
 * 整合をコンパイラに検査させる（スキーマの誤りを検出する独立した参照点を保つため）。
 */

export interface RangeControl {
  control: "range";
  default: number;
  min: number;
  max: number;
  step: number;
  /** slider-value の表示。既存コードの式を逐語移植する */
  format?: (v: number) => string;
}

export interface NumberControl {
  control: "number";
  default: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

export interface SelectControl<V extends string | number> {
  control: "select";
  default: V;
  options: readonly { value: V; label: string }[];
}

export interface CheckboxControl {
  control: "checkbox";
  default: boolean;
  /** param-desc に出す補足 */
  desc?: string;
}

export interface TextControl {
  control: "text";
  default: string;
}

/** interface のフィールド型に対して使えるコントロールを制約する */
export type ControlDef<V> = [V] extends [boolean]
  ? CheckboxControl
  : [V] extends [number]
    ? RangeControl | NumberControl | SelectControl<V & number>
    : TextControl | SelectControl<V & string>;

export type AnyControl =
  | RangeControl
  | NumberControl
  | SelectControl<string | number>
  | CheckboxControl
  | TextControl;

/** シリアライズ時の 1 引数 */
export type SerArg<TOpt> =
  /** 固定リテラル（afade の t=in など） */
  | { lit: string }
  /** key=value。key が null なら位置引数 */
  | {
      key: string | null;
      from: Exclude<keyof TOpt, "enabled"> & string;
      /** boolean を 1/0 に変換する */
      bool?: true;
    };

export interface SerializeCtx {
  input_sample_rate?: number;
}

export type SerializeSpec<TOpt> =
  /** 汎用: `name=` + join(":")。args が空なら裸名（areverse） */
  | { name: string; args: readonly SerArg<TOpt>[] }
  /** 特殊: 複数フィルタへ展開するなど（pitch） */
  | { custom: (opt: TOpt, ctx: SerializeCtx) => string[] };

export interface FilterDef<
  TOpt extends { enabled: boolean },
  TFixed extends keyof TOpt = never,
> {
  /** 表示名（「イコライザー」） */
  label: string;
  /** ヘッダ括弧内の ffmpeg フィルタ名表示（"equalizer"、"asetrate+atempo"） */
  ffname: string;
  /** ffmpeg-filters.html のアンカー */
  doc: string;
  /** UI に出さない固定値（afade の type）。store オブジェクトには含める */
  fixed?: Readonly<Pick<TOpt, TFixed>>;
  /** enabled と fixed を除く全フィールドを網羅する（過不足はコンパイルエラー） */
  params: {
    [K in Exclude<keyof TOpt, "enabled" | TFixed>]: ControlDef<TOpt[K]>;
  };
  serialize: SerializeSpec<TOpt>;
}

/** グループ（store の 1 スロットに対応）の定義 */
export type GroupDef<TGroup> = {
  [K in keyof TGroup]: FilterDef<
    TGroup[K] & { enabled: boolean },
    // fixed を使うフィルタは個別に型付けするため、ここでは緩く受ける
    never
  >;
};
