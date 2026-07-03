use crate::commands::CmdResult;
use crate::domain::MemoryKind;
use crate::get;

#[tauri::command]
pub async fn search_memories(
    query: String,
    kinds: Option<Vec<String>>,
    tags: Option<Vec<String>>,
) -> CmdResult<Vec<crate::domain::Memory>> {
    let app = get();
    let kinds: Vec<MemoryKind> = kinds
        .unwrap_or_default()
        .iter()
        .filter_map(|k| MemoryKind::parse_str(k))
        .collect();
    let tags = tags.unwrap_or_default();
    Ok(app.search.search(&query, &kinds, &tags).await?)
}
