import { useEffect, useState } from "react";
import api from "../memory/ipc";
import { useMemoryStore } from "../stores/memoryStore";
import type { Link, Memory, MemoryKind } from "../types";
import { formatDate, KIND_LABELS } from "../types";

interface Props {
  memory: Memory | null;
}

const KINDS: MemoryKind[] = [
  "file",
  "folder",
  "document",
  "log",
  "photo",
  "link",
  "place",
  "dataset",
];

function blankMemory(): Memory {
  const now = new Date().toISOString();
  return {
    id: "",
    parent_id: null,
    title: "",
    kind: "file",
    content: "",
    metadata: {},
    tags: [],
    icon: "file",
    color: null,
    sort_key: 0,
    created_at: now,
    updated_at: now,
    occurred_at: now,
    deleted: false,
  };
}

export default function MemoryWindow({ memory }: Props) {
  const createMemory = useMemoryStore((s) => s.createMemory);
  const updateMemory = useMemoryStore((s) => s.updateMemory);
  const deleteMemory = useMemoryStore((s) => s.deleteMemory);

  const [draft, setDraft] = useState<Memory>(() => memory ?? blankMemory());
  const [tagInput, setTagInput] = useState("");
  const [links, setLinks] = useState<Link[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const isNew = !draft.id;

  useEffect(() => {
    setDraft(memory ?? blankMemory());
    setSavedAt(null);
    if (memory) void api.linksOf(memory.id).then(setLinks);
    else setLinks([]);
  }, [memory]);

  function patch(p: Partial<Memory>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  async function save() {
    if (isNew) {
      const created = await createMemory({
        title: draft.title || "(untitled)",
        kind: draft.kind,
        parent_id: draft.parent_id,
        content: draft.content,
        tags: draft.tags,
        icon: draft.icon,
      });
      setDraft(created);
      setSavedAt("created");
    } else {
      const updated = await updateMemory({
        id: draft.id,
        title: draft.title,
        content: draft.content,
        tags: draft.tags,
        icon: draft.icon,
      });
      setDraft(updated);
      setSavedAt("saved");
    }
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3 text-[12px]">
      <div className="titlebar px-1 text-[10px] uppercase tracking-widest text-[#5a5346]">
        {isNew ? "New Memory" : "Edit Memory"}
      </div>

      <label className="flex items-center gap-2">
        <span className="w-16 text-right text-[#5a5346]">Title</span>
        <input
          className="panel-inset flex-1 px-2 py-1 outline-none"
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
        />
      </label>

      <label className="flex items-center gap-2">
        <span className="w-16 text-right text-[#5a5346]">Kind</span>
        <select
          className="panel-inset px-2 py-1 outline-none"
          value={draft.kind}
          onChange={(e) => patch({ kind: e.target.value as MemoryKind, icon: e.target.value })}
        >
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </label>

      <textarea
        className="panel-inset flex-1 px-2 py-1 outline-none resize-none"
        style={{ minHeight: 140 }}
        placeholder="Body…"
        value={draft.content}
        onChange={(e) => patch({ content: e.target.value })}
      />

      <div className="flex flex-col gap-1">
        <span className="text-[#5a5346] text-[10px] uppercase tracking-widest">
          Tags
        </span>
        <div className="flex flex-wrap gap-1">
          {draft.tags.map((t) => (
            <span
              key={t}
              className="panel-inset px-1 py-0.5 text-[11px] flex items-center gap-1"
            >
              {t}
              <button
                className="text-[#7b2d2d]"
                onClick={() =>
                  patch({ tags: draft.tags.filter((x) => x !== t) })
                }
              >
                ⊗
              </button>
            </span>
          ))}
          <input
            className="panel-inset px-2 py-0.5 text-[11px] w-32 outline-none"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                e.preventDefault();
                patch({ tags: [...draft.tags, tagInput.trim()] });
                setTagInput("");
              }
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 text-[11px]">
        <span className="text-[#5a5346] text-[10px] uppercase tracking-widest">
          Metadata
        </span>
        <div className="panel-inset px-2 py-1 font-mono text-[10px] max-h-24 overflow-auto scroll-thin">
          {Object.keys(draft.metadata).length === 0
            ? "—"
            : JSON.stringify(draft.metadata, null, 2)}
        </div>
      </div>

      {!isNew && links.length > 0 && (
        <div className="flex flex-col gap-1 text-[11px]">
          <span className="text-[#5a5346] text-[10px] uppercase tracking-widest">
            Links
          </span>
          <ul className="panel-inset px-2 py-1 max-h-20 overflow-auto scroll-thin">
            {links.map((l) => (
              <li key={l.id} className="truncate">
                <span className="text-[#7b2d2d]">→</span>{" "}
                {l.source_id === draft.id ? l.target_id : l.source_id}
                <span className="opacity-60"> ({l.relation})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 text-[10px] text-[#5a5346]">
        {!isNew && (
          <>
            <span>Created {formatDate(draft.created_at)}</span>
            <span>· Occurred {formatDate(draft.occurred_at)}</span>
          </>
        )}
        {savedAt && <span className="text-[#3f6b3a]">· {savedAt}</span>}
      </div>

      <div className="mt-auto flex items-center gap-2 pt-1">
        <button className="bevel-btn px-3 py-1" onClick={save}>
          {isNew ? "Create" : "Save"}
        </button>
        {!isNew && (
          <button
            className="bevel-btn px-3 py-1 text-[#7b2d2d]"
            onClick={() => {
              if (confirm(`Delete “${draft.title}”?`)) void deleteMemory(draft.id);
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
