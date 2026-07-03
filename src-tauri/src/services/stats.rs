//! The "System Information" backend. Aggregates counts and yearly
//! activity so the System Info window can render classic OS-style
//! readouts without the frontend re-implementing the queries.

use std::collections::BTreeMap;

use serde::Serialize;
use std::sync::Arc;

use crate::domain::MemoryKind;
use crate::storage::MemoryRepository;

#[derive(Debug, Clone, Serialize)]
pub struct SystemStats {
    pub total: u64,
    pub by_kind: BTreeMap<String, u64>,
    pub by_year: BTreeMap<i32, u64>,
    pub apparent_booted_at: String,
}

pub struct StatsService {
    repo: Arc<dyn MemoryRepository>,
}

impl StatsService {
    pub fn new(repo: Arc<dyn MemoryRepository>) -> Self {
        Self { repo }
    }

    pub async fn stats(&self) -> anyhow::Result<SystemStats> {
        let years = self.repo.years().await?;
        let mut by_year = BTreeMap::new();
        for y in years {
            let mems = self.repo.by_year(y).await?;
            by_year.insert(y, mems.len() as u64);
        }

        let mut by_kind = BTreeMap::new();
        for k in MemoryKind::ALL {
            if matches!(k, MemoryKind::Folder) {
                continue;
            }
            let mems = self.repo.search("", &[*k], &[]).await?;
            by_kind.insert(k.as_str().to_string(), mems.len() as u64);
        }

        let total = self.repo.count().await?;

        let booted = self
            .repo
            .get_state("booted_at")
            .await?
            .unwrap_or_else(|| chrono::Utc::now().to_rfc3339());

        Ok(SystemStats {
            total,
            by_kind,
            by_year,
            apparent_booted_at: booted,
        })
    }
}
