import { useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useMemoryStore } from "../stores/memoryStore";

const KINDS: { id: string; label: string; hint: string }[] = [
  { id: "csv", label: "CSV", hint: "Comma-separated. First row is the header." },
  { id: "json", label: "JSON", hint: "A memory object or array." },
  { id: "sample", label: "Sample Data", hint: "Re-insert starter folders." },
];

const PLUGINS = [
  "CSV",
  "JSON",
  "Goodreads",
  "Letterboxd",
  "Spotify",
  "Strava",
  "Apple Health",
  "Google Takeout",
  "Photos",
  "Bookmarks",
];

export default function ImportWindow() {
  const importFile = useMemoryStore((s) => s.importFile);
  const [kind, setKind] = useState("csv");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick() {
    const chosen = await open({
      multiple: false,
      filters: [{ name: "Supported", extensions: ["csv", "json", "txt"] }],
    });
    if (typeof chosen === "string") {
      const content = await readTextFile(chosen);
      setText(content);
      setStatus(`Imported from: ${chosen.split(/[\\/]/).pop() ?? chosen}`);
    }
  }

  async function run() {
    setBusy(true);
    try {
      if (kind === "sample") {
        const n = await importFile("sample", "", null);
        setStatus(n > 0 ? `Inserted ${n} starter items.` : "Store unchanged.");
      } else {
        const n = await importFile(kind, text, null);
        setStatus(`Imported ${n} ${kind.toUpperCase()} item(s).`);
        setText("");
      }
    } catch (e) {
      setStatus(`Error: ${(e as Error).message ?? e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3 text-[12px]">
      <div className="panel px-2 py-1 text-[10px] uppercase tracking-widest text-[#5a5346]">
        File Import
      </div>

      <div className="flex gap-2">
        {KINDS.map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            className={`bevel-btn px-2 py-1 ${
              kind === k.id ? "bg-[#1d1a14] text-[#f4ecd8]" : ""
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="text-[10px] text-[#5a5346]">
        {KINDS.find((k) => k.id === kind)?.hint}
      </div>

      {kind !== "sample" && (
        <>
          <div className="flex gap-2">
            <button className="bevel-btn px-2 py-1" onClick={pick}>
              Open File…
            </button>
            <span className="text-[10px] text-[#5a5346] self-center">
              or paste content below
            </span>
          </div>
          <textarea
            className="panel-inset flex-1 px-2 py-1 outline-none resize-none font-mono text-[10px]"
            placeholder="Paste CSV or JSON here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </>
      )}

      <button
        className="bevel-btn px-3 py-1 self-start"
        disabled={busy}
        onClick={run}
      >
        {busy ? "Importing…" : "Run Import"}
      </button>

      {status && <div className="panel-inset px-2 py-1 text-[11px]">{status}</div>}

      <div className="mt-2 border-t border-[#5a534655] pt-2">
        <div className="text-[10px] uppercase tracking-widest text-[#5a5346] mb-1">
          Available Plugins (UI placeholder)
        </div>
        <div className="flex flex-wrap gap-1">
          {PLUGINS.map((p) => (
            <span key={p} className="panel-inset px-2 py-0.5 text-[11px]">
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
