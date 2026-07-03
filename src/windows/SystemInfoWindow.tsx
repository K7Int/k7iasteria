import { useEffect } from "react";
import { useMemoryStore } from "../stores/memoryStore";
import { KIND_LABELS } from "../types";
import wordmark from "../assets/wordmark.png";

export default function SystemInfoWindow() {
  const stats = useMemoryStore((s) => s.stats);
  const refreshStats = useMemoryStore((s) => s.refreshStats);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const years = stats ? Object.entries(stats.by_year).sort((a, b) => Number(b[0]) - Number(a[0])) : [];
  const maxYear = years.reduce((m, [, n]) => Math.max(m, n), 1);

  return (
    <div className="flex h-full flex-col gap-2 p-3 text-[12px]">
      <div className="panel flex items-center gap-3 px-3 py-2">
        <div className="grid h-10 w-10 place-items-center text-2xl panel-inset">
          ⌗
        </div>
        <div className="flex-1">
          <img
            src={wordmark}
            alt="K7I Asteria"
            className="h-6 w-auto opacity-90"
            style={{ imageRendering: "pixelated" }}
          />
          <div className="text-[10px] text-[#5a5346]">
            Version 1.0 · Personal Memory OS
          </div>
        </div>
        <div className="text-right text-[10px] text-[#5a5346]">
          Booted {stats ? new Date(stats.apparent_booted_at).toLocaleString() : "…"}
        </div>
      </div>

      <div className="panel-inset px-3 py-2 flex justify-between items-center">
        <span>Memory filesystem total</span>
        <span className="text-[18px] font-bold">{stats?.total ?? "…"}</span>
      </div>

      <div className="panel px-3 py-2">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-[#5a5346]">
          By Kind
        </div>
        <ul className="space-y-1">
          {Object.entries(stats?.by_kind ?? {}).map(([k, n]) => (
            <li key={k} className="flex justify-between">
              <span>{KIND_LABELS[k as keyof typeof KIND_LABELS] ?? k}</span>
              <span className="font-mono">{n}</span>
            </li>
          ))}
          {Object.keys(stats?.by_kind ?? {}).length === 0 && (
            <li className="text-[#5a5346]">—</li>
          )}
        </ul>
      </div>

      <div className="panel px-3 py-2">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-[#5a5346]">
          Yearly Activity
        </div>
        <ul className="space-y-1">
          {years.map(([y, n]) => (
            <li key={y} className="flex items-center gap-2">
              <span className="w-10">{y}</span>
              <div className="panel-inset h-2 flex-1 overflow-hidden">
                <div
                  className="h-full bg-[#3f6b3a]"
                  style={{ width: `${(Number(n) / maxYear) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono">{n}</span>
            </li>
          ))}
          {years.length === 0 && (
            <li className="text-[#5a5346]">No occurred_at data.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
