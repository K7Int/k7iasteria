//! K7I Asteria - local-first retro OS for memories.

pub mod ai;
pub mod commands;
pub mod domain;
pub mod importers;
pub mod services;
pub mod storage;

use std::sync::Arc;

use once_cell::sync::Lazy;
use parking_lot::RwLock;
use services::{SearchService, StatsService};
use storage::SqliteMemoryRepository;
use tauri::Manager;

/// Application wide singleton bundle of services.
#[derive(Clone)]
pub struct App {
    pub repo: Arc<SqliteMemoryRepository>,
    pub search: Arc<SearchService>,
    pub stats: Arc<StatsService>,
    pub ai: Arc<ai::AiHub>,
}

/// A drop-in handle that utilities can read with zero contention.
pub static APP: Lazy<RwLock<Option<App>>> = Lazy::new(|| RwLock::new(None));

pub fn init(app: &App) {
    let mut guard = APP.write();
    *guard = Some(app.clone());
}

pub fn get() -> App {
    APP.read()
        .clone()
        .expect("APP was accessed before being initialised")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "k7i_asteria_lib=info,sqlx=warn".into()),
        )
        .compact()
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .setup(|tauri_app| {
            let handle = tauri_app.handle().clone();
            tauri::async_runtime::block_on(async move {
                let db_path = resolve_db_path(&handle)?;
                tracing::info!("opening memory store at {}", db_path.display());

                let pool = storage::open(&db_path).await?;
                storage::migrate(&pool).await?;
                let repo = Arc::new(SqliteMemoryRepository::new(pool));
                let search = Arc::new(SearchService::new(repo.clone()));
                let stats = Arc::new(StatsService::new(repo.clone()));
                let ai = Arc::new(ai::AiHub::new(repo.clone()));

                let bundle = App {
                    repo,
                    search,
                    stats,
                    ai,
                };
                init(&bundle);

                if let Err(e) = storage::seed_if_empty(bundle.repo.as_ref()).await {
                    tracing::warn!("seed failed: {e}");
                }
                Ok(())
            })
        })
        .invoke_handler(tauri::generate_handler![
            commands::memory::list_children,
            commands::memory::get_memory,
            commands::memory::create_memory,
            commands::memory::update_memory,
            commands::memory::delete_memory,
            commands::memory::move_memory,
            commands::memory::link_memories,
            commands::memory::unlink_memories,
            commands::memory::links_of,
            commands::memory::recent_memories,
            commands::search::search_memories,
            commands::stats::system_stats,
            commands::timeline::timeline_root,
            commands::timeline::timeline_year,
            commands::import::import_file,
            commands::import::import_sample_data,
            commands::ai::ai_summarize,
            commands::ai::ai_suggest_tags,
            commands::ai::ai_insight,
            commands::ai::ai_configure,
            commands::ai::ai_status,
            commands::state::get_app_state,
            commands::state::set_app_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running K7I Asteria");
}

fn resolve_db_path(handle: &tauri::AppHandle) -> anyhow::Result<std::path::PathBuf> {
    let dir = handle
        .path()
        .app_data_dir()
        .map_err(|e| anyhow::anyhow!(e.to_string()))?;
    std::fs::create_dir_all(&dir)?;
    Ok(dir.join("asteria.db"))
}
