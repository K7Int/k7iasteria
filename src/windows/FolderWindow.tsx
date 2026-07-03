import { useEffect, useState } from "react";
import api from "../memory/ipc";
import { useWindowStore } from "../stores/windowStore";
import { useMemoryStore } from "../stores/memoryStore";
import type { Memory } from "../types";
import { formatDateShort, KIND_ICONS, KIND_LABELS } from "../types";

interface Props {
  folderId: string;
}

export default function FolderWindow({ folderId }: Props) {
  const open = useWindowStore((s) => s.open);
  const createMemory = useMemoryStore((s) => s.createMemory);
  const [children, setChildren] = useState<Memory[]>([]);
  const [draft, setDraft] = useState<Memory | null>(null);

  async function refresh() {
    setChildren(await api.listChildren(folderId));
  }

  useEffect(() => {
    void refresh();
  }, [folderId]);

  function openChild(m: Memory) {
    if (m.kind === "folder") {
      open({
        id: `fld_${m.id}`,
        kind: "folder",
        title: m.title,
        payload: m.id,
        width: 640,
        height: 440,
      });
    } else {
      open({
        id: `mem_${m.id}`,
        kind: "memory",
        title: m.title,
        payload: m,
        width: 540,
        height: 480,
      });
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="titlebar flex items-center gap-2 border-b border-[#8a826f] px-2 py-1 text-[11px]">
        <span className="text-[#5a5346]">{children.length} items</span>
        <button
          className="bevel-btn px-2 py-0.5"
          onClick={() => setDraft({} as Memory)}
        >
          + New
        </button>
        <button className="bevel-btn px-2 py-0.5" onClick={refresh}>
          ↻
        </button>
      </div>

      {draft && (
        <div className="panel-inset mx-2 mt-2 p-2 text-[11px]">
          <div className="flex items-center gap-2">
            <input
              className="panel px-2 py-0.5 outline-none"
              placeholder="New memory title…"
              autoFocus
              onChange={(e) =>
                setDraft({ ...draft, title: e.target.value })
              }
            />
            <input
              className="panel px-2 py-0.5 w-24 outline-none"
              placeholder="tags comma"
              onChange={(e) =>
                setDraft({
                  ...draft,
                  tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                })
              }
            />
            <button
              className="bevel-btn px-2 py-0.5"
              onClick={async () => {
                if (!draft.title) return;
                await createMemory({
                  title: draft.title,
                  kind: "file",
                  parent_id: folderId,
                  tags: draft.tags,
                });
                setDraft(null);
                void refresh();
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="grow grid gap-1 p-2 overflow-auto scroll-thin" style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
      }}>
        {children.map((m) => (
          <button
            key={m.id}
            className="panel-inset flex flex-col items-start gap-1 p-2 text-left text-[11px]"
            onClick={() => openChild(m)}
            onDoubleClick={() => openChild(m)}
            title={m.title}
          >
            <div className="flex w-full items-center gap-2">
              <span className="text-[14px]" style={m.color ? { color: m.color } : undefined}>
                {m.kind === "folder" ? "📁" : KIND_ICONS[m.kind]}
              </span>
              <span className="truncate font-medium">{m.title}</span>
            </div>
            <div className="flex w-full justify-between text-[9px] text-[#5a5346]">
              <span>{KIND_LABELS[m.kind]}</span>
              <span>{formatDateShort(m.occurred_at)}</span>
            </div>
            {m.tags.length > 0 && (
              <div className="truncate text-[9px] opacity-80">
                {m.tags.map((t) => `#${t}`).join(" ")}
              </div>
            )}
          </button>
        ))}
        {children.length === 0 && (
          <div className="col-span-full py-8 text-center text-[#5a5346] text-[11px]">
            This folder is empty.
          </div>
        )}
      </div>
    </div>
  );
}
