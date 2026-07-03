use crate::commands::CmdResult;
use crate::get;

#[tauri::command]
pub async fn system_stats() -> CmdResult<crate::services::SystemStats> {
    let app = get();
    Ok(app.stats.stats().await?)
}
