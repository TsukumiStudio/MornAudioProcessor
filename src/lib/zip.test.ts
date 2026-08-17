import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ZIP32_LIMIT, ZipTooLargeError, createZipBlob } from "./zip";

const FIXED_DATE = new Date(2026, 7, 17, 12, 34, 56);

const text = (s: string) => new Blob([new TextEncoder().encode(s)]);

async function zipBytes(
  entries: { name: string; blob: Blob }[],
): Promise<Uint8Array> {
  const blob = await createZipBlob(entries, undefined, FIXED_DATE);
  return new Uint8Array(await blob.arrayBuffer());
}

function writeTemp(bytes: Uint8Array): string {
  const dir = mkdtempSync(join(tmpdir(), "zip-test-"));
  const zipPath = join(dir, "test.zip");
  writeFileSync(zipPath, bytes);
  return zipPath;
}

/**
 * Python の zipfile で展開して検証する。
 * CRC の検証 (testzip) までやってくれ、ファイル名の UTF-8 フラグ (bit 11) も
 * 正しく解釈する。macOS 同梱の Info-ZIP unzip は bit 11 を無視して非 ASCII 名を
 * 化かすため、オラクルには使わない。
 */
function extractWithPython(bytes: Uint8Array): Record<string, string> {
  const zipPath = writeTemp(bytes);
  const script = `
import json, sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
bad = z.testzip()
if bad is not None:
    raise SystemExit("CRC error in " + bad)
print(json.dumps({i.filename: z.read(i).decode("utf-8") for i in z.infolist()}))
`;
  const out = execFileSync("python3", ["-c", script, zipPath], {
    encoding: "utf-8",
  });
  return JSON.parse(out);
}

describe("createZipBlob", () => {
  it("ZIP のシグネチャとエントリ数が正しい", async () => {
    const bytes = await zipBytes([
      { name: "a.txt", blob: text("hello") },
      { name: "b.txt", blob: text("world!") },
    ]);
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    const eocd = bytes.length - 22;
    expect(Array.from(bytes.slice(eocd, eocd + 4))).toEqual([
      0x50, 0x4b, 0x05, 0x06,
    ]);
    expect(bytes[eocd + 8] | (bytes[eocd + 9] << 8)).toBe(2);
    expect(bytes[eocd + 10] | (bytes[eocd + 11] << 8)).toBe(2);
  });

  it("展開して中身と CRC が一致する", async () => {
    const bytes = await zipBytes([
      { name: "first.txt", blob: text("hello zip") },
      { name: "second.txt", blob: text("second file content") },
    ]);
    expect(extractWithPython(bytes)).toEqual({
      "first.txt": "hello zip",
      "second.txt": "second file content",
    });
  });

  it("日本語ファイル名を UTF-8 として展開できる", async () => {
    const bytes = await zipBytes([
      { name: "音声_処理済み.txt", blob: text("にほんご") },
    ]);
    expect(extractWithPython(bytes)).toEqual({
      "音声_処理済み.txt": "にほんご",
    });
  });

  it("ASCII 名なら unzip コマンドでも展開できる", async () => {
    const bytes = await zipBytes([{ name: "plain.txt", blob: text("ok") }]);
    const zipPath = writeTemp(bytes);
    const outDir = join(zipPath, "..", "out");
    execFileSync("unzip", ["-q", zipPath, "-d", outDir]);
    expect(readdirSync(outDir)).toEqual(["plain.txt"]);
    expect(readFileSync(join(outDir, "plain.txt"), "utf-8")).toBe("ok");
  });

  it("空ファイルを含んでいても壊れない", async () => {
    const bytes = await zipBytes([
      { name: "empty.txt", blob: text("") },
      { name: "nonempty.txt", blob: text("x") },
    ]);
    expect(extractWithPython(bytes)).toEqual({
      "empty.txt": "",
      "nonempty.txt": "x",
    });
  });

  it("同名エントリには連番を付けて衝突を避ける", async () => {
    const bytes = await zipBytes([
      { name: "same.txt", blob: text("one") },
      { name: "same.txt", blob: text("two") },
      { name: "same.txt", blob: text("three") },
    ]);
    expect(extractWithPython(bytes)).toEqual({
      "same.txt": "one",
      "same_2.txt": "two",
      "same_3.txt": "three",
    });
  });

  it("エントリ 0 個でも有効な空 ZIP になる", async () => {
    const bytes = await zipBytes([]);
    expect(bytes.length).toBe(22);
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x05, 0x06]);
  });

  it("バイナリデータが 1 バイトも変わらない", async () => {
    const binary = new Uint8Array(4096);
    for (let i = 0; i < binary.length; i++) binary[i] = (i * 7) % 256;
    const bytes = await zipBytes([
      { name: "data.bin", blob: new Blob([binary]) },
    ]);
    const zipPath = writeTemp(bytes);
    const script = `
import sys, zipfile
z = zipfile.ZipFile(sys.argv[1])
sys.stdout.buffer.write(z.read("data.bin"))
`;
    const out = execFileSync("python3", ["-c", script, zipPath], {
      encoding: "buffer",
    });
    expect(new Uint8Array(out)).toEqual(binary);
  });

  it("多数のエントリでも全件を取り出せる", async () => {
    const entries = Array.from({ length: 60 }, (_, i) => ({
      name: `track_${i}.txt`,
      blob: text(`body ${i}`),
    }));
    const extracted = extractWithPython(await zipBytes(entries));
    expect(Object.keys(extracted)).toHaveLength(60);
    expect(extracted["track_59.txt"]).toBe("body 59");
  });

  it("進捗コールバックが全ファイル分呼ばれる", async () => {
    const calls: [number, number][] = [];
    await createZipBlob(
      [
        { name: "a", blob: text("a") },
        { name: "b", blob: text("b") },
        { name: "c", blob: text("c") },
      ],
      (done, total) => calls.push([done, total]),
      FIXED_DATE,
    );
    expect(calls).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it("1980 年より前の日時でも DOS 形式に収まる", async () => {
    const blob = await createZipBlob(
      [{ name: "old.txt", blob: text("x") }],
      undefined,
      new Date(1970, 0, 1),
    );
    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(extractWithPython(bytes)).toEqual({ "old.txt": "x" });
  });

  it("4GB 超過の判定に使う上限値と例外が公開されている", () => {
    // 実際に 4GB の Blob はテストで作れないため、境界値と例外型のみ固定する。
    // 呼び出し側はこの例外を捕まえて個別ダウンロードにフォールバックする。
    expect(ZIP32_LIMIT).toBe(0xffffffff);
    expect(new ZipTooLargeError().name).toBe("ZipTooLargeError");
  });
});
