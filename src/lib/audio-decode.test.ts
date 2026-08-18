import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * 計測 Worker は 1 つを使い回すため、複数ファイルの解析が並列に走ると
 * 同じ Worker に複数の要求が同時に飛ぶ。message イベントは登録された全リスナへ
 * 配られるので、要求と応答の対応づけが無いと最初に返った 1 件の計測値が
 * 待機中の全ファイルの結果になってしまう（実際にそうなっていた）。
 */

interface PostedRequest {
  id: number;
  sampleRate: number;
}

/** 応答を任意の順番で返せる Worker のスタブ */
class FakeWorker extends EventTarget {
  static latest: FakeWorker | null = null;
  readonly posted: PostedRequest[] = [];
  onerror: ((event: unknown) => void) | null = null;

  constructor() {
    super();
    FakeWorker.latest = this;
  }

  postMessage(data: PostedRequest) {
    this.posted.push({ id: data.id, sampleRate: data.sampleRate });
  }

  terminate() {}

  /** 指定した要求に対する応答を流す。値は id から一意に決まるようにしておく */
  respond(id: number) {
    this.dispatchEvent(
      new MessageEvent("message", {
        data: { id, peakDb: -id, rmsDb: -id * 10, lufs: -id * 100 },
      }),
    );
  }
}

function makeDecoded(sampleRate: number) {
  return {
    channels: [new Float32Array(4)],
    sampleRate,
    durationMs: 1000,
  };
}

async function loadModule() {
  vi.resetModules();
  vi.stubGlobal("Worker", FakeWorker);
  return import("./audio-decode");
}

afterEach(() => {
  vi.unstubAllGlobals();
  FakeWorker.latest = null;
});

describe("measureLoudness", () => {
  it("応答が投入順と違う順番で返っても、各要求が自分の結果を受け取る", async () => {
    const { measureLoudness } = await loadModule();

    const first = measureLoudness(makeDecoded(48000));
    const second = measureLoudness(makeDecoded(44100));
    const third = measureLoudness(makeDecoded(48000));

    const worker = FakeWorker.latest!;
    expect(worker.posted).toHaveLength(3);
    const [idA, idB, idC] = worker.posted.map((p) => p.id);
    expect(new Set([idA, idB, idC]).size).toBe(3);

    // わざと投入順と逆に返す
    worker.respond(idC);
    worker.respond(idA);
    worker.respond(idB);

    expect(await first).toEqual({ peakDb: -idA, rmsDb: -idA * 10, lufs: -idA * 100 });
    expect(await second).toEqual({ peakDb: -idB, rmsDb: -idB * 10, lufs: -idB * 100 });
    expect(await third).toEqual({ peakDb: -idC, rmsDb: -idC * 10, lufs: -idC * 100 });
  });

  it("他の要求の応答を先に受け取っても解決しない", async () => {
    const { measureLoudness } = await loadModule();

    const pending = measureLoudness(makeDecoded(48000));
    const other = measureLoudness(makeDecoded(48000));

    const worker = FakeWorker.latest!;
    const [idA, idB] = worker.posted.map((p) => p.id);

    let settled = false;
    void pending.then(() => {
      settled = true;
    });

    worker.respond(idB);
    await other;
    await Promise.resolve();

    expect(settled).toBe(false);

    worker.respond(idA);
    expect(await pending).toEqual({ peakDb: -idA, rmsDb: -idA * 10, lufs: -idA * 100 });
  });
});
