//! Application services - the use-case layer of clean architecture.
//!
//! Services depend only on `MemoryRepository`, never on the concrete
//! SQLite implementation, so they remain trivially mockable in tests.

pub mod search;
pub mod stats;


pub use search::SearchService;
pub use stats::{StatsService, SystemStats};
