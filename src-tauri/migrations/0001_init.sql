-- K7I Asteria schema: a memory filesystem
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY NOT NULL,
    parent_id TEXT NULL REFERENCES memories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    kind TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    metadata TEXT NOT NULL DEFAULT '{}',
    tags TEXT NOT NULL DEFAULT '[]',
    icon TEXT NOT NULL DEFAULT 'file',
    color TEXT NULL,
    sort_key INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    occurred_at TEXT NULL,
    deleted INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_memories_parent ON memories(parent_id) WHERE deleted = 0;
CREATE INDEX IF NOT EXISTS idx_memories_kind   ON memories(kind) WHERE deleted = 0;
CREATE INDEX IF NOT EXISTS idx_memories_occured ON memories(occurred_at) WHERE deleted = 0;
CREATE INDEX IF NOT EXISTS idx_memories_title  ON memories(title COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY NOT NULL,
    source_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    target_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    relation TEXT NOT NULL DEFAULT 'related',
    created_at TEXT NOT NULL,
    UNIQUE(source_id, target_id, relation)
);

CREATE INDEX IF NOT EXISTS idx_links_source ON links(source_id);
CREATE INDEX IF NOT EXISTS idx_links_target ON links(target_id);

CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY NOT NULL,
    memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL DEFAULT 'application/octet-stream',
    bytes BLOB NULL,
    path_on_disk TEXT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_memory ON attachments(memory_id);

CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);

INSERT OR IGNORE INTO app_state(key, value) VALUES ('schema_version', '1');
INSERT OR IGNORE INTO app_state(key, value) VALUES ('booted_at', strftime('%Y-%m-%dT%H:%M:%fZ','now'));
