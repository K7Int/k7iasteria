// Shared frontend types - mirror the Rust domain layer.

export type MemoryKind =
  | "folder"
  | "file"
  | "document"
  | "log"
  | "photo"
  | "link"
  | "place"
  | "dataset";

export type Metadata = Record<string, unknown>;

export interface Memory {
  id: string;
  parent_id: string | null;
  title: string;
  kind: MemoryKind;
  content: string;
  metadata: Metadata;
  tags: string[];
  icon: string;
  color: string | null;
  sort_key: number;
  created_at: string;
  updated_at: string;
  occurred_at: string | null;
  deleted: boolean;
}

export interface Link {
  id: string;
  source_id: string;
  target_id: string;
  relation: string;
  created_at: string;
}

export interface TimelineYear {
  year: number;
  count: number;
}

export interface SystemStats {
  total: number;
  by_kind: Record<string, number>;
  by_year: Record<number, number>;
  apparent_booted_at: string;
}

export interface SummaryResult {
  memory_id: string;
  title: string;
  summary: string;
}

export interface SuggestTagsResult {
  memory_id: string;
  tags: string[];
}

export interface InsightResult {
  headline: string;
  suggestion: string;
  kind_counts: Record<string, number>;
  recent_titles: string[];
}

export interface AiStatus {
  online: boolean;
  provider: ProviderConfig | null;
}

export type ProviderConfig =
  | { kind: "openai"; api_key: string; model: string }
  | { kind: "anthropic"; api_key: string; model: string }
  | { kind: "ollama"; host: string; model: string }
  | { kind: "custom"; endpoint: string; key: string; model: string };

export const KIND_LABELS: Record<MemoryKind, string> = {
  folder: "Folder",
  file: "File",
  document: "Document",
  log: "Log",
  photo: "Photo",
  link: "Link",
  place: "Place",
  dataset: "Dataset",
};

export const KIND_ICONS: Record<MemoryKind, string> = {
  folder: "F",
  file: "▢",
  document: "Doc",
  log: "▦",
  photo: "▣",
  link: "⌖",
  place: "◉",
  dataset: "▦",
};

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}
