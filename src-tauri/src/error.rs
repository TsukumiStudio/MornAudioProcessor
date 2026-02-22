use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("ffmpegが見つかりません: {0}")]
    FfmpegNotFound(String),

    #[error("ffprobeが見つかりません: {0}")]
    FfprobeNotFound(String),

    #[error("非対応の形式です: {0}")]
    UnsupportedFormat(String),

    #[error("ffmpegの実行に失敗しました: {0}")]
    FfmpegExecutionError(String),

    #[error("内部エラー: {0}")]
    Internal(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
