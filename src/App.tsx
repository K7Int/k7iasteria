import { useEffect } from "react";
import Desktop from "./desktop/Desktop";
import { useMemoryStore } from "./stores/memoryStore";

export default function App() {
  const refreshDesktop = useMemoryStore((s) => s.refreshDesktop);
  const refreshStats = useMemoryStore((s) => s.refreshStats);
  const refreshTimeline = useMemoryStore((s) => s.refreshTimeline);

  useEffect(() => {
    void refreshDesktop();
    void refreshStats();
    void refreshTimeline();
  }, [refreshDesktop, refreshStats, refreshTimeline]);

  return <Desktop />;
}
