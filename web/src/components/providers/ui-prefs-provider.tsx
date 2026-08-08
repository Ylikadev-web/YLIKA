"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_UI_PREFS,
  UI_PREFS_STORAGE_KEY,
  parseUiPrefs,
  type UiPrefs,
} from "@/lib/ui-prefs";

type Ctx = {
  prefs: UiPrefs;
  mounted: boolean;
  setPrefs: (patch: Partial<UiPrefs>) => void;
  resetPrefs: () => void;
};

const UiPrefsContext = createContext<Ctx | null>(null);

function applyDomPrefs(prefs: UiPrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.navStyle = prefs.navStyle;
  root.dataset.navPosition = prefs.navPosition;
  root.dataset.glassBlur = prefs.glassBlur;
  root.dataset.pendingGlow = prefs.pendingGlow ? "on" : "off";
  root.dataset.floatOrbs = prefs.floatOrbs ? "on" : "off";
  root.dataset.reduceTransparency = prefs.reduceTransparency ? "on" : "off";
}

export function UiPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<UiPrefs>(DEFAULT_UI_PREFS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(UI_PREFS_STORAGE_KEY);
      const next = raw ? parseUiPrefs(JSON.parse(raw)) : DEFAULT_UI_PREFS;
      setPrefsState(next);
      applyDomPrefs(next);
    } catch {
      applyDomPrefs(DEFAULT_UI_PREFS);
    }
    setMounted(true);
  }, []);

  const setPrefs = useCallback((patch: Partial<UiPrefs>) => {
    setPrefsState((prev) => {
      const next = parseUiPrefs({ ...prev, ...patch });
      try {
        localStorage.setItem(UI_PREFS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      applyDomPrefs(next);
      return next;
    });
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefsState(DEFAULT_UI_PREFS);
    try {
      localStorage.setItem(
        UI_PREFS_STORAGE_KEY,
        JSON.stringify(DEFAULT_UI_PREFS),
      );
    } catch {
      /* ignore */
    }
    applyDomPrefs(DEFAULT_UI_PREFS);
  }, []);

  const value = useMemo(
    () => ({ prefs, mounted, setPrefs, resetPrefs }),
    [prefs, mounted, setPrefs, resetPrefs],
  );

  return (
    <UiPrefsContext.Provider value={value}>{children}</UiPrefsContext.Provider>
  );
}

export function useUiPrefs() {
  const ctx = useContext(UiPrefsContext);
  if (!ctx) {
    throw new Error("useUiPrefs must be used within UiPrefsProvider");
  }
  return ctx;
}
