import { FFmpeg } from "@ffmpeg/ffmpeg";
import { base } from "$app/paths";
import {
  SlotUsageTracker,
  resolveBudgetBytes,
  resolveParallelism,
  type RuntimeEnv,
} from "./pool-policy";

/** ffmpeg のログをコンソールへ流すか。処理中は数千行になるため本番では抑制する */
const LOG_TO_CONSOLE = import.meta.env.DEV;

function coreConfig() {
  return {
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
    classWorkerURL: `${base}/ffmpeg-worker/worker.js`,
  };
}

/**
 * FFmpeg インスタンス 1 個とその直列キュー。
 *
 * ログコールバック（`ff.on("log", ...)`）はインスタンス単位で共有されるため、
 * 同一インスタンス上で 2 つの exec を同時に走らせると計測値が互いに混ざり、
 * 例外なしで音量の狂った出力ができる。インスタンス内は必ず直列に実行する。
 * 逆にインスタンスを分ければ、ログも MEMFS も独立するので固定の一時ファイル名で問題ない。
 */
export class FFmpegInstance {
  readonly ff: FFmpeg;
  private queue: Promise<unknown> = Promise.resolve();
  private loading: Promise<void> | null = null;
  private terminated = false;

  constructor() {
    this.ff = new FFmpeg();
    if (LOG_TO_CONSOLE) {
      this.ff.on("log", ({ message }) => {
        console.log("[ffmpeg]", message);
      });
    }
  }

  /** コアの読み込み。多重呼び出しでも 1 回だけ走る */
  load(): Promise<void> {
    if (!this.loading) {
      this.loading = this.ff.load(coreConfig()).then(() => undefined);
    }
    return this.loading;
  }

  /** このインスタンス上の操作を直列に実行する */
  run<T>(task: (ff: FFmpeg) => Promise<T>): Promise<T> {
    const result = this.queue.then(async () => {
      if (this.terminated) {
        throw new Error("FFmpeg インスタンスは破棄されています");
      }
      await this.load();
      return task(this.ff);
    });
    // 失敗しても後続を止めない
    this.queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  terminate() {
    if (this.terminated) return;
    this.terminated = true;
    try {
      this.ff.terminate();
    } catch {}
  }

  get isTerminated(): boolean {
    return this.terminated;
  }
}

function isMobile(): boolean {
  const uaData = (
    navigator as Navigator & { userAgentData?: { mobile?: boolean } }
  ).userAgentData;
  if (uaData?.mobile) return true;
  if (/Android|iPhone|iPad|iPod|Mobile/.test(navigator.userAgent)) return true;
  // iPadOS は Mac を騙るのでタッチ有無で判定する
  return navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform);
}

/** デバッグ用: ?parallel=N で並列度を固定できる（直列との出力一致検証に使う） */
function parallelOverride(): number | null {
  if (typeof location === "undefined") return null;
  const raw = new URLSearchParams(location.search).get("parallel");
  if (!raw) return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function runtimeEnv(): RuntimeEnv {
  return {
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory,
    mobile: isMobile(),
    parallelOverride: parallelOverride(),
  };
}

/** 並列度（端末から自動決定。判定ロジックは pool-policy.ts） */
export function maxParallel(): number {
  return resolveParallelism(runtimeEnv());
}

/** 同時に確保してよいメモリの目安 */
export function memoryBudgetBytes(): number {
  return resolveBudgetBytes(runtimeEnv());
}

/** プール本体。index 0 は primary（解析にも使う常設インスタンス） */
const instances: (FFmpegInstance | null)[] = [];
/** スロットごとの累積処理量（インスタンス作り直しの判断は pool-policy.ts 側） */
const slotUsage = new SlotUsageTracker();

export function getPrimary(): FFmpegInstance {
  return getSlot(0);
}

/** スロット番号に対応するインスタンスを返す（無ければ生成する） */
export function getSlot(slot: number): FFmpegInstance {
  const existing = instances[slot];
  if (existing && !existing.isTerminated) return existing;
  const created = new FFmpegInstance();
  instances[slot] = created;
  slotUsage.reset(slot);
  return created;
}

/**
 * そのスロットで処理した量を記録し、上限を超えたらインスタンスを破棄する。
 * 破棄後は次の getSlot で新しいインスタンスが作られる。
 */
export function noteSlotUsage(slot: number, bytes: number) {
  if (!slotUsage.add(slot, bytes)) return;
  if (import.meta.env.DEV) {
    const mib = Math.round(slotUsage.used(slot) / 1024 / 1024);
    console.info(`[pool] slot ${slot} を作り直す（累積 ${mib}MiB）`);
  }
  discardSlot(slot);
}

/** 壊れたインスタンスを捨てて次回に作り直させる */
export function discardSlot(slot: number) {
  instances[slot]?.terminate();
  instances[slot] = null;
  slotUsage.reset(slot);
}

/**
 * 全インスタンスを即座に破棄する。
 * terminate() は実行中の exec の Promise を reject するので、処理の中止に使える。
 */
export function terminateAll() {
  for (let i = 0; i < instances.length; i++) {
    instances[i]?.terminate();
    instances[i] = null;
  }
  slotUsage.resetAll();
}

/** primary 以外を破棄する。Emscripten のヒープは縮まないのでバッチ後に解放する */
export function disposeExtras() {
  for (let i = 1; i < instances.length; i++) {
    instances[i]?.terminate();
    instances[i] = null;
    slotUsage.reset(i);
  }
}

/** 全インスタンスを破棄し、primary を作り直してロードする */
export async function resetPool(): Promise<void> {
  for (let i = 0; i < instances.length; i++) {
    instances[i]?.terminate();
    instances[i] = null;
  }
  instances.length = 0;
  slotUsage.resetAll();
  await getPrimary().load();
}
