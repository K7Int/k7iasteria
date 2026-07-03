//! The repository abstraction plus its SQLite implementation.
//!
//! Splitting the trait lets services depend on `MemoryRepository`
//! rather than the concrete DB driver, keeping the architecture clean.

use std::collections::BTreeMap;

use chrono::Utc;
use serde_json::Value as JsonValue;
use sqlx::{sqlite::SqliteRow, Row, SqlitePool};

use crate::domain::{Link, Memory, MemoryId, MemoryKind};

/// Persistence boundary for memories.
#[async_trait::async_trait]
pub trait MemoryRepository: Send + Sync + 'static {
    async fn list_children(&self, parent: Option<&MemoryId>) -> anyhow::Result<Vec<Memory>>;
    async fn get(&self, id: &MemoryId) -> anyhow::Result<Option<Memory>>;
    async fn recent(&self, limit: u32) -> anyhow::Result<Vec<Memory>>;
    async fn upsert(&self, memory: &Memory) -> anyhow::Result<()>;
    async fn soft_delete(&self, id: &MemoryId) -> anyhow::Result<()>;
    async fn move_to(&self, id: &MemoryId, new_parent: Option<&MemoryId>) -> anyhow::Result<()>;
    async fn years(&self) -> anyhow::Result<Vec<i32>>;
    async fn by_year(&self, year: i32) -> anyhow::Result<Vec<Memory>>;
    async fn search(
        &self,
        query: &str,
        kinds: &[MemoryKind],
        tags: &[String],
    ) -> anyhow::Result<Vec<Memory>>;
    async fn count(&self) -> anyhow::Result<u64>;
    async fn link(&self, link: &Link) -> anyhow::Result<()>;
    async fn unlink(
        &self,
        source: &MemoryId,
        target: &MemoryId,
        relation: &str,
    ) -> anyhow::Result<()>;
    async fn links_of(&self, id: &MemoryId) -> anyhow::Result<Vec<Link>>;
    async fn set_state(&self, key: &str, value: &str) -> anyhow::Result<()>;
    async fn get_state(&self, key: &str) -> anyhow::Result<Option<String>>;
    async fn has_root(&self) -> anyhow::Result<bool>;
}

/// Concrete SQLite repository.
pub struct SqliteMemoryRepository {
    pool: SqlitePool,
}

impl SqliteMemoryRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Execute many writes inside one transaction.
    pub async fn transaction<F, T>(&self, op: F) -> anyhow::Result<T>
    where
        F: for<'c> FnOnce(
            &mut sqlx::Transaction<'c, sqlx::Sqlite>,
        ) -> std::pin::Pin<
            Box<dyn std::future::Future<Output = anyhow::Result<T>> + Send + 'c>,
        >,
        T: Send,
    {
        let mut tx = self.pool.begin().await?;
        let result = op(&mut tx).await?;
        tx.commit().await?;
        Ok(result)
    }
}

#[async_trait::async_trait]
impl MemoryRepository for SqliteMemoryRepository {
    async fn list_children(&self, parent: Option<&MemoryId>) -> anyhow::Result<Vec<Memory>> {
        let rows = match parent {
            Some(pid) => {
                sqlx::query(
                    "SELECT * FROM memories WHERE parent_id = ? AND deleted = 0 ORDER BY sort_key, title COLLATE NOCASE",
                )
                .bind(pid)
                .fetch_all(&self.pool)
                .await?
            }
            None => {
                sqlx::query(
                    "SELECT * FROM memories WHERE parent_id IS NULL AND deleted = 0 ORDER BY sort_key, title COLLATE NOCASE",
                )
                .fetch_all(&self.pool)
                .await?
            }
        };
        Ok(rows.into_iter().map(row_to_memory).collect())
    }

    async fn get(&self, id: &MemoryId) -> anyhow::Result<Option<Memory>> {
        let row = sqlx::query("SELECT * FROM memories WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.map(row_to_memory))
    }

    async fn recent(&self, limit: u32) -> anyhow::Result<Vec<Memory>> {
        let rows = sqlx::query(
            "SELECT * FROM memories WHERE deleted = 0 AND kind != 'folder' ORDER BY updated_at DESC LIMIT ?",
        )
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(row_to_memory).collect())
    }

