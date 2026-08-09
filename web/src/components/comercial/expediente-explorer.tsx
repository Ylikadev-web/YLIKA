"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type ExpedienteTabId =
  | "resumen"
  | "checklist"
  | "edicion"
  | "importar"
  | "relaciones"
  | "comparativo"
  | "historial";

export type ExpedienteTab = {
  id: ExpedienteTabId;
  label: string;
  short?: string;
  badge?: number | string | null;
  hidden?: boolean;
};

const TAB_IDS: ExpedienteTabId[] = [
  "resumen",
  "checklist",
  "edicion",
  "importar",
  "relaciones",
  "comparativo",
  "historial",
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const visible = useMemo(
    () => tabs.filter((t) => !t.hidden),
    [tabs],
  );

  const fromUrl = searchParams.get("tab") as ExpedienteTabId | null;
  const initial =
    fromUrl && TAB_IDS.includes(fromUrl) && visible.some((t) => t.id === fromUrl)
      ? fromUrl
      : visible.some((t) => t.id === defaultTab)
        ? defaultTab
        : (visible[0]?.id ?? "resumen");

  const [active, setActive] = useState<ExpedienteTabId>(initial);

  useEffect(() => {
    if (
      fromUrl &&
      TAB_IDS.includes(fromUrl) &&
      visible.some((t) => t.id === fromUrl)
    ) {
      setActive(fromUrl);
    }
  }, [fromUrl, visible]);

  const select = useCallback(
    (id: ExpedienteTabId) => {
      setActive(id);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", id);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <div className="expediente-explorer">
      {/* Barra tipo pestañas de navegador */}
      <div className="glass sticky top-2 z-20 mb-3 overflow-hidden rounded-[22px]">
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
      </div>

      {/* Rail tipo explorador (desktop) + contenido */}
      <div className="grid gap-3 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="glass hidden h-fit rounded-[22px] p-2 lg:block">
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
                  {tab.badge != null && tab.badge !== 0 && tab.badge !== "" ? (
                    <span className="text-[10px] text-[var(--accent-2)]">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <div
          role="tabpanel"
          className="min-w-0 [&_.float-card]:mb-0 [&_.mb-4]:mb-0"
        >
          {panels[active] ?? (
            <div className="glass rounded-[28px] p-8 text-center text-sm text-[var(--text-muted)]">
              Apartado vacío
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Default tab sugerido según fase del expediente */
export function defaultTabForEstatus(estatus: string): ExpedienteTabId {
  switch (estatus) {
    case "REVISION_REQUISITOS":
    case "APTO":
    case "ORDEN_COTIZAR":
      return "resumen";
    case "EN_COTIZACION":
      return "importar";
    case "COMPARATIVO":
    case "COTIZACION_FINAL":
      return "comparativo";
    case "GANADA":
    case "RECOTIZACION":
    case "COMPRA":
      return "checklist";
    case "ENTREGA":
      return "historial";
    case "PROPUESTA_ADMIN":
    case "REVISION_DIRECTOR":
    case "ENVIADA":
      return "resumen";
    case "COBRANZA":
      return "checklist";
    default:
      return "resumen";
  }
}
