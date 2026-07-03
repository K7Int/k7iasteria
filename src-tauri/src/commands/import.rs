use std::sync::Arc;

use crate::commands::CmdResult;
use crate::get;
use crate::importers::ImportHub;
use crate::storage::MemoryRepository;

#[tauri::command]
pub async fn import_file(
    kind: String,
    source: String,
    parent_id: Option<String>,
) -> CmdResult<usize> {
    let app = get();
    let repo: Arc<dyn MemoryRepository> = app.repo.clone();
    let hub = ImportHub::new();
    Ok(hub.run(&kind, &repo, &source, parent_id).await?)
}

#[tauri::command]
pub async fn import_sample_data() -> CmdResult<usize> {
    let app = get();
    let repo: Arc<dyn MemoryRepository> = app.repo.clone();
    let hub = ImportHub::new();
    Ok(hub.run("sample", &repo, "", None).await?)
}
