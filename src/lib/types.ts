export interface FfmpegInfo {
  version: string;
}

export interface AudioFileInfo {
  name: string;
  duration_ms: number;
  format: string;
  bitrate: string | null;
  sample_rate: string | null;
  channels: number | null;
  bit_depth: string | null;
  peak_db: number | null;
  rms_db: number | null;
  lufs: number | null;
  metadata: Record<string, string>;
  albumArtUrl: string | null;
}

export type AudioFormat = "mp3" | "wav" | "ogg" | "flac";

export type CompareSelection =
  | { type: "input"; id: string }
  | { type: "output"; id: string };

export type MetadataOption = Record<string, string>;

export interface MetadataFieldSetting {
  mode: "unchanged" | "bulk" | "individual";
  bulkValue: string;
  individualValues: Record<string, string>;
}

export type MetadataSettings = Record<string, MetadataFieldSetting>;

export type VolumeOption =
  | { type: "normalize_peak"; target_db?: number }
  | { type: "normalize_rms"; target_db?: number }
  | { type: "normalize_lufs"; target_lufs?: number }
  | { type: "adjust"; db: number };

export interface TrimOption {
  start?: string;
  end?: string;
}

export interface SilenceRemoveOption {
  remove_start: boolean;
  remove_end: boolean;
  threshold_start_db: number;
  threshold_end_db: number;
}

export type NoiseReduceOption =
  | { type: "afftdn"; nr: number; nf: number }
  | { type: "anlmdn"; strength: number };

export type WidthType = "h" | "o" | "q" | "s" | "k";

export interface EqualizerOption {
  enabled: boolean;
  frequency: number;
  width_type: WidthType;
  width: number;
  gain: number;
  mix: number;
}

export interface HighpassOption {
  enabled: boolean;
  frequency: number;
  width_type: WidthType;
  width: number;
  poles: 1 | 2;
  mix: number;
}

export interface LowpassOption {
  enabled: boolean;
  frequency: number;
  width_type: WidthType;
  width: number;
  poles: 1 | 2;
  mix: number;
}

export interface BandpassOption {
  enabled: boolean;
  frequency: number;
  width_type: WidthType;
  width: number;
  mix: number;
  csg: boolean;
}

export interface FrequencyFilterOption {
  equalizer: EqualizerOption;
  highpass: HighpassOption;
  lowpass: LowpassOption;
  bandpass: BandpassOption;
}

export interface CompressorOption {
  enabled: boolean;
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  makeup: number;
  knee: number;
  mode: "downward" | "upward";
  detection: "peak" | "rms";
  link: "average" | "maximum";
  mix: number;
  level_in: number;
}

export interface LimiterOption {
  enabled: boolean;
  limit: number;
  attack: number;
  release: number;
  level: boolean;
  level_in: number;
  level_out: number;
  asc: boolean;
  asc_level: number;
}

export interface GateOption {
  enabled: boolean;
  threshold: number;
  ratio: number;
  range: number;
  attack: number;
  release: number;
  makeup: number;
  knee: number;
  mode: "downward" | "upward";
  detection: "peak" | "rms";
  link: "average" | "maximum";
}

export interface DynamicsFilterOption {
  compressor: CompressorOption;
  limiter: LimiterOption;
  gate: GateOption;
}

export interface EchoOption {
  enabled: boolean;
  in_gain: number;
  out_gain: number;
  delays: number;
  decays: number;
}

export interface ChorusOption {
  enabled: boolean;
  in_gain: number;
  out_gain: number;
  delays: number;
  decays: number;
  speeds: number;
  depths: number;
}

export interface FlangerOption {
  enabled: boolean;
  delay: number;
  depth: number;
  regen: number;
  width: number;
  speed: number;
  shape: "sinusoidal" | "triangular";
  phase: number;
  interp: "linear" | "quadratic";
}

export interface PhaserOption {
  enabled: boolean;
  in_gain: number;
  out_gain: number;
  delay: number;
  decay: number;
  speed: number;
  type: "triangular" | "sinusoidal";
}

