interface SystemTrayProps {
  onOpenSettings: () => void;
}

export default function SystemTray({ onOpenSettings }: SystemTrayProps) {
  const now = new Date();
  return (
    <div className="titlebar flex h-7 items-center gap-2 border-t border-[#5a5346] px-2 text-[11px] select-none">
      <span className="px-1 text-[#5a5346]">⌚</span>
      <span className="px-1">Asteria</span>
      <div className="ml-auto flex items-center gap-3">
        <button onClick={onOpenSettings} className="px-1 hover:underline">
          ⚙
        </button>
        <span className="px-1">{now.toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
