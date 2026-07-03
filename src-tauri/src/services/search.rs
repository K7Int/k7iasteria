//! Free-text + tag search over the memory filesystem.

use std::sync::Arc;

use crate::domain::MemoryKind;
use crate::storage::MemoryRepository;

pub struct SearchService {
    repo: Arc<dyn MemoryRepository>,
}

impl SearchService {
    pub fn new(repo: Arc<dyn MemoryRepository>) -> Self {
        Self { repo }
    }

    /// `query` matches title or content (case-insensitive LIKE).
    /// `kinds` filters by memory type; `tags` filters by tags (OR).
    pub async fn search(
        &self,
        query: &str,
        kinds: &[MemoryKind],
        tags: &[String],
    ) -> anyhow::Result<Vec<crate::domain::Memory>> {
        self.repo.search(query, kinds, tags).await
    }
}
