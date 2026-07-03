use crate::commands::CmdResult;
use crate::get;
use crate::storage::MemoryRepository;

#[tauri::command]
pub async fn get_app_state(key: String) -> CmdResult<Option<String>> {
    let app = get();
    Ok(app.repo.get_state(&key).await?)
}

#[tauri::command]
pub async fn set_app_state(key: String, value: String) -> CmdResult<()> {
    let app = get();
    app.repo.set_state(&key, &value).await?;
    Ok(())
}
