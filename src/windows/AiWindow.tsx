import { useEffect, useState } from "react";
import api from "../memory/ipc";
import { useMemoryStore } from "../stores/memoryStore";

export default function AiWindow() {
  const insight = useMemoryStore((s) => s.insight);
  const runInsight = useMemoryStore((s) => s.runInsight);
  const [id, setId] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void runInsight();
  }, [runInsight]);

  async function summarize() {
    if (!id) return;
    setBusy(true);
    try {
      const r = await api.aiSummarize(id);
      setSummary(r.summary);
    } catch (e) {
      setSummary(`Error: ${(e as Error).message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  async function tags() {
    if (!id) return;
    setBusy(true);
    try {
      const r = await api.aiSuggestTags(id);
      setSuggestedTags(r.tags);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3 text-[12px]">
      <div className="titlebar px-2 py-1 text-[10px] uppercase tracking-widest text-[#5a5346]">
        AI Workspace
      </div>
      <label className="flex items-center gap-2">
        <span className="w-20 text-right text-[#5a5346]">Memory id</span>
        <input
          className="panel-inset flex-1 px-2 py-1 outline-none"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="paste a memory id…"
        />
      </label>
      <div className="flex gap-2">
        <button className="bevel-btn px-3 py-1" disabled={busy} onClick={summarize}>
          Summarize
        </button>
        <button className="bevel-btn px-3 py-1" disabled={busy} onClick={tags}>
          Suggest tags
        </button>
      </div>
      {summary && (
        <div className="panel-inset px-2 py-1 text-[11px]">{summary}</div>
      )}
      {suggestedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestedTags.map((t) => (
            <span key={t} className="panel-inset px-2 py-0.5 text-[11px]">
              #{t}
            </span>
          ))}
        </div>
      )}
      <div className="panel px-3 py-2 mt-auto">
        <div className="text-[10px] uppercase tracking-widest text-[#5a5346]">
          Life Insight
        </div>
        {insight ? (
          <>
            <div className="mt-1 font-semibold">{insight.headline}</div>
            <div className="text-[11px] text-[#5a5346]">{insight.suggestion}</div>
            {insight.recent_titles.length > 0 && (
              <ul className="mt-1 text-[11px]">
                {insight.recent_titles.map((t) => (
                  <li key={t}>· {t}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div className="text-[11px] text-[#5a5346]">Computing…</div>
        )}
      </div>
    </div>
  );
}
