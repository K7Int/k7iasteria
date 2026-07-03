//! Restores the first-run sample data via the shared repository methods.
//! Does not downcast; relies only on the trait surface.

use std::sync::Arc;

use crate::importers::Importer;
use crate::storage::MemoryRepository;

pub struct SampleImporter;

#[async_trait::async_trait]
impl Importer for SampleImporter {
    fn kind(&self) -> &'static str {
        "sample"
    }

    async fn import_into(
        &self,
        repo: &Arc<dyn MemoryRepository>,
        _source: &str,
        _parent: Option<String>,
    ) -> anyhow::Result<usize> {
        // Re-create the canonical starter folders if the store is empty.
        let folders: &[(&str, &str, &str)] = &[
            ("books", "Books", "book"),
            ("movies", "Movies", "film"),
            ("trips", "Trips", "trip"),
            ("photos", "Photos", "photo"),
            ("journals", "Journals", "journal"),
            ("workouts", "Workouts", "log"),
            ("places", "Places", "place"),
            ("projects", "Projects", "project"),
        ];
        let mut count = 0usize;
        for &(id, title, icon) in folders {
            let exists = repo.get(&id.to_string()).await?.is_some();
            if exists {
                continue;
            }
            let mut m = crate::domain::Memory::new(
                title.to_string(),
                crate::domain::MemoryKind::Folder,
                None,
            );
            m.id = id.to_string();
            m.icon = icon.to_string();
            repo.upsert(&m).await?;
            count += 1;
        }
        Ok(count)
    }
}
