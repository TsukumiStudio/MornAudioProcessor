import type { ProcessingOptions } from "../types";
import { frequencyGroup } from "../schema/frequency";
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

  if (options.dynamics_filter) {
    const df = options.dynamics_filter;
    if (df.compressor.enabled) {
      const c = df.compressor;
      filters.push(`acompressor=threshold=${c.threshold}:ratio=${c.ratio}:attack=${c.attack}:release=${c.release}:makeup=${c.makeup}:knee=${c.knee}:mode=${c.mode}:detection=${c.detection}:link=${c.link}:mix=${c.mix}:level_in=${c.level_in}`);
    }
    if (df.limiter.enabled) {
      const l = df.limiter;
      filters.push(`alimiter=limit=${l.limit}:attack=${l.attack}:release=${l.release}:level=${l.level ? 1 : 0}:level_in=${l.level_in}:level_out=${l.level_out}:asc=${l.asc ? 1 : 0}:asc_level=${l.asc_level}`);
    }
    if (df.gate.enabled) {
      const g = df.gate;
      filters.push(`agate=threshold=${g.threshold}:ratio=${g.ratio}:range=${g.range}:attack=${g.attack}:release=${g.release}:makeup=${g.makeup}:knee=${g.knee}:mode=${g.mode}:detection=${g.detection}:link=${g.link}`);
    }
  }

  if (options.effect_filter) {
    const ef = options.effect_filter;
    if (ef.echo.enabled) {
      const e = ef.echo;
      filters.push(`aecho=${e.in_gain}:${e.out_gain}:${e.delays}:${e.decays}`);
    }
    if (ef.chorus.enabled) {
      const ch = ef.chorus;
      filters.push(`chorus=${ch.in_gain}:${ch.out_gain}:${ch.delays}:${ch.decays}:${ch.speeds}:${ch.depths}`);
    }
    if (ef.flanger.enabled) {
      const fl = ef.flanger;
      filters.push(`flanger=delay=${fl.delay}:depth=${fl.depth}:regen=${fl.regen}:width=${fl.width}:speed=${fl.speed}:shape=${fl.shape}:phase=${fl.phase}:interp=${fl.interp}`);
    }
    if (ef.phaser.enabled) {
      const ph = ef.phaser;
      filters.push(`aphaser=in_gain=${ph.in_gain}:out_gain=${ph.out_gain}:delay=${ph.delay}:decay=${ph.decay}:speed=${ph.speed}:type=${ph.type}`);
    }
    if (ef.tremolo.enabled) {
      const tr = ef.tremolo;
      filters.push(`tremolo=f=${tr.f}:d=${tr.d}`);
    }
    if (ef.vibrato.enabled) {
      const vb = ef.vibrato;
      filters.push(`vibrato=f=${vb.f}:d=${vb.d}`);
    }
    if (ef.tempo.enabled) {
      const tp = ef.tempo;
      filters.push(`atempo=${tp.tempo}`);
    }
    if (ef.pitch.enabled && ef.pitch.semitones !== 0 && options.input_sample_rate) {
      const ratio = Math.pow(2, ef.pitch.semitones / 12);
      const origRate = options.input_sample_rate;
      const newRate = Math.round(origRate * ratio);
      const tempoCompensation = 1 / ratio;
      filters.push(`asetrate=${newRate}`, `atempo=${tempoCompensation}`, `aresample=${origRate}`);
    }
  }

  // --- Frequency Ext ---
  if (options.frequency_filter_ext) {
    const fe = options.frequency_filter_ext;
    if (fe.bass.enabled) {
      const b = fe.bass;
      filters.push(`bass=g=${b.gain}:f=${b.frequency}:t=${b.width_type}:w=${b.width}:p=${b.poles}:m=${b.mix}`);
    }
    if (fe.treble.enabled) {
      const t = fe.treble;
      filters.push(`treble=g=${t.gain}:f=${t.frequency}:t=${t.width_type}:w=${t.width}:p=${t.poles}:m=${t.mix}`);
    }
    if (fe.bandreject.enabled) {
      const br = fe.bandreject;
      filters.push(`bandreject=f=${br.frequency}:t=${br.width_type}:w=${br.width}:m=${br.mix}`);
    }
    if (fe.tiltshelf.enabled) {
      const ts = fe.tiltshelf;
      filters.push(`tiltshelf=g=${ts.gain}:f=${ts.frequency}:t=${ts.width_type}:w=${ts.width}:p=${ts.poles}:m=${ts.mix}`);
    }
    if (fe.allpass.enabled) {
      const ap = fe.allpass;
      filters.push(`allpass=f=${ap.frequency}:t=${ap.width_type}:w=${ap.width}:m=${ap.mix}:o=${ap.order}`);
    }
    if (fe.asubboost.enabled) {
      const sb = fe.asubboost;
      filters.push(`asubboost=dry=${sb.dry}:wet=${sb.wet}:boost=${sb.boost}:decay=${sb.decay}:feedback=${sb.feedback}:cutoff=${sb.cutoff}:slope=${sb.slope}:delay=${sb.delay}`);
    }
    if (fe.asubcut.enabled) {
      const sc = fe.asubcut;
      filters.push(`asubcut=cutoff=${sc.cutoff}:order=${sc.order}:level=${sc.level}`);
    }
    if (fe.asupercut.enabled) {
      const sp = fe.asupercut;
      filters.push(`asupercut=cutoff=${sp.cutoff}:order=${sp.order}:level=${sp.level}`);
    }
    if (fe.adynamicequalizer.enabled) {
      const de = fe.adynamicequalizer;
      filters.push(`adynamicequalizer=threshold=${de.threshold}:dfrequency=${de.dfrequency}:dqfactor=${de.dqfactor}:tfrequency=${de.tfrequency}:tqfactor=${de.tqfactor}:attack=${de.attack}:release=${de.release}:ratio=${de.ratio}:makeup=${de.makeup}:range=${de.range}:mode=${de.mode}:dftype=${de.dftype}:tftype=${de.tftype}`);
    }
  }

  // --- Dynamics Ext ---
  if (options.dynamics_filter_ext) {
    const de = options.dynamics_filter_ext;
    if (de.dynaudnorm.enabled) {
      const d = de.dynaudnorm;
      filters.push(`dynaudnorm=framelen=${d.framelen}:gausssize=${d.gausssize}:peak=${d.peak}:maxgain=${d.maxgain}:targetrms=${d.targetrms}:coupling=${d.coupling ? 1 : 0}:correctdc=${d.correctdc ? 1 : 0}:altboundary=${d.altboundary ? 1 : 0}:compress=${d.compress}:threshold=${d.threshold}:overlap=${d.overlap}`);
    }
    if (de.speechnorm.enabled) {
      const s = de.speechnorm;
      filters.push(`speechnorm=peak=${s.peak}:expansion=${s.expansion}:compression=${s.compression}:threshold=${s.threshold}:raise=${s.raise}:fall=${s.fall}:invert=${s.invert ? 1 : 0}:link=${s.link ? 1 : 0}:rms=${s.rms}`);
    }
    if (de.compand.enabled) {
      const c = de.compand;
      filters.push(`compand=attacks=${c.attacks}:decays=${c.decays}:points=${c.points}:soft-knee=${c.soft_knee}:gain=${c.gain}:volume=${c.volume}:delay=${c.delay}`);
    }
    if (de.asoftclip.enabled) {
      const a = de.asoftclip;
      filters.push(`asoftclip=type=${a.type}:threshold=${a.threshold}:output=${a.output}:param=${a.param}:oversample=${a.oversample}`);
    }
    if (de.apsyclip.enabled) {
      const a = de.apsyclip;
      filters.push(`apsyclip=level_in=${a.level_in}:level_out=${a.level_out}:clip=${a.clip}:diff=${a.diff ? 1 : 0}:adaptive=${a.adaptive}:iterations=${a.iterations}:level=${a.level ? 1 : 0}`);
    }
  }

  // --- Effect Ext ---
  if (options.effect_filter_ext) {
    const ee = options.effect_filter_ext;
    if (ee.afade_in.enabled) {
      const a = ee.afade_in;
      filters.push(`afade=t=in:st=${a.start_time}:d=${a.duration}:curve=${a.curve}:silence=${a.silence}:unity=${a.unity}`);
    }
    if (ee.afade_out.enabled) {
      const a = ee.afade_out;
      filters.push(`afade=t=out:st=${a.start_time}:d=${a.duration}:curve=${a.curve}:silence=${a.silence}:unity=${a.unity}`);
    }
    if (ee.acrusher.enabled) {
      const a = ee.acrusher;
      filters.push(`acrusher=level_in=${a.level_in}:level_out=${a.level_out}:bits=${a.bits}:mix=${a.mix}:mode=${a.mode}:dc=${a.dc}:aa=${a.aa}:samples=${a.samples}:lfo=${a.lfo ? 1 : 0}:lforange=${a.lforange}:lforate=${a.lforate}`);
    }
    if (ee.aexciter.enabled) {
      const a = ee.aexciter;
      filters.push(`aexciter=level_in=${a.level_in}:level_out=${a.level_out}:amount=${a.amount}:drive=${a.drive}:blend=${a.blend}:freq=${a.freq}:ceil=${a.ceil}:listen=${a.listen ? 1 : 0}`);
    }
    if (ee.crystalizer.enabled) {
      const c = ee.crystalizer;
      filters.push(`crystalizer=i=${c.i}:c=${c.c ? 1 : 0}`);
    }
    if (ee.areverse.enabled) {
      filters.push("areverse");
    }
    if (ee.aloop.enabled) {
      const a = ee.aloop;
      filters.push(`aloop=loop=${a.loop}:size=${a.size}:start=${a.start}`);
    }
    if (ee.afreqshift.enabled) {
      const a = ee.afreqshift;
      filters.push(`afreqshift=shift=${a.shift}:level=${a.level}:order=${a.order}`);
    }
    if (ee.apulsator.enabled) {
      const a = ee.apulsator;
      filters.push(`apulsator=level_in=${a.level_in}:level_out=${a.level_out}:mode=${a.mode}:amount=${a.amount}:offset_l=${a.offset_l}:offset_r=${a.offset_r}:width=${a.width}:timing=${a.timing}:bpm=${a.bpm}:ms=${a.ms}:hz=${a.hz}`);
    }
    if (ee.adelay.enabled) {
      const a = ee.adelay;
      filters.push(`adelay=${a.delays}:all=${a.all ? 1 : 0}`);
    }
    if (ee.compensationdelay.enabled) {
      const c = ee.compensationdelay;
      filters.push(`compensationdelay=mm=${c.mm}:cm=${c.cm}:m=${c.m}:dry=${c.dry}:wet=${c.wet}:temp=${c.temp}`);
    }
    if (ee.dcshift.enabled) {
      const d = ee.dcshift;
      filters.push(`dcshift=shift=${d.shift}:limitergain=${d.limitergain}`);
    }
    if (ee.apad.enabled) {
      const a = ee.apad;
      filters.push(`apad=pad_dur=${a.pad_dur}:whole_dur=${a.whole_dur}`);
    }
  }

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
