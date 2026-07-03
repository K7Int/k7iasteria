//! JSON importer. Accepts either a JSON array of memory-shaped objects
//! or a single object. A missing `parent_id` is filled from the import
//! argument.

use std::sync::Arc;

use crate::domain::Memory;
use crate::importers::{insert_many, Importer};
use crate::storage::MemoryRepository;

pub struct JsonImporter;

#[async_trait::async_trait]
impl Importer for JsonImporter {
    fn kind(&self) -> &'static str {
        "json"
    }

    async fn import_into(
        &self,
        repo: &Arc<dyn MemoryRepository>,
        source: &str,
        parent: Option<String>,
    ) -> anyhow::Result<usize> {
        let parsed: serde_json::Value = serde_json::from_str(source)?;
        let arr = match parsed {
            serde_json::Value::Array(a) => a,
            other => vec![other],
        };
        let mut memories = Vec::new();
        for v in arr {
            let mut m: Memory = serde_json::from_value(v).unwrap_or_else(|_| {
                let title = String::from("(imported)");
                Memory::new(title, crate::domain::MemoryKind::File, parent.clone())
            });
            if m.parent_id.is_none() {
                m.parent_id = parent.clone();
            }
            if m.title.is_empty() {
                m.title = "(imported)".into();
            }
            memories.push(m);
        }
        insert_many(repo, memories).await
    }
}
