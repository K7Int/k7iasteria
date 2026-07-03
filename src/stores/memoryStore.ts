// Application data store: caches children lists, search results, stats
// and feeds the desktop. Backed by the Tauri command surface via IPC.

import { create } from "zustand";
import api from "../memory/ipc";
import type {
  CreateMemoryInput,
  UpdateMemoryInput,
} from "../memory/ipc";
import type {
  InsightResult,
  Memory,
  SystemStats,
  TimelineYear,
} from "../types";

interface MemoryStore {
  desktopChildren: Memory[];
  recent: Memory[];
  timeline: TimelineYear[];
  stats: SystemStats | null;
  loaded: boolean;
  loading: boolean;
  insight: InsightResult | null;

  refreshDesktop: () => Promise<void>;
  loadChildren: (parentId: string | null) => Promise<Memory[]>;
  refreshRecent: () => Promise<void>;
  refreshTimeline: () => Promise<void>;
  refreshStats: () => Promise<void>;

  createMemory: (input: CreateMemoryInput) => Promise<Memory>;
  updateMemory: (input: UpdateMemoryInput) => Promise<Memory>;
  deleteMemory: (id: string) => Promise<void>;
  moveMemory: (id: string, parentId: string | null) => Promise<void>;

  search: (
    query: string,
    kinds?: string[],
    tags?: string[],
  ) => Promise<Memory[]>;

  importFile: (
    kind: string,
    source: string,
    parentId: string | null,
  ) => Promise<number>;
  importSampleData: () => Promise<number>;

  runInsight: () => Promise<void>;
}

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  desktopChildren: [],
  recent: [],
  timeline: [],
  stats: null,
  loaded: false,
  loading: false,
  insight: null,

  refreshDesktop: async () => {
    const [children, recent] = await Promise.all([
      api.listChildren(null),
      api.recentMemories(12),
    ]);
    set({ desktopChildren: children, recent, loaded: true });
  },

  loadChildren: async (parentId) => api.listChildren(parentId),

  refreshRecent: async () => {
    const recent = await api.recentMemories(12);
    set({ recent });
  },

  refreshTimeline: async () => {
    const timeline = await api.timelineRoot();
    set({ timeline });
  },

  refreshStats: async () => {
    const stats = await api.systemStats();
    set({ stats });
  },

  createMemory: async (input) => {
    const memory = await api.createMemory(input);
    await get().refreshDesktop();
    return memory;
  },

  updateMemory: async (input) => {
    const memory = await api.updateMemory(input);
    await get().refreshDesktop();
    return memory;
  },

  deleteMemory: async (id) => {
    await api.deleteMemory(id);
    await get().refreshDesktop();
  },

  moveMemory: async (id, parentId) => {
    await api.moveMemory(id, parentId);
    await get().refreshDesktop();
  },

  search: (query, kinds, tags) => api.searchMemories(query, kinds, tags),

  importFile: (kind, source, parentId) =>
    api.importFile(kind, source, parentId).then(async (n) => {
      await get().refreshDesktop();
      return n;
    }),

  importSampleData: () =>
    api.importSampleData().then(async (n) => {
      await get().refreshDesktop();
      return n;
    }),

  runInsight: async () => {
    const insight = await api.aiInsight();
    set({ insight });
  },
}));
