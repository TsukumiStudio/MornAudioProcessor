/**
 * 並列処理の方針決定（純粋関数のみ）。
 * ブラウザ API に触らないので Node 上のテストから直接検証できる。
 */

/** 並列度の上限。exec 自体は Worker 内シングルスレッドで、律速はメモリなので低めに抑える */
export const HARD_MAX_PARALLEL = 4;

/** wasm ヒープの作業領域の保守的な見積り（実測に基づく厳密な値ではない） */
export const WORKING_SET_BYTES = 128 * 1024 * 1024;

const MIB = 1024 * 1024;
const GIB = 1024 * MIB;

export interface RuntimeEnv {
  /** navigator.hardwareConcurrency */
  hardwareConcurrency?: number;
  /** navigator.deviceMemory（GiB 単位、対応ブラウザのみ） */
  deviceMemory?: number;
  mobile: boolean;
  /** ?parallel=N によるデバッグ指定 */
  parallelOverride?: number | null;
}

/**
 * 並列度。CPU 的にはコア数まで積めるが、各インスタンスが wasm ヒープと MEMFS 上の
 * 入出力を抱えるためメモリで律速する。モバイルは 1（従来と同じ完全直列）に固定。
 */
export function resolveParallelism(env: RuntimeEnv): number {
  if (env.parallelOverride != null && env.parallelOverride > 0) {
    return env.parallelOverride;
  }
  if (env.mobile) return 1;
  const hc = env.hardwareConcurrency ?? 4;
  return Math.min(Math.max(Math.floor(hc / 2), 1), HARD_MAX_PARALLEL);
}

/** 同時に確保してよいメモリの目安 */
export function resolveBudgetBytes(env: RuntimeEnv): number {
  const gib = env.deviceMemory;
  if (typeof gib === "number" && gib > 0) {
    return Math.min(Math.max(gib * 0.25 * GIB, 512 * MIB), 2 * GIB);
  }
  // Safari / Firefox は deviceMemory を持たないので控えめな既定値
  return 1 * GIB;
}

/**
 * 1 ファイル処理に要するメモリのおおよその見積り。
 * 正規化パスは pcm_f32le の中間ファイルと出力の両方を MEMFS に載せる。
 */
export function estimateJobBytes(params: {
  inputSize: number;
  durationMs: number | null;
  sampleRate: number | null;
  channels: number | null;
  usesIntermediate: boolean;
}): number {
  const { inputSize, durationMs, sampleRate, channels, usesIntermediate } = params;
  const pcmBytes =
    durationMs && durationMs > 0
      ? (durationMs / 1000) * (sampleRate ?? 48000) * (channels ?? 2) * 4
      : // 解析前などで長さが不明な場合は入力サイズから粗く見積もる
        inputSize * 12;
  return inputSize + pcmBytes * (usesIntermediate ? 2 : 1) + WORKING_SET_BYTES;
}

/**
 * 1 インスタンスが処理する累積バイト数の上限。
 * Emscripten のヒープは一度伸びると縮まないため、大きいファイルを続けて処理すると
 * スロットが高水位のメモリを抱えたままになる。これを超えたら作り直して解放する。
 * （wasm の再取得は HTTP キャッシュに載るので実コストは再コンパイル分のみ）
 */
export const SLOT_RECYCLE_BYTES = 512 * 1024 * 1024;

/** スロットごとの累積処理量を数え、作り直しの必要を判断する */
export class SlotUsageTracker {
  private bytes = new Map<number, number>();

  constructor(private readonly limit: number = SLOT_RECYCLE_BYTES) {}

  /** 処理量を加算し、上限に達したら true（呼び出し側がインスタンスを破棄する） */
  add(slot: number, bytes: number): boolean {
    const total = (this.bytes.get(slot) ?? 0) + bytes;
    this.bytes.set(slot, total);
    return total >= this.limit;
  }

  used(slot: number): number {
    return this.bytes.get(slot) ?? 0;
  }

  reset(slot: number): void {
    this.bytes.delete(slot);
  }

  resetAll(): void {
    this.bytes.clear();
  }
}

/**
 * メモリ予算に基づく入場制御。
 * 予算を超える場合は実行中が捌けるまで待つが、実行中が 0 件なら単独実行を許す
 * （1 ファイルも処理できなくなるのを防ぐ。巨大ファイルばかりなら自然に直列へ退化する）
 */
export class MemoryGate {
  private inFlight = 0;
  private active = 0;
  private waiters: (() => void)[] = [];

  constructor(private readonly budget: number) {}

  get activeCount(): number {
    return this.active;
  }

  get inFlightBytes(): number {
    return this.inFlight;
  }

  async admit(bytes: number): Promise<void> {
    while (this.active > 0 && this.inFlight + bytes > this.budget) {
      await new Promise<void>((resolve) => this.waiters.push(resolve));
    }
    this.inFlight += bytes;
    this.active++;
  }

  release(bytes: number): void {
    this.inFlight -= bytes;
    this.active--;
    for (const wake of this.waiters.splice(0)) wake();
  }
}
