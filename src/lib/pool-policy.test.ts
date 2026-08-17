import { describe, expect, it } from "vitest";
import {
  HARD_MAX_PARALLEL,
  MemoryGate,
  WORKING_SET_BYTES,
  estimateJobBytes,
  resolveBudgetBytes,
  resolveParallelism,
  type RuntimeEnv,
} from "./pool-policy";

const MIB = 1024 * 1024;
const GIB = 1024 * MIB;

const env = (overrides: Partial<RuntimeEnv> = {}): RuntimeEnv => ({
  hardwareConcurrency: 8,
  mobile: false,
  ...overrides,
});

describe("resolveParallelism", () => {
  it("コア数の半分を使う", () => {
    expect(resolveParallelism(env({ hardwareConcurrency: 8 }))).toBe(4);
    expect(resolveParallelism(env({ hardwareConcurrency: 4 }))).toBe(2);
    expect(resolveParallelism(env({ hardwareConcurrency: 2 }))).toBe(1);
  });

  it("メモリが律速なので上限を超えない", () => {
    expect(resolveParallelism(env({ hardwareConcurrency: 64 }))).toBe(
      HARD_MAX_PARALLEL,
    );
  });

  it("コア数が 1 でも 0 にならない", () => {
    expect(resolveParallelism(env({ hardwareConcurrency: 1 }))).toBe(1);
  });

  it("hardwareConcurrency 不明時は既定値から決める", () => {
    expect(resolveParallelism(env({ hardwareConcurrency: undefined }))).toBe(2);
  });

  it("モバイルは常に直列", () => {
    expect(
      resolveParallelism(env({ mobile: true, hardwareConcurrency: 8 })),
    ).toBe(1);
  });

  it("デバッグ指定はモバイル判定より優先する", () => {
    expect(
      resolveParallelism(env({ mobile: true, parallelOverride: 3 })),
    ).toBe(3);
  });

  it("不正なデバッグ指定は無視する", () => {
    expect(resolveParallelism(env({ parallelOverride: 0 }))).toBe(4);
    expect(resolveParallelism(env({ parallelOverride: null }))).toBe(4);
  });
});

describe("resolveBudgetBytes", () => {
  it("搭載メモリの 25% を使う", () => {
    expect(resolveBudgetBytes(env({ deviceMemory: 8 }))).toBe(2 * GIB);
    expect(resolveBudgetBytes(env({ deviceMemory: 4 }))).toBe(1 * GIB);
  });

  it("下限 512MiB / 上限 2GiB でクランプする", () => {
    expect(resolveBudgetBytes(env({ deviceMemory: 1 }))).toBe(512 * MIB);
    expect(resolveBudgetBytes(env({ deviceMemory: 64 }))).toBe(2 * GIB);
  });

  it("deviceMemory 非対応ブラウザでは控えめな既定値", () => {
    expect(resolveBudgetBytes(env({ deviceMemory: undefined }))).toBe(1 * GIB);
  });
});

describe("estimateJobBytes", () => {
  const base = {
    inputSize: 10 * MIB,
    durationMs: 60_000,
    sampleRate: 44100,
    channels: 2,
  };

  it("PCM 展開後のサイズを見積もる", () => {
    // 60秒 × 44100 × 2ch × 4byte = 21,168,000
    const pcm = 60 * 44100 * 2 * 4;
    expect(
      estimateJobBytes({ ...base, usesIntermediate: false }),
    ).toBe(10 * MIB + pcm + WORKING_SET_BYTES);
  });

  it("正規化パスは中間ファイルの分だけ増える", () => {
    const pcm = 60 * 44100 * 2 * 4;
    expect(estimateJobBytes({ ...base, usesIntermediate: true })).toBe(
      10 * MIB + pcm * 2 + WORKING_SET_BYTES,
    );
  });

  it("長さ不明なら入力サイズから粗く見積もる", () => {
    expect(
      estimateJobBytes({
        inputSize: 1 * MIB,
        durationMs: null,
        sampleRate: null,
        channels: null,
        usesIntermediate: false,
      }),
    ).toBe(1 * MIB + 12 * MIB + WORKING_SET_BYTES);
  });

  it("サンプルレート・チャンネル不明時も破綻しない", () => {
    const bytes = estimateJobBytes({
      inputSize: 1 * MIB,
      durationMs: 1000,
      sampleRate: null,
      channels: null,
      usesIntermediate: false,
    });
    expect(bytes).toBe(1 * MIB + 48000 * 2 * 4 + WORKING_SET_BYTES);
  });
});

describe("MemoryGate", () => {
  it("予算内なら待たずに通す", async () => {
    const gate = new MemoryGate(1000);
    await gate.admit(400);
    await gate.admit(400);
    expect(gate.activeCount).toBe(2);
    expect(gate.inFlightBytes).toBe(800);
  });

  it("予算を超える要求は解放まで待つ", async () => {
    const gate = new MemoryGate(1000);
    await gate.admit(700);

    let admitted = false;
    const pending = gate.admit(700).then(() => {
      admitted = true;
    });

    await Promise.resolve();
    expect(admitted).toBe(false);
    expect(gate.activeCount).toBe(1);

    gate.release(700);
    await pending;
    expect(admitted).toBe(true);
    expect(gate.inFlightBytes).toBe(700);
  });

  it("実行中が 0 件なら予算超過でも単独実行を許す", async () => {
    const gate = new MemoryGate(100);
    await gate.admit(10_000);
    expect(gate.activeCount).toBe(1);
    expect(gate.inFlightBytes).toBe(10_000);
  });

  it("巨大ジョブが並ぶと実質直列になる", async () => {
    const gate = new MemoryGate(1000);
    const huge = 900;
    const order: number[] = [];

    const run = async (id: number) => {
      await gate.admit(huge);
      order.push(id);
      expect(gate.activeCount).toBe(1);
      gate.release(huge);
    };

    await Promise.all([run(1), run(2), run(3)]);
    expect(order).toEqual([1, 2, 3]);
  });

  it("解放後に待機中の全要求が再評価される", async () => {
    const gate = new MemoryGate(1000);
    await gate.admit(600);
    const a = gate.admit(300);
    const b = gate.admit(300);
    gate.release(600);
    await Promise.all([a, b]);
    expect(gate.activeCount).toBe(2);
    expect(gate.inFlightBytes).toBe(600);
  });
});
