import { useEffect, useState } from "react";
import api from "../memory/ipc";
import type { AiStatus } from "../types";

export default function SettingsWindow() {
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [provider, setProvider] = useState("ollama");
  const [host, setHost] = useState("http://localhost:11434");
  const [model, setModel] = useState("llama3.1");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void api.aiStatus().then(setStatus);
  }, []);

  async function save() {
    let cfg: import("../types").ProviderConfig;
    if (provider === "openai") cfg = { kind: "openai", api_key: apiKey, model };
    else if (provider === "anthropic") cfg = { kind: "anthropic", api_key: apiKey, model };
    else if (provider === "custom") cfg = { kind: "custom", endpoint: host, key: apiKey, model };
    else cfg = { kind: "ollama", host, model };
    await api.aiConfigure({ active: cfg });
    void api.aiStatus().then(setStatus);
    setSaved(true);
  }

  return (
    <div className="flex h-full flex-col gap-2 p-3 text-[12px]">
      <div className="panel px-2 py-1 text-[10px] uppercase tracking-widest text-[#5a5346]">
        Settings
      </div>

      <div className="panel px-3 py-2">
        <div className="mb-1 font-semibold">AI Provider</div>
        <label className="flex items-center gap-2">
          <span className="w-20 text-right text-[#5a5346]">Provider</span>
          <select
            className="panel-inset px-2 py-1 outline-none"
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
          >
            <option value="ollama">Ollama (local)</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="custom">Custom endpoint</option>
          </select>
        </label>
        {provider === "ollama" && (
          <label className="flex items-center gap-2 mt-1">
            <span className="w-20 text-right text-[#5a5346]">Host</span>
            <input
              className="panel-inset flex-1 px-2 py-1 outline-none"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </label>
        )}
        <label className="flex items-center gap-2 mt-1">
          <span className="w-20 text-right text-[#5a5346]">Model</span>
          <input
            className="panel-inset flex-1 px-2 py-1 outline-none"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          />
        </label>
        {(provider === "openai" || provider === "anthropic" || provider === "custom") && (
          <label className="flex items-center gap-2 mt-1">
            <span className="w-20 text-right text-[#5a5346]">API key</span>
            <input
              type="password"
              className="panel-inset flex-1 px-2 py-1 outline-none"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </label>
        )}
        <div className="mt-2 flex items-center gap-2">
          <button className="bevel-btn px-3 py-1" onClick={save}>
            Save
          </button>
          <span className="text-[10px]">
            Status: {status?.online ? `online via ${status.provider?.kind ?? "?"}` : "offline (local heuristics)"}
          </span>
          {saved && <span className="text-[#3f6b3a]">· saved</span>}
        </div>
        <div className="mt-1 text-[10px] text-[#5a5346]">
          The AI layer works offline with local heuristics. Configure a provider
          to enable summarization and tag suggestions powered by your own model.
        </div>
      </div>

      <div className="panel px-3 py-2">
        <div className="mb-1 font-semibold">About</div>
        <div className="text-[11px] text-[#5a5346]">
          K7I Asteria stores everything locally in a SQLite database inside
          your user data directory. No network calls are made unless a cloud
          AI provider is configured.
        </div>
      </div>
    </div>
  );
}
