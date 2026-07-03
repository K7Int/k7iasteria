//! Domain layer - pure memory model and the rules that govern it.
//!
//! No I/O lives here; pure functions, value objects and the in-memory
//! `Memory` aggregate that the repository persists.

pub mod memory;
pub mod kind;

pub use kind::MemoryKind;
pub use memory::{Link, Memory, MemoryId};
