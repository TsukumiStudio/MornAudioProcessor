use crate::error::AppError;
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Clone, serde::Serialize)]
pub struct FfmpegInfo {
    pub ffmpeg_path: String,
    pub ffprobe_path: String,
    pub version: String,
}

/// macOSのGUIアプリはシェルのPATHを継承しないため、
/// よくあるインストールパスも直接探す
fn find_binary(name: &str) -> Option<PathBuf> {
    // まずPATHから検索
    if let Ok(path) = which::which(name) {
        return Some(path);
    }

    // よくあるインストールパスを直接チェック
    let candidates: &[&str] = &[
        // Homebrew (Apple Silicon)
        "/opt/homebrew/bin",
        // Homebrew (Intel Mac)
        "/usr/local/bin",
        // MacPorts
        "/opt/local/bin",
        // Nix
        "/nix/var/nix/profiles/default/bin",
        // Linux common
        "/usr/bin",
        "/snap/bin",
    ];

    for dir in candidates {
        let path = PathBuf::from(dir).join(name);
        if path.exists() {
            return Some(path);
        }
    }

    None
}

pub fn detect_ffmpeg() -> Result<FfmpegInfo, AppError> {
    let ffmpeg_path =
        find_binary("ffmpeg").ok_or_else(|| AppError::FfmpegNotFound(install_guide()))?;

    let ffprobe_path = find_binary("ffprobe").ok_or_else(|| {
        AppError::FfprobeNotFound(
            "ffprobeが見つかりません。ffmpegと一緒にインストールされるはずです。".into(),
        )
    })?;

    let output = Command::new(&ffmpeg_path)
        .arg("-version")
        .output()
        .map_err(|e| AppError::FfmpegExecutionError(e.to_string()))?;

    let version = String::from_utf8_lossy(&output.stdout)
        .lines()
        .next()
        .unwrap_or("unknown")
        .to_string();

    Ok(FfmpegInfo {
        ffmpeg_path: ffmpeg_path.to_string_lossy().to_string(),
        ffprobe_path: ffprobe_path.to_string_lossy().to_string(),
        version,
    })
}

fn install_guide() -> String {
    if cfg!(target_os = "windows") {
        "Windows: winget install ffmpeg\nまたは https://www.gyan.dev/ffmpeg/builds/ からダウンロードし、PATHに追加してください。".to_string()
    } else if cfg!(target_os = "macos") {
        "macOS: brew install ffmpeg".to_string()
    } else {
        "Linux: sudo apt install ffmpeg (Ubuntu/Debian)\nまたは: sudo dnf install ffmpeg (Fedora)"
            .to_string()
    }
}
