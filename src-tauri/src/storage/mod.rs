//! Storage layer - a SQLite implementation of the memory repository.

pub mod repository;
pub mod schema;

pub use repository::{MemoryRepository, SqliteMemoryRepository};

use std::path::Path;

use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    SqlitePool,
};

/// Open a `SqlitePool` at `path`, creating the file if missing, with
/// foreign keys and WAL enabled.
pub async fn open(path: &Path) -> anyhow::Result<SqlitePool> {
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await.ok();
    }
    let options = SqliteConnectOptions::new()
        .filename(path)
        .create_if_missing(true)
        .foreign_keys(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal)
        .busy_timeout(std::time::Duration::from_secs(5));
    let pool = SqlitePoolOptions::new()
        .max_connections(8)
        .connect_with(options)
        .await?;
    Ok(pool)
}

/// Apply any pending migrations embedded under `migrations/`.
pub async fn migrate(pool: &SqlitePool) -> anyhow::Result<()> {
    sqlx::migrate!("./migrations")
        .run(pool)
        .await
        .map_err(anyhow::Error::from)?;
    Ok(())
}

/// No-op unless the store is empty, in which case it inserts a small
/// starter set of folders and sample memories so the desktop is not blank.
pub async fn seed_if_empty(repo: &SqliteMemoryRepository) -> anyhow::Result<()> {
    schema::seed_sample_data(repo).await
}
