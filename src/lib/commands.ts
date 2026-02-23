import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { base } from "$app/paths";
import type {
  FfmpegInfo,
  AudioFileInfo,
  ProcessingOptions,
  ProcessingResult,
  ProgressInfo,
} from "./types";
import { getFileExtension } from "./utils";

let ffmpeg: FFmpeg | null = null;

export async function initFFmpeg(
  onProgress?: (message: string) => void,
): Promise<FfmpegInfo> {
  ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => {
    console.log("[ffmpeg]", message);
  });

  onProgress?.("Worker を起動中...");

  const loadPromise = ffmpeg.load({
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
    classWorkerURL: `${base}/ffmpeg-worker/worker.js`,
  });

  onProgress?.("FFmpeg コアを読み込み中...");

  // タイムアウト付きで待機（30秒）
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("FFmpeg の読み込みがタイムアウトしました（30秒）")),
      30000,
    ),
  );

  await Promise.race([loadPromise, timeout]);

  onProgress?.("初期化完了");
  return { version: "ffmpeg.wasm" };
}

function getFFmpeg(): FFmpeg {
  if (!ffmpeg) throw new Error("FFmpeg not initialized");
  return ffmpeg;
}

export async function resetFFmpeg(): Promise<void> {
  if (ffmpeg) {
    ffmpeg.terminate();
  }
  ffmpeg = new FFmpeg();
  ffmpeg.on("log", ({ message }) => {
    console.log("[ffmpeg]", message);
  });
  await ffmpeg.load({
    coreURL: `${base}/ffmpeg-core.js`,
    wasmURL: `${base}/ffmpeg-core.wasm`,
    classWorkerURL: `${base}/ffmpeg-worker/worker.js`,
  });
}

export async function getAudioInfo(file: File): Promise<AudioFileInfo> {
  const ff = getFFmpeg();
  const tempName = "probe_input" + getExtWithDot(file.name);

  await ff.writeFile(tempName, await fetchFile(file));
  const info = await probeAudioInfo(ff, tempName, file.size);

  // 埋め込みアルバムアートの抽出を試みる
  let albumArtUrl: string | null = null;
  try {
    const artOut = "probe_art_extract.jpg";
    await ff.exec(["-i", tempName, "-an", "-vcodec", "copy", "-y", artOut]);
    const artData = await ff.readFile(artOut);
    if (artData instanceof Uint8Array && artData.length > 100) {
      const mime = artData[0] === 0x89 && artData[1] === 0x50 ? "image/png" : "image/jpeg";
      albumArtUrl = URL.createObjectURL(new Blob([artData], { type: mime }));
    }
    try { await ff.deleteFile(artOut); } catch {}
  } catch {}

  await ff.deleteFile(tempName);

  return { ...info, name: file.name, albumArtUrl };
}

