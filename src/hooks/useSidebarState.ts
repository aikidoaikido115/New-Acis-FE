import { useState, useEffect, useCallback } from "react";

const SIDEBAR_COLLAPSED_KEY = "sidebar_collapsed";

// Get initial value from localStorage (SSR-safe)
function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

export function useSidebarState() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getInitialCollapsed);
  const [isReady, setIsReady] = useState(false);

  // Mark as ready after hydration
  useEffect(() => {
    setIsSidebarCollapsed(getInitialCollapsed());
    setIsReady(true);
  }, []);

  // Persist collapsed state to localStorage
  const handleCollapsedChange = useCallback((collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
  }, []);

  return {
    isSidebarOpen,
    setIsSidebarOpen,
    isSidebarCollapsed,
    setIsSidebarCollapsed: handleCollapsedChange,
    isReady,
  };
}
