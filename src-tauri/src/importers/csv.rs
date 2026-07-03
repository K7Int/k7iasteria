//! CSV importer. Reads a CSV with a header row and produces one memory
//! per row, mapping columns to metadata. The `title` column (or the
//! first column if none) becomes the memory `title`.

use std::sync::Arc;

use serde_json::json;

use crate::domain::{Memory, MemoryKind};
use crate::importers::{insert_many, Importer};
use crate::storage::MemoryRepository;

pub struct CsvImporter;

#[async_trait::async_trait]
impl Importer for CsvImporter {
    fn kind(&self) -> &'static str {
        "csv"
    }

    async fn import_into(
        &self,
        repo: &Arc<dyn MemoryRepository>,
        source: &str,
        parent: Option<String>,
    ) -> anyhow::Result<usize> {
        let mut rdr = csv::ReaderBuilder::new()
            .has_headers(true)
            .flexible(true)
            .from_reader(source.as_bytes());
        let headers = rdr.headers()?.clone();
        let mut memories = Vec::new();
        for result in rdr.records() {
            let rec = result?;
            let title_index = headers
                .iter()
                .position(|h| h.eq_ignore_ascii_case("title"))
                .unwrap_or(0);
            let title = rec.get(title_index).unwrap_or("(untitled)").to_string();
            let mut m = Memory::new(title, MemoryKind::Dataset, parent.clone());
            for (i, h) in headers.iter().enumerate() {
                if let Some(v) = rec.get(i) {
                    if !v.is_empty() {
                        m.metadata.insert(h.to_string(), json!(v));
                    }
                }
            }
            m.content = headers
                .iter()
                .enumerate()
                .map(|(i, h)| format!("{h}: {}", rec.get(i).unwrap_or("")))
                .collect::<Vec<_>>()
                .join("\n");
            memories.push(m);
        }
        insert_many(repo, memories).await
    }
}
