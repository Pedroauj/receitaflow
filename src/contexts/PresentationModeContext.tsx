import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ReactNode } from "react";

interface PresentationModeContextType {
  isPresentationMode: boolean;
  togglePresentationMode: () => void;
  setPresentationMode: (value: boolean) => void;
}

const PresentationModeContext = createContext<PresentationModeContextType | undefined>(undefined);

const STORAGE_KEY = "presentation_mode";

export const PresentationModeProvider = ({ children }: { children: ReactNode }) => {
  const [isPresentationMode, setIsPresentationMode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isPresentationMode));
    } catch {}
  }, [isPresentationMode]);

  // Cursor auto-hide
  useEffect(() => {
    if (!isPresentationMode) {
      document.documentElement.style.cursor = "";
      return;
    }

    const hideCursor = () => {
      document.documentElement.style.cursor = "none";
    };

    const showCursor = () => {
      document.documentElement.style.cursor = "";
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = setTimeout(hideCursor, 3000);
    };

    showCursor();
    window.addEventListener("mousemove", showCursor);
    window.addEventListener("mousedown", showCursor);

    return () => {
      window.removeEventListener("mousemove", showCursor);
      window.removeEventListener("mousedown", showCursor);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
      document.documentElement.style.cursor = "";
    };
  }, [isPresentationMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;

      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setIsPresentationMode((v) => !v);
      }
      if (e.key === "Escape" && isPresentationMode) {
        e.preventDefault();
        e.stopPropagation();
        setIsPresentationMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isPresentationMode]);

  const togglePresentationMode = useCallback(() => setIsPresentationMode((v) => !v), []);
  const setPresentationMode = useCallback((value: boolean) => setIsPresentationMode(value), []);

  return (
    <PresentationModeContext.Provider value={{ isPresentationMode, togglePresentationMode, setPresentationMode }}>
      {children}
    </PresentationModeContext.Provider>
  );
};

export const usePresentationMode = () => {
  const ctx = useContext(PresentationModeContext);
  if (!ctx) throw new Error("usePresentationMode must be used within PresentationModeProvider");
  return ctx;
};
