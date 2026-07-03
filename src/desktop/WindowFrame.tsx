import type { Memory } from "../types";
import { useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useWindowStore, type WindowInstance } from "../stores/windowStore";
import MemoryWindow from "../windows/MemoryWindow";
import FolderWindow from "../windows/FolderWindow";
import TimelineWindow from "../windows/TimelineWindow";
import SystemInfoWindow from "../windows/SystemInfoWindow";
import ImportWindow from "../windows/ImportWindow";
import SettingsWindow from "../windows/SettingsWindow";
import AiWindow from "../windows/AiWindow";

function renderBody(win: WindowInstance): ReactNode {
  switch (win.kind) {
    case "memory":
      return <MemoryWindow memory={(win.payload as Memory | null) ?? null} />;
    case "folder":
      return <FolderWindow folderId={win.payload as string} />;
    case "timeline":
      return <TimelineWindow />;
    case "system-info":
      return <SystemInfoWindow />;
    case "import":
      return <ImportWindow />;
    case "settings":
      return <SettingsWindow />;
    case "ai":
      return <AiWindow />;
    default:
      return null;
  }
}

export default function WindowFrame({ win }: { win: WindowInstance }) {
  const focus = useWindowStore((s) => s.focus);
  const close = useWindowStore((s) => s.close);
  const minimize = useWindowStore((s) => s.minimize);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const move = useWindowStore((s) => s.move);
  const resize = useWindowStore((s) => s.resize);
  const focusedId = useWindowStore((s) => s.focusedId);

  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const resizing = useRef(false);
  const start = useRef({ x: 0, y: 0, w: 0, h: 0 });

  function onTitleMouseDown(e: React.MouseEvent) {
    if (win.maximized) return;
    dragging.current = true;
    offset.current = { x: e.clientX - win.x, y: e.clientY - win.y };
    focus(win.id);
    const moveHandler = (ev: MouseEvent) => {
      if (!dragging.current) return;
      move(win.id, Math.max(0, ev.clientX - offset.current.x), Math.max(0, ev.clientY - offset.current.y));
    };
    const upHandler = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseup", upHandler);
    };
    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseup", upHandler);
  }

  function onResizeMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    resizing.current = true;
    start.current = { x: e.clientX, y: e.clientY, w: win.width, h: win.height };
    focus(win.id);
    const moveHandler = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const w = Math.max(280, start.current.w + (ev.clientX - start.current.x));
      const h = Math.max(220, start.current.h + (ev.clientY - start.current.y));
      resize(win.id, w, h);
    };
    const upHandler = () => {
      resizing.current = false;
      window.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseup", upHandler);
    };
    window.addEventListener("mousemove", moveHandler);
    window.addEventListener("mouseup", upHandler);
  }

  if (win.minimized) return null;

  const focused = focusedId === win.id;
  const rect = win.maximized
    ? { left: 0, top: 0, width: "100%", height: "100%" }
    : { left: win.x, top: win.y, width: win.width, height: win.height };

  return (
    <motion.div
      initial={{ opacity: 0.0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12 }}
      style={{
        ...rect,
        zIndex: win.z,
        position: "absolute",
      }}
      className={`win-frame flex flex-col ${focused ? "" : "opacity-95"}`}
      onMouseDown={() => focus(win.id)}
    >
      <div
        className={`titlebar flex h-6 items-center gap-1 px-1 select-none ${
          focused ? "text-[#1d1a14]" : "text-[#5a5346]"
        }`}
        onMouseDown={onTitleMouseDown}
        onDoubleClick={() => toggleMaximize(win.id)}
      >
        <div className="flex items-center gap-1">
          <button
            className="grid h-4 w-4 place-items-center text-[10px] bevel-btn"
            title="Close"
            onClick={(e) => {
              e.stopPropagation();
              close(win.id);
            }}
          >
            ⊗
          </button>
          <button
            className="grid h-4 w-4 place-items-center text-[10px] bevel-btn"
            title="Minimize"
            onClick={(e) => {
              e.stopPropagation();
              minimize(win.id);
            }}
          >
            ▢
          </button>
          <button
            className="grid h-4 w-4 place-items-center text-[10px] bevel-btn"
            title="Maximize"
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize(win.id);
            }}
          >
            ⤢
          </button>
        </div>
        <div className="ml-2 flex-1 truncate text-center text-[11px] font-semibold">
          {win.title}
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">{renderBody(win)}</div>

      {!win.maximized && (
        <div
          onMouseDown={onResizeMouseDown}
          className="absolute bottom-0 right-0 grid h-3 w-3 cursor-nwse-resize place-items-center text-[8px] text-[#5a5346]"
        >
          ◢
        </div>
      )}
    </motion.div>
  );
}
