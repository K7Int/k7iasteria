//! The `Memory` aggregate root plus its lightweight `Link` value object.

use std::collections::BTreeMap;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;

use super::MemoryKind;

pub type MemoryId = String;

/// Metadata is an open map so importers and AI can stash anything they want
/// (ISBN, ISBN, GPS, distance, BPM, genre, year-of-release...).
pub type Metadata = BTreeMap<String, JsonValue>;

/// A memory - the universal atom of K7I Asteria.
///
/// It is modelled after a file system entry: it has a `kind`, optional
/// `parent_id` (folder), a `title`, free-form `content`, structured
/// `metadata`, `tags`, and an optional `occurred_at` timestamp marking
/// *when in the user's life* the event happened.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Memory {
    pub id: MemoryId,
    pub parent_id: Option<MemoryId>,
    pub title: String,
    pub kind: MemoryKind,
    #[serde(default)]
    pub content: String,
    #[serde(default)]
    pub metadata: Metadata,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default = "default_icon")]
    pub icon: String,
    #[serde(default)]
    pub color: Option<String>,
    #[serde(default)]
    pub sort_key: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub occurred_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub deleted: bool,
}

fn default_icon() -> String {
    "file".to_string()
}

impl Memory {
    /// Build a brand new memory with a generated id and default timestamps.
    pub fn new(title: impl Into<String>, kind: MemoryKind, parent_id: Option<MemoryId>) -> Self {
        let now = Utc::now();
        let icon = icon_for(kind).to_string();
        Self {
            id: new_id(),
            parent_id,
            title: title.into(),
            kind,
            content: String::new(),
            metadata: Metadata::new(),
            tags: Vec::new(),
            icon,
            color: None,
            sort_key: now.timestamp(),
            created_at: now,
            updated_at: now,
            occurred_at: Some(now),
            deleted: false,
        }
    }

    pub fn touch(&mut self) {
        self.updated_at = Utc::now();
    }

    pub fn is_folder(&self) -> bool {
        matches!(self.kind, MemoryKind::Folder)
    }
}

/// A directed relationship between two memories.
///
/// `relation` is free text - common examples are `related`, `parent`,
/// `references`, `mentions`, `took_place_at`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Link {
    pub id: String,
    pub source_id: MemoryId,
    pub target_id: MemoryId,
    pub relation: String,
    pub created_at: DateTime<Utc>,
}

/// Generate a sortable, collision-resistant id.
pub fn new_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

fn icon_for(kind: MemoryKind) -> &'static str {
    match kind {
        MemoryKind::Folder => "folder",
        MemoryKind::File => "file",
        MemoryKind::Document => "document",
        MemoryKind::Log => "log",
        MemoryKind::Photo => "photo",
        MemoryKind::Link => "link",
        MemoryKind::Place => "place",
        MemoryKind::Dataset => "dataset",
    }
}