export interface TremoloOption {
  enabled: boolean;
  f: number;
  d: number;
}

export interface VibratoOption {
  enabled: boolean;
  f: number;
  d: number;
}

export interface TempoOption {
  enabled: boolean;
  tempo: number;
}

export interface PitchOption {
  enabled: boolean;
  semitones: number;
}

export interface EffectFilterOption {
  echo: EchoOption;
  chorus: ChorusOption;
  flanger: FlangerOption;
  phaser: PhaserOption;
  tremolo: TremoloOption;
  vibrato: VibratoOption;
  tempo: TempoOption;
  pitch: PitchOption;
}

export interface ChannelFilterOption {
  conversion: "unchanged" | "to_mono" | "to_stereo";
  balance: number;
}

// --- Frequency Extra ---
export interface BassOption {
  enabled: boolean;
  gain: number;
  frequency: number;
  width_type: WidthType;
  width: number;
  poles: 1 | 2;
  mix: number;
}
export interface TrebleOption {
  enabled: boolean;
  gain: number;
  frequency: number;
  width_type: WidthType;
  width: number;
  poles: 1 | 2;
  mix: number;
}
export interface BandrejectOption {
  enabled: boolean;
  frequency: number;
  width_type: WidthType;
  width: number;
  mix: number;
}
export interface TiltshelfOption {
  enabled: boolean;
  gain: number;
  frequency: number;
  width_type: WidthType;
  width: number;
  poles: 1 | 2;
  mix: number;
}
export interface AllpassFilterOption {
  enabled: boolean;
  frequency: number;
  width_type: WidthType;
  width: number;
  mix: number;
  order: 1 | 2;
}
export interface AsubboostOption {
  enabled: boolean;
  dry: number;
  wet: number;
  boost: number;
  decay: number;
  feedback: number;
  cutoff: number;
  slope: number;
  delay: number;
}
export interface AsubcutOption {
  enabled: boolean;
  cutoff: number;
  order: number;
  level: number;
}
export interface AsupercutOption {
  enabled: boolean;
  cutoff: number;
  order: number;
  level: number;
}
export interface AdynamicequalizerOption {
  enabled: boolean;
  threshold: number;
  dfrequency: number;
  dqfactor: number;
  tfrequency: number;
  tqfactor: number;
  attack: number;
  release: number;
  ratio: number;
  makeup: number;
  range: number;
  mode: "listen" | "cutbelow" | "cutabove" | "boostbelow" | "boostabove";
  dftype: "bandpass" | "lowpass" | "highpass" | "peak";
  tftype: "bell" | "lowshelf" | "highshelf";
}
export interface FrequencyFilterExtOption {
  bass: BassOption;
  treble: TrebleOption;
  bandreject: BandrejectOption;
  tiltshelf: TiltshelfOption;
  allpass: AllpassFilterOption;
  asubboost: AsubboostOption;
  asubcut: AsubcutOption;
  asupercut: AsupercutOption;
  adynamicequalizer: AdynamicequalizerOption;
}

// --- Dynamics Extra ---
export interface DynaudnormOption {
  enabled: boolean;
  framelen: number;
  gausssize: number;
  peak: number;
  maxgain: number;
  targetrms: number;
  coupling: boolean;
  correctdc: boolean;
  altboundary: boolean;
  compress: number;
  threshold: number;
  overlap: number;
}
export interface SpeechnormOption {
  enabled: boolean;
  peak: number;
  expansion: number;
  compression: number;
  threshold: number;
  raise: number;
  fall: number;
  invert: boolean;
  link: boolean;
  rms: number;
}
export interface CompandOption {
  enabled: boolean;
  attacks: string;
  decays: string;
  points: string;
  soft_knee: number;
  gain: number;
  volume: number;
  delay: number;
}
export interface AsoftclipOption {
  enabled: boolean;
  type: "hard" | "tanh" | "atan" | "cubic" | "exp" | "alg" | "quintic" | "sin" | "erf";
  threshold: number;
  output: number;
  param: number;
  oversample: number;
}
export interface ApsyclipOption {
  enabled: boolean;
  level_in: number;
  level_out: number;
  clip: number;
  diff: boolean;
  adaptive: number;
  iterations: number;
  level: boolean;
}
export interface DynamicsFilterExtOption {
  dynaudnorm: DynaudnormOption;
  speechnorm: SpeechnormOption;
  compand: CompandOption;
  asoftclip: AsoftclipOption;
  apsyclip: ApsyclipOption;
}

