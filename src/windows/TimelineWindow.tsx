import { useEffect, useState } from "react";
import api from "../memory/ipc";
import { useWindowStore } from "../stores/windowStore";
import { useMemoryStore } from "../stores/memoryStore";
import type { Memory } from "../types";
import { formatDateShort, KIND_ICONS, KIND_LABELS } from "../types";

export default function TimelineWindow() {
  const open = useWindowStore((s) => s.open);
  const timeline = useMemoryStore((s) => s.timeline);
  const refreshTimeline = useMemoryStore((s) => s.refreshTimeline);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    void refreshTimeline();
  }, [refreshTimeline]);

  useEffect(() => {
    if (expandedYear == null) return;
    void api.timelineYear(expandedYear).then(setMemories);
  }, [expandedYear]);

  return (
    <div className="flex h-full flex-col text-[12px]">
      <div className="titlebar border-b border-[#8a826f] px-2 py-1 text-[11px]">
        Chronological File Explorer
      </div>
      <div className="grow overflow-auto scroll-thin p-2">
        {timeline.length === 0 && (
          <div className="text-[#5a5346]">No dated memories yet.</div>
        )}
        {timeline.map((y) => (
          <div key={y.year} className="mb-1">
            <button
              className="bevel-btn w-full px-2 py-1 text-left text-[12px] font-semibold flex justify-between"
              onClick={() =>
                setExpandedYear(expandedYear === y.year ? null : y.year)
              }
            >
              <span>{expandedYear === y.year ? "▾" : "▸"} {y.year}</span>
              <span className="text-[10px] text-[#5a5346]">{y.count}</span>
            </button>
            {expandedYear === y.year && (
              <ul className="ml-4 mt-1 border-l border-[#5a534655] pl-2">
                {memories.map((m) => (
                  <li key={m.id}>
                    <button
                      className="flex w-full items-center gap-2 px-1 py-0.5 text-left hover:bg-[#1d1a14] hover:text-[#f4ecd8]"
                      onClick={() =>
                        open({
                          id: `mem_${m.id}`,
                          kind: m.kind === "folder" ? "folder" : "memory",
                          title: m.title,
                          payload: m.kind === "folder" ? m.id : m,
                          width: 540,
                          height: 480,
                        })
                      }
                    >
                      <span>{KIND_ICONS[m.kind]}</span>
                      <span className="flex-1 truncate">{m.title}</span>
                      <span className="text-[10px] opacity-70">
                        {KIND_LABELS[m.kind]} · {formatDateShort(m.occurred_at)}
                      </span>
                    </button>
                  </li>
                ))}
                {memories.length === 0 && (
                  <li className="px-2 py-1 text-[#5a5346]">—</li>
                )}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
