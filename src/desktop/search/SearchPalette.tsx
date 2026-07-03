import { useEffect, useRef, useState } from "react";
import { useMemoryStore } from "../../stores/memoryStore";
import { useWindowStore } from "../../stores/windowStore";
import type { Memory } from "../../types";
import { KIND_LABELS } from "../../types";

interface Props {
  onClose: () => void;
  onPick: (m: Memory) => void;
  onOpenTimeline: () => void;
}

const KIND_FILTERS = [
  { id: "", label: "All" },
  { id: "folder", label: "Folders" },
  { id: "file", label: "Files" },
  { id: "document", label: "Documents" },
  { id: "log", label: "Logs" },
  { id: "photo", label: "Photos" },
  { id: "place", label: "Places" },
];

const EXAMPLES = [
  "trips with books",
  "iceland",
  "journals mentioning Berlin",
  "2022",
];

export default function SearchPalette({ onClose, onPick }: Props) {
  const search = useMemoryStore((s) => s.search);
  const open = useWindowStore((s) => s.open);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [results, setResults] = useState<Memory[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const term = q.trim();
    if (term.length === 0) {
      setResults([]);
      return;
    }
    void search(term, kind ? [kind] : undefined).then((r) => {
      if (!cancelled) {
        setResults(r);
        setActive(0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [q, kind, search]);

  function choose(m: Memory) {
    onPick(m);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (results[active]) {
        e.preventDefault();
        choose(results[active]);
      }
    }
  }

  return (
    <div
      className="absolute inset-0 z-[1000] flex items-start justify-center bg-[#1d1a1433]"
      onMouseDown={onClose}
    >
      <div
        className="win-frame mt-20 w-[560px] flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="titlebar px-2 py-1 text-[11px] uppercase tracking-widest text-[#5a5346]">
          System Search
        </div>
        <div className="p-2">
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="filename, metadata, contents, tags"
            className="panel-inset w-full px-2 py-1.5 outline-none text-[13px]"
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {KIND_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setKind(f.id)}
                className={`bevel-btn px-2 py-0.5 text-[11px] ${
                  kind === f.id ? "bg-[#1d1a14] text-[#f4ecd8]" : ""
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="max-h-[300px] overflow-auto scroll-thin px-2 pb-2"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {q.trim().length === 0 ? (
            <>
              <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-[#5a5346]">
                Try
              </div>
              <ul className="px-2 text-[11px]">
                {EXAMPLES.map((x) => (
                  <li
                    key={x}
                    className="cursor-pointer px-1 py-0.5 hover:bg-[#1d1a14] hover:text-[#f4ecd8]"
                    onClick={() => setQ(x)}
                  >
                    {x}
                  </li>
                ))}
              </ul>
            </>
          ) : results.length === 0 ? (
            <div className="px-2 py-3 text-center text-[11px] text-[#5a5346]">
              No memories matched.
            </div>
          ) : (
            <ul>
              {results.map((m, i) => (
                <li key={m.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(m)}
                    className={`flex w-full items-center gap-2 px-2 py-1 text-left text-[11px] ${
                      i === active ? "bg-[#1d1a14] text-[#f4ecd8]" : ""
                    }`}
                  >
                    <span className="w-16 truncate text-[10px] opacity-70">
                      {KIND_LABELS[m.kind]}
                    </span>
                    <span className="flex-1 truncate">{m.title}</span>
                    {m.tags.length > 0 && (
                      <span className="truncate text-[10px] opacity-60">
                        {m.tags.map((t) => `#${t}`).join(" ")}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="titlebar flex justify-between px-2 py-1 text-[10px] text-[#5a5346]">
          <span>↑↓ navigate · ⏎ open · ⎋ close</span>
          <button
            onClick={() =>
              open({ id: "timeline", kind: "timeline", title: "Timeline" })
            }
            className="hover:underline"
          >
            Open Timeline ▸
          </button>
        </div>
      </div>
    </div>
  );
}