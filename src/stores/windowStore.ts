// The desktop window manager. Pure UI state - no backend calls. The
// desktop renders windows from this store and commands like "open the
// memory with this id" call into it.

import { create } from "zustand";

export type WindowKind =
  | "memory"
  | "folder"
  | "timeline"
  | "search"
  | "system-info"
  | "import"
  | "settings"
  | "ai";

export interface WindowInstance {
  id: string;
  kind: WindowKind;
  title: string;
  payload?: unknown;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  snapHint?: string | null;
}

interface NewWindowOpts {
  id?: string;
  kind: WindowKind;
  title: string;
  payload?: unknown;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

let zTop = 1;

function genId(): string {
  return `win_${Math.random().toString(36).slice(2, 9)}`;
}

interface WindowStore {
  windows: WindowInstance[];
  focusedId: string | null;

  open: (opts: NewWindowOpts) => string;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  toggleMaximize: (id: string) => void;
  restore: (id: string) => void;
  move: (id: string, x: number, y: number) => void;
  resize: (id: string, w: number, h: number, x?: number, y?: number) => void;
  isOpen: (kind: WindowKind, payloadId?: string) => WindowInstance | undefined;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  focusedId: null,

  open: (opts) => {
    const existing =
      opts.id != null
        ? get().windows.find((w) => w.id === opts.id)
        : undefined;
    if (existing) {
      get().restore(existing.id);
      get().focus(existing.id);
      return existing.id;
    }
    let counter = get().windows.length + 1;
    const id = opts.id ?? genId();
    zTop += 1;
    const w =
      opts.width ??
      (opts.kind === "memory" ? 480 : opts.kind === "folder" ? 560 : 560);
    const h =
      opts.height ??
      (opts.kind === "memory" ? 460 : opts.kind === "folder" ? 420 : 460);
    const x =
      opts.x ?? 80 + ((counter * 36) % 320);
    const y =
      opts.y ?? 72 + ((counter * 28) % 220);
    const win: WindowInstance = {
      id,
      kind: opts.kind,
      title: opts.title,
      payload: opts.payload,
      x,
      y,
      width: w,
      height: h,
      z: zTop,
      minimized: false,
      maximized: false,
      snapHint: null,
    };
    set((s) => ({ windows: [...s.windows, win], focusedId: id }));
    return id;
  },

  close: (id) =>
    set((s) => ({
      windows: s.windows.filter((w) => w.id !== id),
      focusedId: s.focusedId === id ? null : s.focusedId,
    })),

  focus: (id) => {
    zTop += 1;
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, z: zTop, minimized: false } : w,
      ),
      focusedId: id,
    }));
  },

  minimize: (id) => {
    set((s) => {
      const windows = s.windows.map((w) =>
        w.id === id ? { ...w, minimized: true } : w,
      );
      const focusedId = s.focusedId === id ? null : s.focusedId;
      return { windows, focusedId };
    });
  },

  toggleMaximize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, maximized: !w.maximized } : w,
      ),
    })),

  restore: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: false } : w,
      ),
    })),

  move: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, x, y, maximized: false } : w,
      ),
    })),

  resize: (id, width, height, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              width,
              height,
              x: x ?? w.x,
              y: y ?? w.y,
              maximized: false,
            }
          : w,
      ),
    })),

  isOpen: (kind, payloadId) =>
    get().windows.find(
      (w) => w.kind === kind &&
        (payloadId == null ||
          (typeof w.payload === "string"
            ? w.payload === payloadId
            : (w.payload as { id?: string })?.id === payloadId)),
    ),
}));
