//! Tauri command surface - thin transport over the application services.

pub mod ai;
pub mod error;
pub mod import;
pub mod memory;
pub mod search;
pub mod state;
pub mod stats;
pub mod timeline;

pub use error::{CmdError, CmdResult};
