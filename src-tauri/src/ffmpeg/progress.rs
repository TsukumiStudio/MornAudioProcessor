use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct ProgressInfo {
    pub file_name: String,
    pub current_time_ms: u64,
    pub total_duration_ms: u64,
    pub percentage: f64,
    pub status: ProcessingStatus,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ProcessingStatus {
    Processing,
    Completed,
    Error,
}

pub fn parse_progress_line(
    line: &str,
    total_duration_ms: u64,
    file_name: &str,
) -> Option<ProgressInfo> {
    if let Some(time_str) = line.strip_prefix("out_time_ms=") {
        if let Ok(time_us) = time_str.trim().parse::<i64>() {
            let current_ms = (time_us / 1000).max(0) as u64;
            let percentage = if total_duration_ms > 0 {
                (current_ms as f64 / total_duration_ms as f64 * 100.0).min(100.0)
            } else {
                0.0
            };
            return Some(ProgressInfo {
                file_name: file_name.to_string(),
                current_time_ms: current_ms,
                total_duration_ms,
                percentage,
                status: ProcessingStatus::Processing,
            });
        }
    }

    if line.starts_with("progress=end") {
        return Some(ProgressInfo {
            file_name: file_name.to_string(),
            current_time_ms: total_duration_ms,
            total_duration_ms,
            percentage: 100.0,
            status: ProcessingStatus::Completed,
        });
    }

    None
}

pub fn get_duration_ms(ffprobe_path: &str, file_path: &str) -> Result<u64, String> {
    let output = std::process::Command::new(ffprobe_path)
        .args([
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            file_path,
        ])
        .output()
        .map_err(|e| e.to_string())?;

    let duration_str = String::from_utf8_lossy(&output.stdout);
    let seconds: f64 = duration_str
        .trim()
        .parse()
        .map_err(|e: std::num::ParseFloatError| e.to_string())?;

    Ok((seconds * 1000.0) as u64)
}
