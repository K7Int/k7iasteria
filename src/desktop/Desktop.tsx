import { useEffect, useState } from "react";
import { useWindowStore, type WindowInstance } from "../stores/windowStore";
import { useMemoryStore } from "../stores/memoryStore";
import WindowFrame from "./WindowFrame";
import DesktopIcon from "./DesktopIcon";
import MenuBar from "./MenuBar";
import SystemTray from "./SystemTray";
import SearchPalette from "./search/SearchPalette";
import type { Memory } from "../types";
import wallpaper from "../assets/wallpaper.png";
import emptyState from "../assets/empty-state.png";

export default function Desktop() {
  const windows = useWindowStore((s) => s.windows);
  const open = useWindowStore((s) => s.open);
  const desktopChildren = useMemoryStore((s) => s.desktopChildren);
  const recent = useMemoryStore((s) => s.recent);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openMemory(m: Memory) {
    if (m.kind === "folder") openFolder(m);
    else
      open({
        id: `mem_${m.id}`,
        kind: "memory",
        title: m.title,
        payload: m,
        width: 540,
        height: 480,
      });
  }

  function openFolder(m: Memory) {
    open({
      id: `fld_${m.id}`,
      kind: "folder",
      title: m.title,
      payload: m.id,
      width: 640,
      height: 440,
    });
  }

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{
        backgroundColor: "#cfc6b1",
        backgroundImage: `url(${wallpaper})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <MenuBar onOpenPalette={() => setPaletteOpen(true)} />

      <div className="relative flex-1 overflow-hidden">
        {/* Floating desktop icons - the scattered memory stores */}
        <DesktopIcon
          x={28}
          y={28}
          glyph="🗕"
          label="Timeline"
          onOpen={() =>
            open({
              id: "timeline",
              kind: "timeline",
              title: "Timeline",
              width: 640,
              height: 480,
            })
          }
        />
        <DesktopIcon
          x={28}
          y={108}
          glyph="⌕"
          label="Search"
          onOpen={() => setPaletteOpen(true)}
        />
        <DesktopIcon
          x={28}
          y={188}
          glyph="ℹ"
          label="System Info"
          onOpen={() =>
            open({
              id: "sysinfo",
              kind: "system-info",
              title: "System Information",
              width: 420,
              height: 360,
            })
          }
        />
        <DesktopIcon
          x={28}
          y={268}
          glyph="↧"
          label="Import"
          onOpen={() =>
            open({
              id: "import",
              kind: "import",
              title: "File Import",
              width: 480,
              height: 420,
            })
          }
        />

        {/* Floating folders scattered on desktop */}
        {desktopChildren
          .filter((m) => m.kind === "folder")
          .map((m, i) => (
            <DesktopIcon
              key={m.id}
              x={120 + (i % 4) * 110}
              y={40 + Math.floor(i / 4) * 96}
              glyph="📁"
              label={m.title}
              color={m.color ?? undefined}
              onOpen={() => openFolder(m)}
            />
          ))}

        {/* Recently opened - small dock at bottom-left */}
        {recent.length > 0 && (
          <div className="absolute bottom-3 left-3 panel px-2 py-1 flex gap-2 items-center max-w-[60%] overflow-hidden">
            <span className="text-[10px] uppercase tracking-widest text-[#5a5346] px-1">
              Recent
            </span>
            {recent.slice(0, 6).map((m) => (
              <button
                key={m.id}
                className="bevel-btn px-2 py-0.5 text-xs truncate max-w-[140px]"
                title={m.title}
                onClick={() => openMemory(m)}
              >
                {m.title}
              </button>
            ))}
          </div>
        )}

        {/* Windows */}
        {windows.map((w) => (
          <WindowFrame key={w.id} win={w} />
        ))}

        {recent.length === 0 && desktopChildren.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="panel px-6 py-4 text-center max-w-md">
              <img
                src={emptyState}
                alt="Empty memory desktop"
                className="mx-auto mb-3 h-40 w-auto opacity-90"
                style={{ imageRendering: "pixelated" }}
              />
              <div className="font-bold mb-1">K7I Asteria</div>
              <div className="text-sm text-[#5a5346]">
                Your memory filesystem is empty. Open the <em>Import</em>
                {" "}icon to bring in CSV or JSON, or use <em>File ▸ New Memory</em>.
              </div>
            </div>
          </div>
        )}
      </div>

      <SystemTray onOpenSettings={() =>
        open({ id: "settings", kind: "settings", title: "Settings", width: 480, height: 420 })
      } />
      {paletteOpen && (
        <SearchPalette
          onClose={() => setPaletteOpen(false)}
          onPick={(m) => {
            setPaletteOpen(false);
            openMemory(m);
          }}
          onOpenTimeline={() =>
            open({ id: "timeline", kind: "timeline", title: "Timeline" })
          }
        />
      )}
    </div>
  );
}
// silence unused WindowInstance import warning in some toolchains
export type _Unused = WindowInstance;