// --- Effect Extra ---
export interface AfadeOption {
  enabled: boolean;
  type: "in" | "out";
  start_time: number;
  duration: number;
  curve: string;
  silence: number;
  unity: number;
}
export interface AcrusherOption {
  enabled: boolean;
  level_in: number;
  level_out: number;
  bits: number;
  mix: number;
  mode: "lin" | "log";
  dc: number;
  aa: number;
  samples: number;
  lfo: boolean;
  lforange: number;
  lforate: number;
}
export interface AexciterOption {
  enabled: boolean;
  level_in: number;
  level_out: number;
  amount: number;
  drive: number;
  blend: number;
  freq: number;
  ceil: number;
  listen: boolean;
}
export interface CrystalizerOption {
  enabled: boolean;
  i: number;
  c: boolean;
}
export interface AreverseOption {
  enabled: boolean;
}
export interface AloopOption {
  enabled: boolean;
  loop: number;
  size: number;
  start: number;
}
export interface AfreqshiftOption {
  enabled: boolean;
  shift: number;
  level: number;
  order: number;
}
export interface ApulsatorOption {
  enabled: boolean;
  level_in: number;
  level_out: number;
  mode: "sine" | "triangle" | "square" | "sawup" | "sawdown";
  amount: number;
  offset_l: number;
  offset_r: number;
  width: number;
  timing: "bpm" | "ms" | "hz";
  bpm: number;
  ms: number;
  hz: number;
}
export interface AdelayOption {
  enabled: boolean;
  delays: string;
  all: boolean;
}
export interface CompensationdelayOption {
  enabled: boolean;
  mm: number;
  cm: number;
  m: number;
  dry: number;
  wet: number;
  temp: number;
}
export interface DcshiftOption {
  enabled: boolean;
  shift: number;
  limitergain: number;
}
export interface ApadOption {
  enabled: boolean;
  pad_dur: number;
  whole_dur: number;
}
export interface EffectFilterExtOption {
  afade_in: AfadeOption;
  afade_out: AfadeOption;
  acrusher: AcrusherOption;
  aexciter: AexciterOption;
  crystalizer: CrystalizerOption;
  areverse: AreverseOption;
  aloop: AloopOption;
  afreqshift: AfreqshiftOption;
  apulsator: ApulsatorOption;
  adelay: AdelayOption;
  compensationdelay: CompensationdelayOption;
  dcshift: DcshiftOption;
  apad: ApadOption;
}

// --- Repair ---
export interface AdeclickOption {
  enabled: boolean;
  window: number;
  overlap: number;
  arorder: number;
  threshold: number;
  burst: number;
  method: "add" | "save";
}
export interface AdeclipOption {
  enabled: boolean;
  window: number;
  overlap: number;
  arorder: number;
  threshold: number;
  hsize: number;
  method: "add" | "save";
}
export interface AfwtdnOption {
  enabled: boolean;
  sigma: number;
  levels: number;
  wavet: "sym2" | "sym4" | "rbior68" | "deb10" | "sym10" | "coif5" | "bl3";
  percent: number;
  profile: boolean;
  adaptive: boolean;
  samples: number;
  softness: number;
}
export interface DeesserOption {
  enabled: boolean;
  i: number;
  m: number;
  f: number;
  s: "i" | "o" | "e";
}
export interface RepairFilterOption {
  adeclick: AdeclickOption;
  adeclip: AdeclipOption;
  afwtdn: AfwtdnOption;
  deesser: DeesserOption;
}

