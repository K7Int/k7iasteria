//! Plugin-based importers. Each importer implements [`Importer`] and is
//! surfaced through the `k7i.asteria.import` command dispatch table.

pub mod csv;
pub mod json;
pub mod sample;

use std::sync::Arc;

use crate::domain::Memory;
use crate::storage::MemoryRepository;

/// A generic importer trait. `kind` is the discriminant emitted to the
/// frontend ("csv", "json", "sample").
#[async_trait::async_trait]
pub trait Importer: Send + Sync + 'static {
    fn kind(&self) -> &'static str;
    async fn import_into(
        &self,
        repo: &Arc<dyn MemoryRepository>,
        source: &str,
        parent: Option<String>,
    ) -> anyhow::Result<usize>;
}

/// Built-in importer registry. Matches the `kind` string the frontend
/// passes via `import_file(kind, path_or_text)` to a concrete importer.
pub struct ImportHub {
    importers: Vec<Box<dyn Importer>>,
}

impl ImportHub {
    pub fn new() -> Self {
        let importers: Vec<Box<dyn Importer>> = vec![
            Box::new(csv::CsvImporter),
            Box::new(json::JsonImporter),
            Box::new(sample::SampleImporter),
        ];
        Self { importers }
    }

    pub async fn run(
        &self,
        kind: &str,
        repo: &Arc<dyn MemoryRepository>,
        source: &str,
        parent: Option<String>,
    ) -> anyhow::Result<usize> {
        for imp in &self.importers {
            if imp.kind() == kind {
                return imp.import_into(repo, source, parent).await;
            }
        }
        Err(anyhow::anyhow!("unknown importer kind: {kind}"))
    }
}

impl Default for ImportHub {
    fn default() -> Self {
        Self::new()
    }
}

/// Normalise a free label into a memory kind guess.
pub fn guess_kind(label: &str) -> crate::domain::MemoryKind {
    let l = label.to_ascii_lowercase();
    if l.contains("book") {
        crate::domain::MemoryKind::Log
    } else if l.contains("photo") {
        crate::domain::MemoryKind::Photo
    } else if l.contains("folder") || l.contains("trip") || l.contains("collection") {
        crate::domain::MemoryKind::Folder
    } else if l.contains("place") {
        crate::domain::MemoryKind::Place
    } else if l.contains("link") {
        crate::domain::MemoryKind::Link
    } else {
        crate::domain::MemoryKind::File
    }
}

/// Convenience: upserts a list of memories via the repository trait.
pub async fn insert_many(
    repo: &Arc<dyn MemoryRepository>,
    memories: Vec<Memory>,
) -> anyhow::Result<usize> {
    let n = memories.len();
    for m in memories {
        repo.upsert(&m).await?;
    }
    Ok(n)
}
