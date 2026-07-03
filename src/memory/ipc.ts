// Typed bridge to the Rust Tauri command surface.
// Every command declared in src-tauri/src/commands/* has a matching
// wrapper here, so frontend code never invokes raw `invoke`.

import { invoke } from "@tauri-apps/api/core";
import type {
  AiStatus,
  InsightResult,
  Link,
  Memory,
  MemoryKind,
  ProviderConfig,
  SuggestTagsResult,
  SummaryResult,
  SystemStats,
  TimelineYear,
} from "../types";

export interface CreateMemoryInput {
  title: string;
  kind: MemoryKind;
  parent_id: string | null;
  content?: string;
  tags?: string[];
  icon?: string;
  color?: string;
}

export interface UpdateMemoryInput {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
  icon?: string;
  color?: string;
  occurred_at?: string;
}

export interface LinkInput {
  source_id: string;
  target_id: string;
  relation?: string;
}

const api = {
  listChildren: (parentId: string | null) =>
    invoke<Memory[]>("list_children", { parentId: parentId }),
  getMemory: (id: string) => invoke<Memory | null>("get_memory", { id }),
  createMemory: (input: CreateMemoryInput) =>
    invoke<Memory>("create_memory", { input }),
  updateMemory: (input: UpdateMemoryInput) =>
    invoke<Memory>("update_memory", { input }),
  deleteMemory: (id: string) => invoke<void>("delete_memory", { id }),
  moveMemory: (id: string, newParentId: string | null) =>
    invoke<void>("move_memory", { id, newParentId }),
  linkMemories: (input: LinkInput) =>
    invoke<Link>("link_memories", { input }),
  unlinkMemories: (sourceId: string, targetId: string, relation: string) =>
    invoke<void>("unlink_memories", { sourceId, targetId, relation }),
  linksOf: (id: string) => invoke<Link[]>("links_of", { id }),
  recentMemories: (limit?: number) =>
    invoke<Memory[]>("recent_memories", { limit }),

  searchMemories: (
    query: string,
    kinds?: string[],
    tags?: string[],
  ) => invoke<Memory[]>("search_memories", { query, kinds, tags }),

  systemStats: () => invoke<SystemStats>("system_stats"),

  timelineRoot: () => invoke<TimelineYear[]>("timeline_root"),
  timelineYear: (year: number) =>
    invoke<Memory[]>("timeline_year", { year }),

  importFile: (
    kind: string,
    source: string,
    parentId: string | null,
  ) => invoke<number>("import_file", { kind, source, parentId }),
  importSampleData: () => invoke<number>("import_sample_data"),

  aiSummarize: (id: string) =>
    invoke<SummaryResult>("ai_summarize", { id }),
  aiSuggestTags: (id: string) =>
    invoke<SuggestTagsResult>("ai_suggest_tags", { id }),
  aiInsight: () => invoke<InsightResult>("ai_insight"),
  aiConfigure: (config: { active: ProviderConfig | null }) =>
    invoke<void>("ai_configure", { config }),
  aiStatus: () => invoke<AiStatus>("ai_status"),

  getAppState: (key: string) =>
    invoke<string | null>("get_app_state", { key }),
  setAppState: (key: string, value: string) =>
    invoke<void>("set_app_state", { key, value }),
};

export type MemoryApi = typeof api;

export default api;