// --- Stereo ---
export type StereoMode = "lr>lr" | "lr>ms" | "ms>lr" | "lr>ll" | "lr>rr" | "lr>l+r" | "lr>rl" | "ms>ll" | "ms>rr" | "ms>rl" | "lr>l-r";
export type BalanceMode = "balance" | "amplitude" | "power";
export interface StereotoolsOption {
  enabled: boolean;
  level_in: number;
  level_out: number;
  balance_in: number;
  balance_out: number;
  softclip: boolean;
  mutel: boolean;
  muter: boolean;
  phasel: boolean;
  phaser: boolean;
  mode: StereoMode;
  slev: number;
  sbal: number;
  mlev: number;
  mpan: number;
  base: number;
  delay: number;
  sclevel: number;
  phase: number;
  bmode_in: BalanceMode;
  bmode_out: BalanceMode;
}
export interface StereowidenOption {
  enabled: boolean;
  delay: number;
  feedback: number;
  crossfeed: number;
  drymix: number;
}
export interface ExtrastereoOption {
  enabled: boolean;
  m: number;
  c: boolean;
}
export interface CrossfeedOption {
  enabled: boolean;
  strength: number;
  range: number;
  slope: number;
  level_in: number;
  level_out: number;
}
export interface HaasOption {
  enabled: boolean;
  level_in: number;
  level_out: number;
  side_gain: number;
  middle_source: "left" | "right" | "mid" | "side";
  middle_phase: boolean;
  left_delay: number;
  left_balance: number;
  left_gain: number;
  left_phase: boolean;
  right_delay: number;
  right_balance: number;
  right_gain: number;
  right_phase: boolean;
}
export interface DialoguenhanceOption {
  enabled: boolean;
  original: number;
  enhance: number;
  voice: number;
}
export interface StereoFilterOption {
  stereotools: StereotoolsOption;
  stereowiden: StereowidenOption;
  extrastereo: ExtrastereoOption;
  crossfeed: CrossfeedOption;
  haas: HaasOption;
  dialoguenhance: DialoguenhanceOption;
}

export interface ProcessingOptions {
  input_file: File;
  output_name: string;
  output_format?: AudioFormat;
  volume?: VolumeOption;
  trim?: TrimOption;
  bitrate?: string;
  sample_rate?: number;
  silence_remove?: SilenceRemoveOption;
  noise_reduce?: NoiseReduceOption;
  frequency_filter?: FrequencyFilterOption;
  dynamics_filter?: DynamicsFilterOption;
  effect_filter?: EffectFilterOption;
  channel_filter?: ChannelFilterOption;
  input_sample_rate?: number;
  frequency_filter_ext?: FrequencyFilterExtOption;
  dynamics_filter_ext?: DynamicsFilterExtOption;
  effect_filter_ext?: EffectFilterExtOption;
  repair_filter?: RepairFilterOption;
  stereo_filter?: StereoFilterOption;
  bit_depth?: string;
  ogg_quality?: number;
  metadata?: MetadataOption;
  album_art?: File;
}

export interface ProgressInfo {
  file_name: string;
  percentage: number;
  status: "processing" | "completed" | "error";
}

export interface ProcessingResult {
  input_name: string;
  output_name: string;
  blob: Blob | null;
  success: boolean;
  error: string | null;
  outputInfo: AudioFileInfo | null;
}

export interface FileEntry {
  id: string;
  file: AudioFileInfo;
  sourceFile: File;
  status: "loading" | "pending" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
}

export interface OutputEntry {
  id: string;
  outputName: string;
  outputInfo: AudioFileInfo | null;
  resultBlob: Blob;
  status: "completed";
  error?: undefined;
}

export interface OutputErrorEntry {
  id: string;
  outputName: string;
  outputInfo?: undefined;
  resultBlob?: undefined;
  status: "error";
  error: string;
}

export type OutputFileEntry = OutputEntry | OutputErrorEntry;
