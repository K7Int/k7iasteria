//! External provider configuration. Provider implementations themselves
//! are left as a thin stub so swapping one in is a single trait impl.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "lowercase")]
pub enum ProviderConfig {
    Openai { api_key: String, model: String },
    Anthropic { api_key: String, model: String },
    Ollama { host: String, model: String },
    Custom { endpoint: String, key: String, model: String },
}

/// A provider plugs into the [`AiHub`] in the future. The hub will call
/// `complete` when the user has selected a provider, otherwise it keeps
/// using local heuristics.
#[async_trait::async_trait]
pub trait Provider: Send + Sync + 'static {
    fn name(&self) -> &'static str;
    async fn complete(&self, system: &str, user: &str) -> anyhow::Result<String>;
}