function buildFFmpegArgs(options: ProcessingOptions): string[] {
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

  if (options.frequency_filter) {
    const ff = options.frequency_filter;
    if (ff.equalizer.enabled) {
      const eq = ff.equalizer;
      filters.push(`equalizer=f=${eq.frequency}:t=${eq.width_type}:w=${eq.width}:g=${eq.gain}:mix=${eq.mix}`);
    }
    if (ff.highpass.enabled) {
      const hp = ff.highpass;
      filters.push(`highpass=f=${hp.frequency}:t=${hp.width_type}:w=${hp.width}:p=${hp.poles}:mix=${hp.mix}`);
    }
    if (ff.lowpass.enabled) {
      const lp = ff.lowpass;
      filters.push(`lowpass=f=${lp.frequency}:t=${lp.width_type}:w=${lp.width}:p=${lp.poles}:mix=${lp.mix}`);
    }
    if (ff.bandpass.enabled) {
      const bp = ff.bandpass;
      filters.push(`bandpass=f=${bp.frequency}:t=${bp.width_type}:w=${bp.width}:mix=${bp.mix}:csg=${bp.csg ? 1 : 0}`);
    }
  }

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
  if (options.repair_filter) {
    const rf = options.repair_filter;
    if (rf.adeclick.enabled) {
      const a = rf.adeclick;
      filters.push(`adeclick=window=${a.window}:overlap=${a.overlap}:arorder=${a.arorder}:threshold=${a.threshold}:burst=${a.burst}:method=${a.method}`);
    }
    if (rf.adeclip.enabled) {
      const a = rf.adeclip;
      filters.push(`adeclip=window=${a.window}:overlap=${a.overlap}:arorder=${a.arorder}:threshold=${a.threshold}:hsize=${a.hsize}:method=${a.method}`);
    }
    if (rf.afwtdn.enabled) {
      const a = rf.afwtdn;
      filters.push(`afwtdn=sigma=${a.sigma}:levels=${a.levels}:wavet=${a.wavet}:percent=${a.percent}:profile=${a.profile ? 1 : 0}:adaptive=${a.adaptive ? 1 : 0}:samples=${a.samples}:softness=${a.softness}`);
    }
    if (rf.deesser.enabled) {
      const d = rf.deesser;
      filters.push(`deesser=i=${d.i}:m=${d.m}:f=${d.f}:s=${d.s}`);
    }
  }

  // --- Stereo ---
  if (options.stereo_filter) {
    const sf = options.stereo_filter;
    if (sf.stereotools.enabled) {
      const s = sf.stereotools;
      filters.push(`stereotools=level_in=${s.level_in}:level_out=${s.level_out}:balance_in=${s.balance_in}:balance_out=${s.balance_out}:softclip=${s.softclip ? 1 : 0}:mutel=${s.mutel ? 1 : 0}:muter=${s.muter ? 1 : 0}:phasel=${s.phasel ? 1 : 0}:phaser=${s.phaser ? 1 : 0}:mode=${s.mode}:slev=${s.slev}:sbal=${s.sbal}:mlev=${s.mlev}:mpan=${s.mpan}:base=${s.base}:delay=${s.delay}:sclevel=${s.sclevel}:phase=${s.phase}:bmode_in=${s.bmode_in}:bmode_out=${s.bmode_out}`);
    }
    if (sf.stereowiden.enabled) {
      const s = sf.stereowiden;
      filters.push(`stereowiden=delay=${s.delay}:feedback=${s.feedback}:crossfeed=${s.crossfeed}:drymix=${s.drymix}`);
    }
    if (sf.extrastereo.enabled) {
      const e = sf.extrastereo;
      filters.push(`extrastereo=m=${e.m}:c=${e.c ? 1 : 0}`);
    }
    if (sf.crossfeed.enabled) {
      const c = sf.crossfeed;
      filters.push(`crossfeed=strength=${c.strength}:range=${c.range}:slope=${c.slope}:level_in=${c.level_in}:level_out=${c.level_out}`);
    }
    if (sf.haas.enabled) {
      const h = sf.haas;
      filters.push(`haas=level_in=${h.level_in}:level_out=${h.level_out}:side_gain=${h.side_gain}:middle_source=${h.middle_source}:middle_phase=${h.middle_phase ? 1 : 0}:left_delay=${h.left_delay}:left_balance=${h.left_balance}:left_gain=${h.left_gain}:left_phase=${h.left_phase ? 1 : 0}:right_delay=${h.right_delay}:right_balance=${h.right_balance}:right_gain=${h.right_gain}:right_phase=${h.right_phase ? 1 : 0}`);
    }
    if (sf.dialoguenhance.enabled) {
      const d = sf.dialoguenhance;
      filters.push(`dialoguenhance=original=${d.original}:enhance=${d.enhance}:voice=${d.voice}`);
    }
  }

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

function getExtWithDot(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.substring(dot) : "";
}

/** アルバムアートの VFS ファイル名を返す */
function getAlbumArtVfsName(file: File): string {
  return "cover_art" + getExtWithDot(file.name);
}

/** アルバムアート用の -map, -c:v copy, -id3v2_version を args に追加 */
function appendAlbumArtArgs(
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
function appendMetadata(
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
function appendOutputEncoding(
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

async function detectVolume(
  ff: FFmpeg,
  inputName: string,
): Promise<{ peak: number; rms: number }> {
  let peak = 0;
  let rms = 0;
  const logHandler = ({ message }: { message: string }) => {
    const peakMatch = message.match(/max_volume:\s*([-\d.]+)\s*dB/);
    if (peakMatch) peak = parseFloat(peakMatch[1]);
    const rmsMatch = message.match(/mean_volume:\s*([-\d.]+)\s*dB/);
    if (rmsMatch) rms = parseFloat(rmsMatch[1]);
  };
  ff.on("log", logHandler);
  await ff.exec(["-i", inputName, "-af", "volumedetect", "-f", "null", "-"]);
  ff.off("log", logHandler);
  return { peak, rms };
}

interface LufsMeasurement {
  input_i: number;
  input_tp: number;
  input_lra: number;
  input_thresh: number;
  target_offset: number;
}

async function detectLufs(
  ff: FFmpeg,
  inputName: string,
  targetI: number = -14,
  targetTP: number = -1,
): Promise<LufsMeasurement> {
  let input_i = 0;
  let input_tp = 0;
  let input_lra = 0;
  let input_thresh = 0;
  let target_offset = 0;
  const logHandler = ({ message }: { message: string }) => {
    const iMatch = message.match(/"input_i"\s*:\s*"([-\d.]+)"/);
    if (iMatch) input_i = parseFloat(iMatch[1]);
    const tpMatch = message.match(/"input_tp"\s*:\s*"([-\d.]+)"/);
    if (tpMatch) input_tp = parseFloat(tpMatch[1]);
    const lraMatch = message.match(/"input_lra"\s*:\s*"([-\d.]+)"/);
    if (lraMatch) input_lra = parseFloat(lraMatch[1]);
    const threshMatch = message.match(/"input_thresh"\s*:\s*"([-\d.]+)"/);
    if (threshMatch) input_thresh = parseFloat(threshMatch[1]);
    const offsetMatch = message.match(/"target_offset"\s*:\s*"([-\d.]+)"/);
    if (offsetMatch) target_offset = parseFloat(offsetMatch[1]);
  };
  ff.on("log", logHandler);
  await ff.exec([
    "-i", inputName,
    "-af", `loudnorm=I=${targetI}:TP=${targetTP}:print_format=json`,
    "-f", "null", "-",
  ]);
  ff.off("log", logHandler);
  return { input_i, input_tp, input_lra, input_thresh, target_offset };
}

async function probeAudioInfo(
  ff: FFmpeg,
  fileName: string,
  blobSize: number,
): Promise<AudioFileInfo> {
  let durationMs = 0;
  let sampleRate: string | null = null;
  let channels: number | null = null;
  let bitrate: string | null = null;
  let bitDepth: string | null = null;
  let peakDb = 0;
  let rmsDb = 0;
  let parsedMetadata: Record<string, string> = {};
  let inMetadata = false;
  let metadataCaptured = false;

  const logHandler = ({ message }: { message: string }) => {
    // メタデータブロックの解析（最初の Metadata: ブロックのみ）
    if (!metadataCaptured && /^\s+Metadata:\s*$/.test(message)) {
      inMetadata = true;
      return;
    }
    if (inMetadata) {
      const metaMatch = message.match(/^\s{4,}(\S+)\s*:\s*(.+)$/);
      if (metaMatch) {
        parsedMetadata[metaMatch[1].toLowerCase()] = metaMatch[2].trim();
        return;
      } else {
        inMetadata = false;
        metadataCaptured = true;
      }
    }
    // Duration: 00:00:03.25
    const durMatch = message.match(
      /Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/,
    );
    if (durMatch) {
      const h = parseInt(durMatch[1]);
      const m = parseInt(durMatch[2]);
      const s = parseInt(durMatch[3]);
      const cs = parseInt(durMatch[4].padEnd(2, "0").substring(0, 2));
      durationMs = (h * 3600 + m * 60 + s) * 1000 + cs * 10;
    }
    // Stream: Audio: codec, 44100 Hz, stereo, s16, ...
    const streamMatch = message.match(
      /Audio:.*?,\s*(\d+)\s*Hz,\s*(\w+)/,
    );
    if (streamMatch) {
      sampleRate = streamMatch[1];
      channels = streamMatch[2] === "mono" ? 1 : 2;
    }
    // codec name: pcm_s24le, pcm_f32le, etc. (入力ストリームの最初の検出のみ使用)
    if (!bitDepth) {
      const codecMatch = message.match(/Audio:\s*(pcm_\w+)/);
      if (codecMatch) {
        const codec = codecMatch[1];
        const pcmMatch = codec.match(/^pcm_(s|f)(\d+)/);
        if (pcmMatch) {
          const isFloat = pcmMatch[1] === "f";
          bitDepth = isFloat ? `${pcmMatch[2]}-bit float` : `${pcmMatch[2]}-bit`;
        }
      }
    }
    // fallback: sample format (s16, s32, flt, fltp, dbl, dblp, etc.)
    if (!bitDepth) {
      const fmtMatch = message.match(
        /Audio:.*?,\s*\d+\s*Hz,\s*\w+,\s*(\w+)/,
      );
      if (fmtMatch) {
        const fmt = fmtMatch[1];
        if (fmt === "flt" || fmt === "fltp") {
          bitDepth = "32-bit float";
        } else if (fmt === "dbl" || fmt === "dblp") {
          bitDepth = "64-bit float";
        } else {
          const bitsMatch = fmt.match(/^s(\d+)/);
          if (bitsMatch) bitDepth = `${bitsMatch[1]}-bit`;
        }
      }
    }
    // max_volume
    const volMatch = message.match(/max_volume:\s*([-\d.]+)\s*dB/);
    if (volMatch) {
      peakDb = parseFloat(volMatch[1]);
    }
    // mean_volume (RMS)
    const rmsMatch = message.match(/mean_volume:\s*([-\d.]+)\s*dB/);
    if (rmsMatch) {
      rmsDb = parseFloat(rmsMatch[1]);
    }
  };

  ff.on("log", logHandler);
  await ff.exec(["-i", fileName, "-af", "volumedetect", "-f", "null", "-"]);
  ff.off("log", logHandler);

  // LUFS計測（loudnormフィルタで Integrated Loudness を取得）
  let lufsValue: number | null = null;
  const lufsHandler = ({ message }: { message: string }) => {
    const iMatch = message.match(/"input_i"\s*:\s*"([-\d.]+)"/);
    if (iMatch) lufsValue = parseFloat(iMatch[1]);
  };
  ff.on("log", lufsHandler);
  try {
    await ff.exec([
      "-i", fileName,
      "-af", "loudnorm=print_format=json",
      "-f", "null", "-",
    ]);
  } catch {
    // loudnormフィルタが利用できない場合はスキップ
  }
  ff.off("log", lufsHandler);

  const ext = getFileExtension(fileName).toLowerCase();
  const estimatedBitrate =
    durationMs > 0
      ? Math.round((blobSize * 8) / (durationMs / 1000) / 1000) + "kbps"
      : null;

  return {
    name: fileName,
    duration_ms: durationMs,
    format: ext || "unknown",
    bitrate: bitrate ?? estimatedBitrate,
    sample_rate: sampleRate,
    channels,
    bit_depth: bitDepth,
    peak_db: Math.round(peakDb * 10) / 10,
    rms_db: Math.round(rmsDb * 10) / 10,
    lufs: lufsValue !== null ? Math.round(lufsValue * 10) / 10 : null,
    metadata: parsedMetadata,
    albumArtUrl: null,
  };
}

/** 音声処理が不要でストリームコピー可能か判定 */
function isStreamCopyEligible(options: ProcessingOptions): boolean {
  const inputExt = getFileExtension(options.input_file.name).toLowerCase();
  const outputExt = getFileExtension(options.output_name).toLowerCase();
  if (inputExt !== outputExt) return false;

  return (
    !options.volume &&
    !options.trim &&
    !options.bitrate &&
    !options.sample_rate &&
    !options.bit_depth &&
    !options.silence_remove &&
    !options.noise_reduce &&
    !options.frequency_filter &&
    !options.dynamics_filter &&
    !options.effect_filter &&
    !options.channel_filter &&
    !options.frequency_filter_ext &&
    !options.dynamics_filter_ext &&
    !options.effect_filter_ext &&
    !options.repair_filter &&
    !options.stereo_filter
  );
}

function getMimeType(name: string): string {
  const ext = getFileExtension(name).toLowerCase();
  switch (ext) {
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    case "flac":
      return "audio/flac";
    default:
      return "audio/mpeg";
  }
}

export async function processFile(
  options: ProcessingOptions,
  onProgress?: (info: ProgressInfo) => void,
): Promise<ProcessingResult> {
  const ff = getFFmpeg();
  const inputName = "input" + getExtWithDot(options.input_file.name);
  const outputName = options.output_name;

  try {
    // 進捗リスナー
    const progressHandler = ({
      progress,
    }: {
      progress: number;
      time: number;
    }) => {
      onProgress?.({
        file_name: options.input_file.name,
        percentage: Math.min(Math.round(progress * 100), 99),
        status: "processing",
      });
    };
    ff.on("progress", progressHandler);

    // ファイル書き込み
    await ff.writeFile(inputName, await fetchFile(options.input_file));

    // アルバムアート書き込み
    const albumArtName = options.album_art
      ? getAlbumArtVfsName(options.album_art)
      : null;
    if (options.album_art && albumArtName) {
      await ff.writeFile(albumArtName, await fetchFile(options.album_art));
    }

    const isNormalize =
      options.volume?.type === "normalize_peak" ||
      options.volume?.type === "normalize_rms";
    const isLufsNormalize = options.volume?.type === "normalize_lufs";

    if (isStreamCopyEligible(options)) {
      // ストリームコピー: 音声データ無変更、メタデータ/アルバムアートのみ
      const args = ["-i", inputName];
      if (albumArtName) {
        args.push("-i", albumArtName, "-map", "0:a", "-map", "1:v");
      }
      args.push("-c", "copy");
      if (albumArtName) {
        const ext = getExtWithDot(outputName).toLowerCase();
        if (ext === ".mp3") args.push("-id3v2_version", "3");
      }
      appendMetadata(args, options);
      args.push("-y", outputName);
      await ff.exec(args);
    } else if (isLufsNormalize) {
      // LUFS正規化（loudnorm 2パスモード）:
      // 1. 音量以外のフィルタを適用した中間WAVを生成
      // 2. loudnorm で計測
      // 3. 計測値を使って loudnorm 2パス目を実行（linear mode）
      const tempName = "temp_intermediate.wav";
      const intermediateOptions: ProcessingOptions = {
        ...options,
        output_name: tempName,
        volume: undefined,
      };
      const intermediateArgs = buildFFmpegArgs(intermediateOptions);
      await ff.exec(intermediateArgs);

      const vol = options.volume!;
      const targetLufs = vol.type === "normalize_lufs" ? (vol.target_lufs ?? -14) : -14;
      const targetTP = -1;

      const measurement = await detectLufs(ff, tempName, targetLufs, targetTP);

      // loudnorm 2パス目: 計測値を使った線形正規化
      const loudnormFilter = [
        `loudnorm=I=${targetLufs}`,
        `TP=${targetTP}`,
        `measured_I=${measurement.input_i}`,
        `measured_TP=${measurement.input_tp}`,
        `measured_LRA=${measurement.input_lra}`,
        `measured_thresh=${measurement.input_thresh}`,
        `offset=${measurement.target_offset}`,
        `linear=true`,
      ].join(":");

      const finalArgs = ["-i", tempName];
      if (albumArtName) {
        finalArgs.push("-i", albumArtName, "-map", "0:a", "-map", "1:v");
      }
      finalArgs.push("-af", loudnormFilter);
      appendAlbumArtArgs(finalArgs, options, outputName);
      appendOutputEncoding(finalArgs, options, outputName);
      appendMetadata(finalArgs, options);
      finalArgs.push("-y", outputName);
      await ff.exec(finalArgs);

      await ff.deleteFile(tempName);
    } else if (isNormalize) {
      // 正規化（補正パス付き）:
      // 1. 音量以外のフィルタを適用した中間WAVを生成
      // 2. 中間ファイルのピーク/RMSを計測し音量調整して出力
      // 3. 出力を実測し、ズレがあれば補正して再出力
      const tempName = "temp_intermediate.wav";
      const intermediateOptions: ProcessingOptions = {
        ...options,
        output_name: tempName,
        volume: undefined,
      };
      const intermediateArgs = buildFFmpegArgs(intermediateOptions);
      await ff.exec(intermediateArgs);

      const vol = options.volume!;
      const targetDb = (vol.type === "normalize_peak" || vol.type === "normalize_rms")
        ? (vol.target_db ?? -1)
        : -1;
      const measured = await detectVolume(ff, tempName);
      const currentValue =
        vol.type === "normalize_rms" ? measured.rms : measured.peak;
      const adjustment = targetDb - currentValue;

      const buildFinalArgs = (db: number) => {
        const args = ["-i", tempName];
        if (albumArtName) {
          args.push("-i", albumArtName, "-map", "0:a", "-map", "1:v");
        }
        args.push("-af", `volume=${db}dB`);
        appendAlbumArtArgs(args, options, outputName);
        appendOutputEncoding(args, options, outputName);
        appendMetadata(args, options);
        args.push("-y", outputName);
        return args;
      };

      // 初回エンコード
      let appliedDb = Math.round(adjustment * 100) / 100;
      await ff.exec(buildFinalArgs(appliedDb));

      // 補正パス（最大2回）: ロッシー形式でズレていたら再エンコード
      for (let pass = 0; pass < 2; pass++) {
        const actual = await detectVolume(ff, outputName);
        const actualValue =
          vol.type === "normalize_rms" ? actual.rms : actual.peak;
        const error = targetDb - actualValue;
        if (Math.abs(error) <= 0.1) break;
        appliedDb = Math.round((appliedDb + error) * 100) / 100;
        await ff.exec(buildFinalArgs(appliedDb));
      }

      await ff.deleteFile(tempName);
    } else {
      // 通常処理: 1パス
      const args = buildFFmpegArgs(options);
      await ff.exec(args);
    }

    // 結果読み込み
    const data = await ff.readFile(outputName);
    const blob = new Blob([data], { type: getMimeType(outputName) });

    // 出力ファイルのプローブ（クリーンアップ前）
    const outputInfo = await probeAudioInfo(ff, outputName, blob.size);

    ff.off("progress", progressHandler);

    onProgress?.({
      file_name: options.input_file.name,
      percentage: 100,
      status: "completed",
    });

    // クリーンアップ
    await ff.deleteFile(inputName);
    await ff.deleteFile(outputName);
    if (albumArtName) {
      try { await ff.deleteFile(albumArtName); } catch {}
    }

    return {
      input_name: options.input_file.name,
      output_name: outputName,
      blob,
      success: true,
      error: null,
      outputInfo,
    };
  } catch (e) {
    onProgress?.({
      file_name: options.input_file.name,
      percentage: 0,
      status: "error",
    });

    // クリーンアップ（エラー時）
    try {
      await ff.deleteFile(inputName);
    } catch {}
    try {
      await ff.deleteFile(outputName);
    } catch {}
    if (albumArtName) {
      try { await ff.deleteFile(albumArtName); } catch {}
    }

    return {
      input_name: options.input_file.name,
      output_name: outputName,
      blob: null,
      success: false,
      error: e instanceof Error ? e.message : String(e),
      outputInfo: null,
    };
  }
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// オーディオプレビュー再生（同時に1つだけ再生）
let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let onStopCallback: (() => void) | null = null;

export function playPreview(source: File | Blob, onEnded: () => void) {
  stopPreview();
  const url = URL.createObjectURL(source);
  const audio = new Audio(url);
  currentAudio = audio;
  currentUrl = url;
  onStopCallback = onEnded;
  audio.onended = () => stopPreview();
  audio.play();
}

export function stopPreview() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.onended = null;
    currentAudio = null;
  }
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl);
    currentUrl = null;
  }
  if (onStopCallback) {
    onStopCallback();
    onStopCallback = null;
  }
}

