mod commands;
mod error;
mod ffmpeg;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::check_ffmpeg,
            commands::get_audio_info,
            commands::process_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
