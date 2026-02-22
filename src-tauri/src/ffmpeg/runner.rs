use crate::error::AppError;
use crate::ffmpeg::builder::{self, ProcessingOptions};
use crate::ffmpeg::progress::{
    get_duration_ms, parse_progress_line, ProcessingStatus, ProgressInfo,
};
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use tauri::ipc::Channel;

pub fn process_file(
    ffmpeg_path: &str,
    ffprobe_path: &str,
    opts: &ProcessingOptions,
    channel: &Channel<ProgressInfo>,
) -> Result<(), AppError> {
    let file_name = std::path::Path::new(&opts.input_path)
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    // ffprobe でファイルの長さを取得
    let total_duration_ms = get_duration_ms(ffprobe_path, &opts.input_path)
        .map_err(|e| AppError::FfmpegExecutionError(format!("duration取得失敗: {}", e)))?;

    // ffmpeg コマンド引数を組み立て
    let args = builder::build_ffmpeg_args(opts);

    // 出力ディレクトリが存在するか確認し、なければ作成
    if let Some(parent) = std::path::Path::new(&opts.output_path).parent() {
        if !parent.exists() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AppError::Internal(format!("出力ディレクトリ作成失敗: {}", e)))?;
        }
    }

    // ffmpeg プロセスを起動
    let mut child = Command::new(ffmpeg_path)
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| AppError::FfmpegExecutionError(e.to_string()))?;

    // stdout から進捗情報を読み取る
    if let Some(stdout) = child.stdout.take() {
        let reader = BufReader::new(stdout);
        for line in reader.lines() {
            if let Ok(line) = line {
                if let Some(progress) =
                    parse_progress_line(&line, total_duration_ms, &file_name)
                {
                    let _ = channel.send(progress);
                }
            }
        }
    }

    // プロセスの終了を待つ
    let status = child
        .wait()
        .map_err(|e| AppError::FfmpegExecutionError(e.to_string()))?;

    if !status.success() {
        let stderr_msg = child
            .stderr
            .map(|s| {
                BufReader::new(s)
                    .lines()
                    .filter_map(|l| l.ok())
                    .collect::<Vec<_>>()
                    .join("\n")
            })
            .unwrap_or_default();

        return Err(AppError::FfmpegExecutionError(format!(
            "ffmpegがエラーコード{}で終了: {}",
            status.code().unwrap_or(-1),
            stderr_msg
        )));
    }

    // 完了通知
    let _ = channel.send(ProgressInfo {
        file_name,
        current_time_ms: total_duration_ms,
        total_duration_ms,
        percentage: 100.0,
        status: ProcessingStatus::Completed,
    });

    Ok(())
}
