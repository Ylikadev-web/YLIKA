"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useUiPrefs } from "@/components/providers/ui-prefs-provider";
import {
  EXPEDIENTE_TAB_IDS,
  isExpedienteTabId,
  type ExpedienteTabId,
} from "@/lib/domain/expediente-utils";
import type { ExpedienteNav } from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";

export type { ExpedienteTabId };

export type ExpedienteTab = {
  id: ExpedienteTabId;
  label: string;
  short?: string;
  badge?: number | string | null;
  hidden?: boolean;
};

function readTabFromLocation(): ExpedienteTabId | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("tab");
  return isExpedienteTabId(v) ? v : null;
}

function writeTabToLocation(id: ExpedienteTabId) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("tab", id);
  window.history.replaceState(window.history.state, "", url.toString());
}

const VIEW_OPTS: { id: ExpedienteNav; label: string }[] = [
  { id: "tabs", label: "Pestañas" },
  { id: "rail", label: "Lateral" },
  { id: "both", label: "Ambos" },
];

export function ExpedienteExplorer({
  tabs,
  panels,
  defaultTab = "resumen",
}: {
  tabs: ExpedienteTab[];
  panels: Partial<Record<ExpedienteTabId, ReactNode>>;
  defaultTab?: ExpedienteTabId;
}) {
  const { prefs, setPrefs, mounted } = useUiPrefs();
  const navMode: ExpedienteNav = mounted ? prefs.expedienteNav : "tabs";
  const showTabs = navMode === "tabs" || navMode === "both";
  const showRail = navMode === "rail" || navMode === "both";

  const visible = useMemo(() => tabs.filter((t) => !t.hidden), [tabs]);
  const visibleIds = useMemo(
    () => visible.map((t) => t.id).join(","),
    [visible],
  );

  const resolve = useCallback(
    (candidate: ExpedienteTabId | null | undefined): ExpedienteTabId => {
      const ids = visibleIds.split(",").filter(Boolean) as ExpedienteTabId[];
      if (candidate && ids.includes(candidate)) return candidate;
      if (ids.includes(defaultTab)) return defaultTab;
      return (ids[0] as ExpedienteTabId) ?? "resumen";
    },
    [defaultTab, visibleIds],
  );

  const [active, setActive] = useState<ExpedienteTabId>(() =>
    resolve(readTabFromLocation() ?? defaultTab),
  );

  useEffect(() => {
    const onPop = () => setActive(resolve(readTabFromLocation()));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [resolve]);

  useEffect(() => {
    setActive((prev) => resolve(prev));
  }, [resolve]);

  const select = useCallback((id: ExpedienteTabId) => {
    setActive(id);
    writeTabToLocation(id);
  }, []);

  return (
    <div className="expediente-explorer">
      {/* Selector de vista + pestañas (si aplica) */}
      <div className="glass sticky top-2 z-20 mb-3 overflow-hidden rounded-[22px]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] px-2 py-1.5">
          <p className="px-1.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Vista del expediente
          </p>
          <div className="flex gap-0.5 rounded-xl bg-[color-mix(in_srgb,var(--text)_5%,transparent)] p-0.5">
            {VIEW_OPTS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPrefs({ expedienteNav: opt.id })}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[11px] font-medium transition",
                  navMode === opt.id
                    ? "bg-[var(--accent)] text-[var(--bg)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {showTabs && (
          <div
            role="tablist"
            aria-label="Apartados del expediente"
            className="flex gap-0.5 overflow-x-auto px-1.5 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visible.map((tab) => {
              const isActive = tab.id === active;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => select(tab.id)}
                  className={cn(
                    "group relative flex shrink-0 items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium transition",
                    isActive
                      ? "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] hover:text-[var(--text)]",
                  )}
                >
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-[var(--accent)]"
                    />
                  )}
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.short ?? tab.label}</span>
                  {tab.badge != null && tab.badge !== 0 && tab.badge !== "" ? (
                    <span
                      className={cn(
                        "min-w-[1.1rem] rounded-full px-1 text-center text-[10px] font-semibold",
                        isActive
                          ? "bg-[var(--accent)] text-[var(--bg)]"
                          : "bg-[color-mix(in_srgb,var(--accent-2)_35%,transparent)] text-[var(--text)]",
                      )}
                    >
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {/* En modo solo rail (móvil), lista horizontal compacta si no hay rail */}
        {!showTabs && !showRail && (
          <div className="px-3 py-2 text-xs text-[var(--text-muted)]">
            Elige una vista arriba.
          </div>
        )}
      </div>

      <div
        className={cn(
          "grid gap-3",
          showRail &&
            (showTabs
              ? "lg:grid-cols-[200px_minmax(0,1fr)]"
              : "md:grid-cols-[200px_minmax(0,1fr)]"),
        )}
      >
        {showRail && (
          <aside
            className={cn(
              "glass h-fit rounded-[22px] p-2",
              // En "Ambos", el rail solo en desktop (móvil usa pestañas)
              showTabs && "hidden lg:block",
            )}
          >
            <p className="px-2.5 py-2 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Expediente
            </p>
            <nav className="flex flex-col gap-0.5">
              {visible.map((tab) => {
                const isActive = tab.id === active;
                return (
                  <button
                    key={`rail-${tab.id}`}
                    type="button"
                    onClick={() => select(tab.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm transition",
                      isActive
                        ? "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] font-medium text-[var(--text)]"
                        : "text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] hover:text-[var(--text)]",
                    )}
                  >
                    <span>{tab.label}</span>
                    {tab.badge != null &&
                    tab.badge !== 0 &&
                    tab.badge !== "" ? (
                      <span className="text-[10px] text-[var(--accent-2)]">
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        <div className="min-w-0 [&_.float-card]:mb-0 [&_.mb-4]:mb-0">
          {EXPEDIENTE_TAB_IDS.map((id) => {
            if (!panels[id]) return null;
            if (!visible.some((t) => t.id === id)) return null;
            const isActive = id === active;
            return (
              <div
                key={id}
                id={`panel-${id}`}
                role="tabpanel"
                hidden={!isActive}
                className={cn(!isActive && "hidden")}
              >
                {panels[id]}
              </div>
            );
          })}
          {!panels[active] && (
            <div className="glass rounded-[28px] p-8 text-center text-sm text-[var(--text-muted)]">
              Apartado vacío
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
