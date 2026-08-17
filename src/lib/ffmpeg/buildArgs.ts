import type { ProcessingOptions } from "../types";
import { dynamicsGroup } from "../schema/dynamics";
import { dynamicsExtGroup } from "../schema/dynamicsExt";
import { effectGroup } from "../schema/effect";
import { effectExtGroup } from "../schema/effectExt";
import { frequencyGroup } from "../schema/frequency";
import { frequencyExtGroup } from "../schema/frequencyExt";
import { repairGroup } from "../schema/repair";
import { stereoGroup } from "../schema/stereo";
import { serializeGroup } from "../schema/helpers";
import type { FilterDef } from "../schema/types";

/** スキーマ定義を serializeGroup が受け取れる形に落とす（型の見かけを揃えるだけ） */
function schemaGroup(
  group: Record<string, unknown>,
): Record<string, FilterDef<{ enabled: boolean }, never>> {
  return group as Record<string, FilterDef<{ enabled: boolean }, never>>;
}

/**
 * ffmpeg の引数組み立て（純粋関数）。
 * ブラウザ API に触らないので Node 上のテストから直接検証できる。
 */
export function buildFFmpegArgs(options: ProcessingOptions): string[] {
  const inputName = "input" + getExtWithDot(options.input_file.name);
  const outputName = options.output_name;
  const args: string[] = ["-i", inputName];

  // アルバムアート入力
  if (options.album_art) {
    args.push("-i", getAlbumArtVfsName(options.album_art));
  }

  // トリミング
  if (options.trim) {
    if (options.trim.start) args.push("-ss", options.trim.start);
    if (options.trim.end) args.push("-to", options.trim.end);
  }

  // オーディオフィルタ
  const filters: string[] = [];

  if (options.silence_remove) {
    const sr = options.silence_remove;
    const parts: string[] = [];
    if (sr.remove_start) {
      parts.push(
        `start_periods=1:start_silence=0:start_threshold=${sr.threshold_start_db}dB`,
      );
    }
    if (sr.remove_end) {
      parts.push(
        `stop_periods=-1:stop_silence=0:stop_threshold=${sr.threshold_end_db}dB`,
      );
    }
    if (parts.length > 0) {
      filters.push(`silenceremove=${parts.join(":")}`);
    }
  }

  if (options.noise_reduce) {
    const nr = options.noise_reduce;
    if (nr.type === "afftdn") {
      filters.push(`afftdn=nr=${nr.nr}:nf=${nr.nf}`);
    } else if (nr.type === "anlmdn") {
      filters.push(`anlmdn=s=${nr.strength}`);
    }
  }

  filters.push(
    ...serializeGroup(schemaGroup(frequencyGroup), options.frequency_filter, {
      input_sample_rate: options.input_sample_rate,
    }),
  );

  filters.push(
    ...serializeGroup(schemaGroup(dynamicsGroup), options.dynamics_filter, {
      input_sample_rate: options.input_sample_rate,
    }),
  );

  filters.push(
    ...serializeGroup(schemaGroup(effectGroup), options.effect_filter, {
      input_sample_rate: options.input_sample_rate,
    }),
  );

  filters.push(
    ...serializeGroup(
      schemaGroup(frequencyExtGroup),
      options.frequency_filter_ext,
      { input_sample_rate: options.input_sample_rate },
    ),
  );

  // --- Dynamics Ext ---
  filters.push(
    ...serializeGroup(schemaGroup(dynamicsExtGroup), options.dynamics_filter_ext, {
      input_sample_rate: options.input_sample_rate,
    }),
  );

  // --- Effect Ext ---
  filters.push(
    ...serializeGroup(schemaGroup(effectExtGroup), options.effect_filter_ext, {
      input_sample_rate: options.input_sample_rate,
    }),
  );

  // --- Repair ---
  filters.push(
    ...serializeGroup(schemaGroup(repairGroup), options.repair_filter, {
      input_sample_rate: options.input_sample_rate,
    }),
  );

  // --- Stereo ---
  filters.push(
    ...serializeGroup(schemaGroup(stereoGroup), options.stereo_filter, {
      input_sample_rate: options.input_sample_rate,
    }),
  );

  if (options.channel_filter) {
    const cf = options.channel_filter;
    if (cf.conversion === "to_mono") {
      filters.push("pan=mono|c0=0.5*c0+0.5*c1");
    } else if (cf.conversion === "to_stereo") {
      const lg = cf.balance <= 0 ? 1 : 1 - cf.balance;
      const rg = cf.balance >= 0 ? 1 : 1 + cf.balance;
      filters.push(`pan=stereo|FL=${lg}*c0|FR=${rg}*c0`);
    } else if (cf.balance !== 0) {
      const lg = cf.balance <= 0 ? 1 : 1 - cf.balance;
      const rg = cf.balance >= 0 ? 1 : 1 + cf.balance;
      filters.push(`pan=stereo|FL=${lg}*FL|FR=${rg}*FR`);
    }
  }

  if (options.volume) {
    // normalize の場合は processFile 側で2パス処理し、adjust に変換済み
    if (options.volume.type === "adjust") {
      filters.push(`volume=${options.volume.db}dB`);
    }
  }

  // ストリームマッピング（アルバムアート使用時）
  if (options.album_art) {
    args.push("-map", "0:a", "-map", "1:v");
  }

  if (filters.length > 0) {
    args.push("-af", filters.join(","));
  }

  appendAlbumArtArgs(args, options, outputName);
  appendOutputEncoding(args, options, outputName);
  appendMetadata(args, options);

  args.push("-y", outputName);
  return args;
}

