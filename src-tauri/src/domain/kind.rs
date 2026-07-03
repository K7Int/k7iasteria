//! `MemoryKind` enumerates the file-system-like roles a memory can play.
//!
//! The strings here are the canonical wire format that crosses the Tauri
//! bridge, so they must remain stable across releases.

use serde::{Deserialize, Serialize};
use std::fmt;

/// The "filetype" of a memory, mirroring classic file system concepts.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MemoryKind {
    /// A collection - equivalent of a directory.
    Folder,
    /// A short textual record - a journal entry, a note.
    File,
    /// A long-form document - the body holds prose.
    Document,
    /// A log-style memory - workouts, runs, sleeps.
    Log,
    /// A media memory. Best accompanied by an attachment.
    Photo,
    /// A pointer to an external resource (URL).
    Link,
    /// A spatial node - a visited place.
    Place,
    /// A structured dataset, rendered as CSV.
    Dataset,
}

impl MemoryKind {
    pub const ALL: &'static [Self] = &[
        Self::Folder,
        Self::File,
        Self::Document,
        Self::Log,
        Self::Photo,
        Self::Link,
        Self::Place,
        Self::Dataset,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            Self::Folder => "folder",
            Self::File => "file",
            Self::Document => "document",
            Self::Log => "log",
            Self::Photo => "photo",
            Self::Link => "link",
            Self::Place => "place",
            Self::Dataset => "dataset",
        }
    }

    pub fn parse_str(value: &str) -> Option<Self> {
        Some(match value {
            "folder" => Self::Folder,
            "file" => Self::File,
            "document" => Self::Document,
            "log" => Self::Log,
            "photo" => Self::Photo,
            "link" => Self::Link,
            "place" => Self::Place,
            "dataset" => Self::Dataset,
            _ => return None,
        })
    }
}

impl fmt::Display for MemoryKind {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}
