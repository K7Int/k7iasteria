//! CRUD + relationships for memories.

use serde::Deserialize;

use crate::commands::CmdResult;
use crate::domain::{Link, Memory, MemoryId, MemoryKind};
use crate::get;
use crate::storage::MemoryRepository;

#[derive(Debug, Clone, Deserialize)]
pub struct CreateMemoryInput {
    pub title: String,
    pub kind: MemoryKind,
    pub parent_id: Option<MemoryId>,
    #[serde(default)]
    pub content: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub color: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateMemoryInput {
    pub id: MemoryId,
    pub title: Option<String>,
    pub content: Option<String>,
    pub tags: Option<Vec<String>>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub occurred_at: Option<String>,
}

#[tauri::command]
pub async fn list_children(parent_id: Option<String>) -> CmdResult<Vec<Memory>> {
    let app = get();
    Ok(app.repo.list_children(parent_id.as_ref()).await?)
}

#[tauri::command]
pub async fn get_memory(id: String) -> CmdResult<Option<Memory>> {
    let app = get();
    Ok(app.repo.get(&id).await?)
}

#[tauri::command]
pub async fn create_memory(input: CreateMemoryInput) -> CmdResult<Memory> {
    let app = get();
    let mut m = Memory::new(input.title, input.kind, input.parent_id);
    m.content = input.content;
    m.tags = input.tags;
    if let Some(ic) = input.icon {
        m.icon = ic;
    }
    if let Some(c) = input.color {
        m.color = Some(c);
    }
    app.repo.upsert(&m).await?;
    Ok(m)
}

#[tauri::command]
pub async fn update_memory(input: UpdateMemoryInput) -> CmdResult<Memory> {
    let app = get();
    let mut m = app
        .repo
        .get(&input.id)
        .await?
        .ok_or_else(|| crate::commands::CmdError("memory not found".into()))?;
    if let Some(t) = input.title {
        m.title = t;
    }
    if let Some(c) = input.content {
        m.content = c;
    }
    if let Some(t) = input.tags {
        m.tags = t;
    }
    if let Some(i) = input.icon {
        m.icon = i;
    }
    if let Some(c) = input.color {
        m.color = Some(c);
    }
    if let Some(o) = input.occurred_at {
        m.occurred_at = Some(chrono::DateTime::parse_from_rfc3339(&o)?.with_timezone(&chrono::Utc));
    }
    m.touch();
    app.repo.upsert(&m).await?;
    Ok(m)
}

#[tauri::command]
pub async fn delete_memory(id: String) -> CmdResult<()> {
    let app = get();
    app.repo.soft_delete(&id).await?;
    Ok(())
}

#[tauri::command]
pub async fn move_memory(id: String, new_parent_id: Option<String>) -> CmdResult<()> {
    let app = get();
    app.repo.move_to(&id, new_parent_id.as_ref()).await?;
    Ok(())
}

#[derive(Debug, Clone, Deserialize)]
pub struct LinkInput {
    pub source_id: MemoryId,
    pub target_id: MemoryId,
    #[serde(default = "default_relation")]
    pub relation: String,
}
fn default_relation() -> String {
    "related".into()
}

#[tauri::command]
pub async fn link_memories(input: LinkInput) -> CmdResult<Link> {
    let app = get();
    let link = Link {
        id: uuid::Uuid::new_v4().to_string(),
        source_id: input.source_id,
        target_id: input.target_id,
        relation: input.relation,
        created_at: chrono::Utc::now(),
    };
    app.repo.link(&link).await?;
    Ok(link)
}

#[tauri::command]
pub async fn unlink_memories(
    source_id: String,
    target_id: String,
    relation: String,
) -> CmdResult<()> {
    let app = get();
    app.repo.unlink(&source_id, &target_id, &relation).await?;
    Ok(())
}

#[tauri::command]
pub async fn links_of(id: String) -> CmdResult<Vec<Link>> {
    let app = get();
    Ok(app.repo.links_of(&id).await?)
}

#[tauri::command]
pub async fn recent_memories(limit: Option<u32>) -> CmdResult<Vec<Memory>> {
    let app = get();
    Ok(app.repo.recent(limit.unwrap_or(20)).await?)
}
