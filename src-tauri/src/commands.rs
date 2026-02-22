use crate::error::AppError;
use crate::ffmpeg::builder::ProcessingOptions;
use crate::ffmpeg::detect::{detect_ffmpeg, FfmpegInfo};
use crate::ffmpeg::progress::ProgressInfo;
use crate::ffmpeg::runner;
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct AudioFileInfo {
    pub path: String,
    pub duration_ms: u64,
    pub format: String,
    pub bitrate: Option<String>,
    pub sample_rate: Option<String>,
    pub channels: Option<u32>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProcessingResult {
    pub input_path: String,
    pub output_path: String,
    pub success: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub fn check_ffmpeg() -> Result<FfmpegInfo, AppError> {
    detect_ffmpeg()
}

#[tauri::command]
pub fn get_audio_info(file_path: String) -> Result<AudioFileInfo, AppError> {
    let ffmpeg_info = detect_ffmpeg()?;

    let output = std::process::Command::new(&ffmpeg_info.ffprobe_path)
        .args([
            "-v",
            "error",
            "-show_entries",
            "format=duration,bit_rate,format_name",
            "-show_entries",
            "stream=codec_name,sample_rate,channels",
            "-of",
            "json",
            &file_path,
        ])
        .output()
        .map_err(|e| AppError::Internal(e.to_string()))?;

    let info_json: serde_json::Value =
        serde_json::from_slice(&output.stdout).map_err(|e| AppError::Internal(e.to_string()))?;

    let duration_ms = info_json["format"]["duration"]
        .as_str()
        .and_then(|s| s.parse::<f64>().ok())
        .map(|s| (s * 1000.0) as u64)
        .unwrap_or(0);

    let format = info_json["format"]["format_name"]
        .as_str()
        .unwrap_or("unknown")
        .to_string();

    let bitrate = info_json["format"]["bit_rate"]
        .as_str()
        .map(|s| s.to_string());

    let stream = info_json["streams"]
        .as_array()
        .and_then(|arr| arr.first());

    let sample_rate = stream
        .and_then(|s| s["sample_rate"].as_str())
        .map(|s| s.to_string());

    let channels = stream
        .and_then(|s| s["channels"].as_u64())
        .map(|c| c as u32);

    Ok(AudioFileInfo {
        path: file_path,
        duration_ms,
        format,
        bitrate,
        sample_rate,
        channels,
    })
}

#[tauri::command]
pub async fn process_files(
    files: Vec<ProcessingOptions>,
    on_progress: tauri::ipc::Channel<ProgressInfo>,
) -> Result<Vec<ProcessingResult>, AppError> {
    let ffmpeg_info = detect_ffmpeg()?;
    let mut results = Vec::new();

    for opts in &files {
        match runner::process_file(
            &ffmpeg_info.ffmpeg_path,
            &ffmpeg_info.ffprobe_path,
            opts,
            &on_progress,
        ) {
            Ok(()) => results.push(ProcessingResult {
                input_path: opts.input_path.clone(),
                output_path: opts.output_path.clone(),
                success: true,
                error: None,
            }),
            Err(e) => results.push(ProcessingResult {
                input_path: opts.input_path.clone(),
                output_path: opts.output_path.clone(),
                success: false,
                error: Some(e.to_string()),
            }),
        }
    }

    Ok(results)
}