export function getExtWithDot(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.substring(dot) : "";
}

/** アルバムアートの VFS ファイル名を返す */
export function getAlbumArtVfsName(file: File): string {
  return "cover_art" + getExtWithDot(file.name);
}

/** アルバムアート用の -map, -c:v copy, -id3v2_version を args に追加 */
export function appendAlbumArtArgs(
  args: string[],
  options: ProcessingOptions,
  outputName: string,
) {
  if (!options.album_art) return;
  args.push("-c:v", "copy");
  const ext = getExtWithDot(outputName).toLowerCase();
  if (ext === ".mp3") {
    args.push("-id3v2_version", "3");
  }
}

/** メタデータを args に追加 */
export function appendMetadata(
  args: string[],
  options: ProcessingOptions,
) {
  if (!options.metadata) return;
  for (const [key, value] of Object.entries(options.metadata)) {
    if (value) {
      args.push("-metadata", `${key}=${value}`);
    }
  }
}

/** ビットレート・サンプルレート・ビット解像度・OGGクオリティを args に追加 */
export function appendOutputEncoding(
  args: string[],
  options: ProcessingOptions,
  outputName: string,
) {
  if (options.bitrate) {
    args.push("-b:a", options.bitrate);
  }
  if (options.sample_rate) {
    args.push("-ar", options.sample_rate.toString());
  }
  if (options.bit_depth) {
    const ext = getExtWithDot(outputName).toLowerCase();
    if (ext === ".wav") {
      const wavCodec: Record<string, string> = {
        "16": "pcm_s16le",
        "24": "pcm_s24le",
        "32": "pcm_s32le",
        "f32": "pcm_f32le",
        "f64": "pcm_f64le",
      };
      const codec = wavCodec[options.bit_depth];
      if (codec) args.push("-c:a", codec);
    } else if (ext === ".flac") {
      if (options.bit_depth === "16") {
        args.push("-sample_fmt", "s16");
      } else if (options.bit_depth === "24") {
        args.push("-sample_fmt", "s32", "-bits_per_raw_sample", "24");
      } else if (options.bit_depth === "32") {
        args.push("-sample_fmt", "s32");
      }
    }
  }
  if (options.ogg_quality != null) {
    const ext = getExtWithDot(outputName).toLowerCase();
    if (ext === ".ogg") {
      args.push("-q:a", (options.ogg_quality * 10).toString());
    }
  }
}
