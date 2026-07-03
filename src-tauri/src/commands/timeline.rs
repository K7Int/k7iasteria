//! The timeline "filesystem view": a tree of years and memories.

use serde::Serialize;

use crate::commands::CmdResult;
use crate::domain::Memory;
use crate::get;
use crate::storage::MemoryRepository;

#[derive(Debug, Serialize)]
pub struct TimelineYear {
    pub year: i32,
    pub count: u64,
}

#[tauri::command]
pub async fn timeline_root() -> CmdResult<Vec<TimelineYear>> {
    let app = get();
    let years = app.repo.years().await?;
    let mut out = Vec::new();
    for y in years {
        let count = app.repo.by_year(y).await?.len() as u64;
        out.push(TimelineYear { year: y, count });
    }
    Ok(out)
}

#[tauri::command]
pub async fn timeline_year(year: i32) -> CmdResult<Vec<Memory>> {
    let app = get();
    Ok(app.repo.by_year(year).await?)
}
