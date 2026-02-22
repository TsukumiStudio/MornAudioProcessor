use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct ProcessingOptions {
    pub input_path: String,
    pub output_path: String,
    pub output_format: Option<AudioFormat>,
    pub volume: Option<VolumeOption>,
    pub trim: Option<TrimOption>,
    pub bitrate: Option<String>,
    pub sample_rate: Option<u32>,
    pub silence_remove: Option<SilenceRemoveOption>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AudioFormat {
    Mp3,
    Wav,
    Ogg,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type")]
pub enum VolumeOption {
    #[serde(rename = "normalize")]
    Normalize { target_lufs: Option<f64> },
    #[serde(rename = "adjust")]
    Adjust { db: f64 },
}

#[derive(Debug, Clone, Deserialize)]
pub struct TrimOption {
    pub start: Option<String>,
    pub end: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SilenceRemoveOption {
    pub remove_start: bool,
    pub remove_end: bool,
    pub threshold_db: f64,
}

pub fn build_ffmpeg_args(opts: &ProcessingOptions) -> Vec<String> {
    let mut args: Vec<String> = vec![];

    // 上書き確認をスキップ（先頭に置く）
    args.push("-y".into());

    // 入力ファイル
    args.push("-i".into());
    args.push(opts.input_path.clone());

    // トリミング
    if let Some(ref trim) = opts.trim {
        if let Some(ref start) = trim.start {
            if !start.is_empty() {
                args.push("-ss".into());
                args.push(start.clone());
            }
        }
        if let Some(ref end) = trim.end {
            if !end.is_empty() {
                args.push("-to".into());
                args.push(end.clone());
            }
        }
    }

    // オーディオフィルタを収集（-af は1つにまとめる）
    let mut filters: Vec<String> = vec![];

    // 無音削除フィルタ
    if let Some(ref sr) = opts.silence_remove {
        if sr.remove_start || sr.remove_end {
            let mut parts: Vec<String> = vec![];
            if sr.remove_start {
                parts.push(format!(
                    "start_periods=1:start_silence=0:start_threshold={}dB",
                    sr.threshold_db
                ));
            }
            if sr.remove_end {
                parts.push(format!(
                    "stop_periods=-1:stop_silence=0:stop_threshold={}dB",
                    sr.threshold_db
                ));
            }
            filters.push(format!("silenceremove={}", parts.join(":")));
        }
    }

    // 音量調整フィルタ
    if let Some(ref volume) = opts.volume {
        match volume {
            VolumeOption::Normalize { target_lufs } => {
                let lufs = target_lufs.unwrap_or(-16.0);
                filters.push(format!("loudnorm=I={}:LRA=11:TP=-1.5", lufs));
            }
            VolumeOption::Adjust { db } => {
                filters.push(format!("volume={}dB", db));
            }
        }
    }

    // フィルタをまとめて -af に追加
    if !filters.is_empty() {
        args.push("-af".into());
        args.push(filters.join(","));
    }

    // サンプルレート
    if let Some(sample_rate) = opts.sample_rate {
        args.push("-ar".into());
        args.push(sample_rate.to_string());
    }

    // コーデック設定
    let format = opts.output_format.as_ref();
    match format {
        Some(AudioFormat::Mp3) => {
            args.push("-c:a".into());
            args.push("libmp3lame".into());
        }
        Some(AudioFormat::Wav) => {
            args.push("-c:a".into());
            args.push("pcm_s16le".into());
        }
        Some(AudioFormat::Ogg) => {
            args.push("-c:a".into());
            args.push("libvorbis".into());
        }
        None => {}
    }

    // ビットレート（wavは無視）
    if let Some(ref bitrate) = opts.bitrate {
        if !bitrate.is_empty() && !matches!(format, Some(AudioFormat::Wav)) {
            args.push("-b:a".into());
            args.push(bitrate.clone());
        }
    }

    // 映像・字幕を除外
    args.push("-vn".into());
    args.push("-sn".into());

    // 進捗情報の出力
    args.push("-progress".into());
    args.push("pipe:1".into());

    // 出力ファイル
    args.push(opts.output_path.clone());

    args
}
