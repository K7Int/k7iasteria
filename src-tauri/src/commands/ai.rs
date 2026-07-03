use serde_json::Value;

use crate::ai::AiRegistry;
use crate::commands::CmdResult;
use crate::get;

#[tauri::command]
pub async fn ai_summarize(id: String) -> CmdResult<crate::ai::SummaryResult> {
    Ok(get().ai.summarize(&id).await?)
}

#[tauri::command]
pub async fn ai_suggest_tags(id: String) -> CmdResult<crate::ai::SuggestTagsResult> {
    Ok(get().ai.suggest_tags(&id).await?)
}

#[tauri::command]
pub async fn ai_insight() -> CmdResult<crate::ai::InsightResult> {
    Ok(get().ai.insight().await?)
}

#[tauri::command]
pub async fn ai_configure(config: Value) -> CmdResult<()> {
    let registry: AiRegistry = serde_json::from_value(config)?;
    get().ai.configure(registry);
    Ok(())
}

#[tauri::command]
pub async fn ai_status() -> CmdResult<crate::ai::AiStatus> {
    Ok(get().ai.status())
}