    async fn upsert(&self, memory: &Memory) -> anyhow::Result<()> {
        sqlx::query(
            "INSERT INTO memories
              (id, parent_id, title, kind, content, metadata, tags, icon, color, sort_key, created_at, updated_at, occurred_at, deleted)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0)
             ON CONFLICT(id) DO UPDATE SET
               parent_id   = excluded.parent_id,
               title       = excluded.title,
               kind        = excluded.kind,
               content     = excluded.content,
               metadata    = excluded.metadata,
               tags        = excluded.tags,
               icon        = excluded.icon,
               color       = excluded.color,
               sort_key    = excluded.sort_key,
               updated_at  = excluded.updated_at,
               occurred_at = excluded.occurred_at",
        )
        .bind(&memory.id)
        .bind(memory.parent_id.as_deref())
        .bind(&memory.title)
        .bind(memory.kind.as_str())
        .bind(&memory.content)
        .bind(serde_json::to_string(&memory.metadata)?)
        .bind(serde_json::to_string(&memory.tags)?)
        .bind(&memory.icon)
        .bind(memory.color.as_deref())
        .bind(memory.sort_key)
        .bind(memory.created_at)
        .bind(memory.updated_at)
        .bind(memory.occurred_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn soft_delete(&self, id: &MemoryId) -> anyhow::Result<()> {
        sqlx::query("UPDATE memories SET deleted = 1 WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn move_to(&self, id: &MemoryId, new_parent: Option<&MemoryId>) -> anyhow::Result<()> {
        sqlx::query("UPDATE memories SET parent_id = ?, updated_at = ? WHERE id = ?")
            .bind(new_parent.map(|s| s.as_str()))
            .bind(Utc::now())
            .bind(id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn years(&self) -> anyhow::Result<Vec<i32>> {
        let rows = sqlx::query(
            "SELECT DISTINCT CAST(strftime('%Y', occurred_at) AS INTEGER) AS y
             FROM memories
             WHERE deleted = 0 AND occurred_at IS NOT NULL
             ORDER BY y DESC",
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(rows
            .into_iter()
            .filter_map(|r| r.try_get::<Option<i32>, _>("y").ok().flatten())
            .collect())
    }

    async fn by_year(&self, year: i32) -> anyhow::Result<Vec<Memory>> {
        let rows = sqlx::query(
            "SELECT * FROM memories
             WHERE deleted = 0
               AND occurred_at IS NOT NULL
               AND strftime('%Y', occurred_at) = ?
             ORDER BY occurred_at DESC",
        )
        .bind(year.to_string())
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(row_to_memory).collect())
    }

    async fn search(
        &self,
        query: &str,
        kinds: &[MemoryKind],
        tags: &[String],
    ) -> anyhow::Result<Vec<Memory>> {
        let mut sql = String::from(
            "SELECT * FROM memories WHERE deleted = 0 AND (title LIKE ?1 OR content LIKE ?1)",
        );
        if !kinds.is_empty() {
            let in_clause = kinds
                .iter()
                .enumerate()
                .map(|(i, _)| format!("?{}", i + 2))
                .collect::<Vec<_>>()
                .join(",");
            sql.push_str(&format!(" AND kind IN ({in_clause})"));
        }
        if !tags.is_empty() {
            let ors: Vec<String> = tags
                .iter()
                .map(|t| format!("tags LIKE '%\"{}\"%'", t.replace('\'', "")))
                .collect();
            sql.push_str(&format!(" AND ({})", ors.join(" OR ")));
        }
        sql.push_str(" ORDER BY occurred_at DESC NULLS LAST, title COLLATE NOCASE LIMIT 200");

        let mut q = sqlx::query(&sql).bind(format!("%{query}%"));
        for k in kinds {
            q = q.bind(k.as_str());
        }
        let rows = q.fetch_all(&self.pool).await?;
        Ok(rows.into_iter().map(row_to_memory).collect())
    }

    async fn count(&self) -> anyhow::Result<u64> {
        let row = sqlx::query("SELECT COUNT(*) AS n FROM memories WHERE deleted = 0")
            .fetch_one(&self.pool)
            .await?;
        let n: i64 = row.try_get("n")?;
        Ok(n as u64)
    }

    async fn link(&self, link: &Link) -> anyhow::Result<()> {
        sqlx::query(
            "INSERT INTO links (id, source_id, target_id, relation, created_at)
             VALUES (?,?,?,?,?)
             ON CONFLICT(source_id, target_id, relation) DO NOTHING",
        )
        .bind(&link.id)
        .bind(&link.source_id)
        .bind(&link.target_id)
        .bind(&link.relation)
        .bind(link.created_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn unlink(
        &self,
        source: &MemoryId,
        target: &MemoryId,
        relation: &str,
    ) -> anyhow::Result<()> {
        sqlx::query("DELETE FROM links WHERE source_id=? AND target_id=? AND relation=?")
            .bind(source)
            .bind(target)
            .bind(relation)
            .execute(&self.pool)
            .await?;
        Ok(())
    }

    async fn links_of(&self, id: &MemoryId) -> anyhow::Result<Vec<Link>> {
        let rows = sqlx::query(
            "SELECT * FROM links WHERE source_id = ? OR target_id = ? ORDER BY created_at",
        )
        .bind(id)
        .bind(id)
        .fetch_all(&self.pool)
        .await?;
        Ok(rows.into_iter().map(row_to_link).collect())
    }

    async fn set_state(&self, key: &str, value: &str) -> anyhow::Result<()> {
        sqlx::query(
            "INSERT INTO app_state (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        )
        .bind(key)
        .bind(value)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn get_state(&self, key: &str) -> anyhow::Result<Option<String>> {
        let row = sqlx::query("SELECT value FROM app_state WHERE key = ?")
            .bind(key)
            .fetch_optional(&self.pool)
            .await?;
        Ok(row.map(|r| r.try_get::<String, _>("value")).transpose()?)
    }

    async fn has_root(&self) -> anyhow::Result<bool> {
        let row = sqlx::query("SELECT EXISTS(SELECT 1 FROM memories WHERE kind='folder' AND parent_id IS NULL AND deleted = 0) AS e")
            .fetch_one(&self.pool)
            .await?;
        let exists: i64 = row.try_get("e")?;
        Ok(exists != 0)
    }
}

fn row_to_memory(row: SqliteRow) -> Memory {
    let metadata: BTreeMap<String, JsonValue> =
        serde_json::from_str(row.try_get::<String, _>("metadata").unwrap().as_str())
            .unwrap_or_default();
    let tags: Vec<String> =
        serde_json::from_str(row.try_get::<String, _>("tags").unwrap().as_str())
            .unwrap_or_default();
    let kind_str: String = row.try_get("kind").unwrap_or_default();
    Memory {
        id: row.try_get("id").unwrap(),
        parent_id: row.try_get("parent_id").unwrap(),
        title: row.try_get("title").unwrap(),
        kind: MemoryKind::parse_str(&kind_str).unwrap_or(MemoryKind::File),
        content: row.try_get("content").unwrap_or_default(),
        metadata,
        tags,
        icon: row.try_get("icon").unwrap_or_else(|_| "file".to_string()),
        color: row.try_get("color").unwrap_or(None),
        sort_key: row.try_get("sort_key").unwrap_or(0),
        created_at: row.try_get("created_at").unwrap(),
        updated_at: row.try_get("updated_at").unwrap(),
        occurred_at: row.try_get("occurred_at").unwrap_or(None),
        deleted: row.try_get::<i64, _>("deleted").unwrap_or(0) != 0,
    }
}

fn row_to_link(row: SqliteRow) -> Link {
    Link {
        id: row.try_get("id").unwrap(),
        source_id: row.try_get("source_id").unwrap(),
        target_id: row.try_get("target_id").unwrap(),
        relation: row
            .try_get("relation")
            .unwrap_or_else(|_| "related".to_string()),
        created_at: row.try_get("created_at").unwrap(),
    }
}
