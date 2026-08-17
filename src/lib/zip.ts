/**
 * 無圧縮（store 方式）の ZIP を組み立てる。
 *
 * 音声ファイルは mp3/ogg/flac が既に圧縮済みで、wav も deflate の効きが限定的なため、
 * 圧縮ライブラリを持ち込まず store 方式にしている。
 *
 * メモリの扱いが重要な点:
 * - CRC32 の計算は 1 ファイルずつストリームで読む（全ファイルを同時に展開しない）
 * - 最終的な ZIP は `new Blob([...ヘッダ, 元の Blob, ...])` として組み立てる。
 *   元の Blob を参照するだけなので中身をコピーせず、ブラウザがディスクに退避したまま
 *   扱える。ここで arrayBuffer() を使うと出力サイズ分の RAM を追加で食うので避ける。
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

/** ストリームで読みながら CRC32 と長さを求める（ファイル全体を RAM に載せない） */
async function crc32OfBlob(blob: Blob): Promise<{ crc: number; size: number }> {
  let crc = 0xffffffff;
  let size = 0;
  const reader = blob.stream().getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = value as Uint8Array;
    size += chunk.length;
    for (let i = 0; i < chunk.length; i++) {
      crc = CRC_TABLE[(crc ^ chunk[i]) & 0xff] ^ (crc >>> 8);
    }
  }
  return { crc: (crc ^ 0xffffffff) >>> 0, size };
}

/** ZIP の日時は MS-DOS 形式（2 秒刻み、1980 年起点） */
function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(date.getFullYear(), 1980);
  return {
    time:
      (date.getHours() << 11) |
      (date.getMinutes() << 5) |
      (Math.floor(date.getSeconds() / 2) & 0x1f),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

class ByteWriter {
  private bytes: number[] = [];

  u16(v: number) {
    this.bytes.push(v & 0xff, (v >>> 8) & 0xff);
  }

  u32(v: number) {
    this.bytes.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
  }

  raw(data: Uint8Array) {
    for (const b of data) this.bytes.push(b);
  }

  toUint8Array(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

export interface ZipEntry {
  name: string;
  blob: Blob;
}

/** ZIP32 の上限（サイズ・オフセットが 4GB を超えると表現できない） */
export const ZIP32_LIMIT = 0xffffffff;

export class ZipTooLargeError extends Error {
  constructor() {
    super("ZIP が 4GB を超えるため作成できません");
    this.name = "ZipTooLargeError";
  }
}

/** 同名エントリがあれば連番を付けて衝突を避ける */
function uniqueNames(entries: ZipEntry[]): string[] {
  const used = new Set<string>();
  return entries.map((entry) => {
    if (!used.has(entry.name)) {
      used.add(entry.name);
      return entry.name;
    }
    const dot = entry.name.lastIndexOf(".");
    const base = dot > 0 ? entry.name.slice(0, dot) : entry.name;
    const ext = dot > 0 ? entry.name.slice(dot) : "";
    for (let i = 2; ; i++) {
      const candidate = `${base}_${i}${ext}`;
      if (!used.has(candidate)) {
        used.add(candidate);
        return candidate;
      }
    }
  });
}

/**
 * ZIP を Blob として組み立てる。
 * onProgress には CRC 計算が終わったファイル数を渡す（大量ファイルで進捗を出すため）。
 */
export async function createZipBlob(
  entries: ZipEntry[],
  onProgress?: (done: number, total: number) => void,
  now: Date = new Date(),
): Promise<Blob> {
  const names = uniqueNames(entries);
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(now);

  const parts: BlobPart[] = [];
  const central = new ByteWriter();
  let offset = 0;

  for (let i = 0; i < entries.length; i++) {
    const nameBytes = encoder.encode(names[i]);
    const { crc, size } = await crc32OfBlob(entries[i].blob);

    if (size > ZIP32_LIMIT || offset > ZIP32_LIMIT) throw new ZipTooLargeError();

    const local = new ByteWriter();
    local.u32(0x04034b50); // local file header signature
    local.u16(20); // version needed
    local.u16(0x0800); // ファイル名を UTF-8 として扱わせる
    local.u16(0); // 圧縮方式: store
    local.u16(time);
    local.u16(date);
    local.u32(crc);
    local.u32(size); // compressed size（store なので同じ）
    local.u32(size);
    local.u16(nameBytes.length);
    local.u16(0); // extra field なし
    local.raw(nameBytes);

    const localBytes = local.toUint8Array();
    parts.push(localBytes, entries[i].blob);

    central.u32(0x02014b50); // central directory header signature
    central.u16(20); // version made by
    central.u16(20); // version needed
    central.u16(0x0800);
    central.u16(0);
    central.u16(time);
    central.u16(date);
    central.u32(crc);
    central.u32(size);
    central.u32(size);
    central.u16(nameBytes.length);
    central.u16(0); // extra
    central.u16(0); // comment
    central.u16(0); // disk number
    central.u16(0); // internal attrs
    central.u32(0); // external attrs
    central.u32(offset); // local header のオフセット
    central.raw(nameBytes);

    offset += localBytes.length + size;
    onProgress?.(i + 1, entries.length);
  }

  const centralBytes = central.toUint8Array();
  if (offset > ZIP32_LIMIT || centralBytes.length > ZIP32_LIMIT) {
    throw new ZipTooLargeError();
  }

  const end = new ByteWriter();
  end.u32(0x06054b50); // end of central directory signature
  end.u16(0); // このディスクの番号
  end.u16(0); // central directory の開始ディスク
  end.u16(entries.length);
  end.u16(entries.length);
  end.u32(centralBytes.length);
  end.u32(offset);
  end.u16(0); // コメントなし

  parts.push(centralBytes, end.toUint8Array());
  return new Blob(parts, { type: "application/zip" });
}
