import { useState, useRef, useEffect } from "react";
import { useWindowStore } from "../stores/windowStore";
import { useMemoryStore } from "../stores/memoryStore";

interface MenuBarProps {
  onOpenPalette: () => void;
}

interface Menu {
  label: string;
  items: { label: string; action: () => void; shortcut?: string }[];
}

export default function MenuBar({ onOpenPalette }: MenuBarProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const open = useWindowStore((s) => s.open);
  const refreshDesktop = useMemoryStore((s) => s.refreshDesktop);
  const importSampleData = useMemoryStore((s) => s.importSampleData);
  const refreshStats = useMemoryStore((s) => s.refreshStats);
  const refreshTimeline = useMemoryStore((s) => s.refreshTimeline);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpenIdx(null);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const menus: Menu[] = [
    {
      label: "Apple",
      items: [
        {
          label: "About K7I Asteria",
          action: () =>
            open({
              id: "sysinfo",
              kind: "system-info",
              title: "About K7I Asteria",
              width: 420,
              height: 360,
            }),
        },
        {
          label: "Re-seed Sample Data",
          action: () => {
            void importSampleData().then(() => {
              void refreshDesktop();
              void refreshStats();
              void refreshTimeline();
            });
          },
        },
      ],
    },
    {
      label: "File",
      items: [
        {
          label: "New Memory…",
          action: () =>
            open({
              id: "new-memory",
              kind: "memory",
              title: "New Memory",
              payload: null,
              width: 520,
              height: 460,
            }),
          shortcut: "⌘N",
        },
        {
          label: "Import…",
          action: () =>
            open({
              id: "import",
              kind: "import",
              title: "File Import",
              width: 480,
              height: 420,
            }),
        },
      ],
    },
    {
      label: "View",
      items: [
        {
          label: "Timeline",
          action: () =>
            open({
              id: "timeline",
              kind: "timeline",
              title: "Timeline",
              width: 640,
              height: 480,
            }),
        },
        {
          label: "System Information",
          action: () =>
            open({
              id: "sysinfo",
              kind: "system-info",
              title: "System Information",
            }),
        },
      ],
    },
    {
      label: "Search",
      items: [
        {
          label: "Find Memory…",
          action: onOpenPalette,
          shortcut: "⌘K",
        },
      ],
    },
  ];

  return (
    <div
      ref={ref}
      className="titlebar flex items-stretch border-b border-[#5a5346] text-[12px] select-none"
    >
      {menus.map((menu, i) => (
        <div key={menu.label} className="relative">
          <button
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            onMouseEnter={() => openIdx != null && setOpenIdx(i)}
            className={`px-3 py-1 ${
              openIdx === i ? "bg-[#1d1a14] text-[#f4ecd8]" : ""
            }`}
          >
            {menu.label}
          </button>
          {openIdx === i && (
            <div className="panel absolute left-0 top-full z-50 min-w-[180px] py-1">
              {menu.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setOpenIdx(null);
                    item.action();
                  }}
                  className="flex w-full items-center justify-between gap-6 px-3 py-1 text-left hover:bg-[#1d1a14] hover:text-[#f4ecd8]"
                >
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="text-[10px] opacity-70">{item.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className="ml-auto px-3 py-1 text-[11px] text-[#5a5346]">
        K7I Asteria v1.0
      </div>
    </div>
  );
}
