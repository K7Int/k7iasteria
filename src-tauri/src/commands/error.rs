//! Bridging `anyhow::Error` into a Tauri-serialisable command error.
//!
//! Tauri command return types must implement `Serialize`, which the
//! opaque `anyhow::Error` does not. We expose a thin newtype that
//! serialises to its display string and auto-converts from any error
//! that implements `std::error::Error + Send + Sync + 'static`, so the
//! command layer keeps using `?` ergonomics.

use serde::{Serialize, Serializer};

#[derive(Debug)]
pub struct CmdError(pub String);

impl Serialize for CmdError {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.0)
    }
}

impl From<anyhow::Error> for CmdError {
    fn from(err: anyhow::Error) -> Self {
        Self(err.to_string())
    }
}

impl From<serde_json::Error> for CmdError {
    fn from(err: serde_json::Error) -> Self {
        Self(err.to_string())
    }
}

impl From<chrono::ParseError> for CmdError {
    fn from(err: chrono::ParseError) -> Self {
        Self(err.to_string())
    }
}

/// Convenience alias used by every Tauri command.
pub type CmdResult<T> = Result<T, CmdError>;
