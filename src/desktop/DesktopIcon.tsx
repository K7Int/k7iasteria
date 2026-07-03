interface DesktopIconProps {
  x: number;
  y: number;
  glyph: string;
  label: string;
  color?: string;
  onOpen: () => void;
}

export default function DesktopIcon({
  x,
  y,
  glyph,
  label,
  color,
  onOpen,
}: DesktopIconProps) {
  return (
    <button
      onDoubleClick={onOpen}
      onClick={(e) => {
        // single click focuses; double opens - classic desktop behaviour
        if (e.detail === 1) e.currentTarget.focus();
      }}
      style={{ left: x, top: y }}
      className="absolute group flex w-20 flex-col items-center gap-1 p-1 outline-none"
      title={label}
    >
      <span
        className="grid h-11 w-11 place-items-center text-2xl panel"
        style={color ? { color } : undefined}
      >
        {glyph}
      </span>
      <span
        className="max-w-full truncate rounded-sm px-1 text-[11px] text-[#1d1a14] group-focus:bg-[#1d1a14] group-focus:text-[#f4ecd8]"
      >
        {label}
      </span>
    </button>
  );
}
