import { FFmpeg } from "@ffmpeg/ffmpeg";
import { base } from "$app/paths";
import {
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

export function getPrimary(): FFmpegInstance {
  return getSlot(0);
}

/** スロット番号に対応するインスタンスを返す（無ければ生成する） */
export function getSlot(slot: number): FFmpegInstance {
  const existing = instances[slot];
  if (existing && !existing.isTerminated) return existing;
  const created = new FFmpegInstance();
  instances[slot] = created;
  return created;
}

/** 壊れたインスタンスを捨てて次回に作り直させる */
export function discardSlot(slot: number) {
  instances[slot]?.terminate();
  instances[slot] = null;
}

/** primary 以外を破棄する。Emscripten のヒープは縮まないのでバッチ後に解放する */
export function disposeExtras() {
  for (let i = 1; i < instances.length; i++) {
    instances[i]?.terminate();
    instances[i] = null;
  }
}

/** 全インスタンスを破棄し、primary を作り直してロードする */
export async function resetPool(): Promise<void> {
  for (let i = 0; i < instances.length; i++) {
    instances[i]?.terminate();
    instances[i] = null;
  }
  instances.length = 0;
  await getPrimary().load();
}
