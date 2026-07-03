//! Provider-agnostic AI layer.
//!
//! The [`AiHub`] owns an optional [`Provider`] configured at runtime by
//! the user. When no provider is configured, the AI commands return
//! heuristic, fully offline results produced from the memory store
//! itself. This keeps K7I Asteria useful without any network access
//! while leaving the door open to OpenAI, Ollama, Anthropic, etc.

pub mod provider;

use std::sync::{Arc, RwLock};

use serde::{Deserialize, Serialize};

use crate::domain::Memory;
use crate::storage::MemoryRepository;

pub use provider::{Provider, ProviderConfig};

/// Configured AI provider bundle, stored in `app_state` as JSON.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AiRegistry {
    pub active: Option<ProviderConfig>,
}

/// The AI hub exposed to the frontend.
pub struct AiHub {
    repo: Arc<dyn MemoryRepository>,
    config: RwLock<AiRegistry>,
}

impl AiHub {
    pub fn new(repo: Arc<dyn MemoryRepository>) -> Self {
        Self {
            repo,
            config: RwLock::new(AiRegistry::default()),
        }
    }

    pub fn configure(&self, cfg: AiRegistry) {
        *self.config.write().unwrap() = cfg;
    }

    pub fn registry(&self) -> AiRegistry {
        self.config.read().unwrap().clone()
    }

    pub fn status(&self) -> AiStatus {
        let active = self.config.read().unwrap().active.clone();
        AiStatus { online: active.is_some(), provider: active }
    }

    /// Cheap offline summariser: builds a traffic-light digest from the
    /// memory body, list of tags, and metadata keys.
    pub async fn summarize(&self, id: &str) -> anyhow::Result<SummaryResult> {
        let opt = self.repo.get(&id.to_string()).await?;
        let Some(m) = opt else {
            return Err(anyhow::anyhow!("memory not found"));
        };

        let summary = local_summarize(&m);
        Ok(SummaryResult {
            memory_id: m.id,
            title: m.title,
            summary,
        })
    }

    /// Suggests tags using trivial text statistics on title + content.
    pub async fn suggest_tags(&self, id: &str) -> anyhow::Result<SuggestTagsResult> {
        let opt = self.repo.get(&id.to_string()).await?;
        let Some(m) = opt else {
            return Err(anyhow::anyhow!("memory not found"));
        };
        let candidates = local_suggest_tags(&m);
        Ok(SuggestTagsResult {
            memory_id: m.id,
            tags: candidates,
        })
    }

    /// Lightweight life-insight over the whole filesystem.
    pub async fn insight(&self) -> anyhow::Result<InsightResult> {
        let all = self.repo.list_children(None).await?;
        let mut kind_counts: std::collections::BTreeMap<String, u32> = Default::default();
        let mut recent_titles: Vec<String> = Vec::new();
        for m in &all {
            *kind_counts.entry(m.kind.as_str().to_string()).or_default() += 1;
            if recent_titles.len() < 5 && !m.is_folder() {
                recent_titles.push(m.title.clone());
            }
        }
        let headline = format!(
            "Your memory filesystem contains {} root collections and {} non-folder kinds.",
            all.len(),
            kind_counts.iter().filter(|(k, _)| *k != "folder").map(|(_, v)| v).sum::<u32>(),
        );
        let suggestion = "Open the Timeline to explore what you've collected by year."
            .to_string();
        Ok(InsightResult {
            headline,
            suggestion,
            kind_counts,
            recent_titles,
        })
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct AiStatus {
    pub online: bool,
    pub provider: Option<ProviderConfig>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SummaryResult {
    pub memory_id: String,
    pub title: String,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct SuggestTagsResult {
    pub memory_id: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct InsightResult {
    pub headline: String,
    pub suggestion: String,
    pub kind_counts: std::collections::BTreeMap<String, u32>,
    pub recent_titles: Vec<String>,
}

fn local_summarize(m: &Memory) -> String {
    let mut parts = Vec::new();
    parts.push(format!("“{}” — a {}.", m.title, m.kind));
    if !m.tags.is_empty() {
        parts.push(format!("Tagged: {}.", m.tags.join(", ")));
    }
    if !m.content.is_empty() {
        let words: Vec<&str> = m.content.split_whitespace().take(40).collect();
        parts.push(format!("Excerpt: {}…", words.join(" ")));
    }
    if !m.metadata.is_empty() {
        parts.push(format!("Metadata keys: {}.", m.metadata.keys().cloned().collect::<Vec<_>>().join(", ")));
    }
    if parts.len() == 1 {
        parts.push("Empty memory — add content, tags or metadata to fill it in.".into());
    }
    parts.join(" ")
}

fn local_suggest_tags(m: &Memory) -> Vec<String> {
    use std::collections::HashMap;
    let mut counts: HashMap<String, u32> = HashMap::new();
    let text = format!("{} {}", m.title, m.content).to_lowercase();
    for word in text.split(|c: char| !c.is_alphanumeric()) {
        if word.len() < 4 || word.chars().all(|c| c.is_numeric()) {
            continue;
        }
        *counts.entry(word.to_string()).or_default() += 1;
    }
    let mut sorted: Vec<(String, u32)> = counts.into_iter().collect();
    sorted.sort_by_key(|(_, c)| std::cmp::Reverse(*c));
    let mut tags: Vec<String> = sorted.into_iter().take(8).map(|(t, _)| t).collect();
    for existing in &m.tags {
        if !tags.iter().any(|t| t == existing) {
            tags.push(existing.clone());
        }
    }
    tags.truncate(12);
    tags
}


