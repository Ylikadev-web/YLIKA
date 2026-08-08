"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { PendienteItem } from "@/lib/db/pendientes";

type Ctx = {
  items: PendienteItem[];
  pendingHrefs: string[];
  countForHref: (href: string) => number;
};

const PendientesContext = createContext<Ctx>({
  items: [],
  pendingHrefs: [],
  countForHref: () => 0,
});

export function PendientesProvider({
  items,
  children,
}: {
  items: PendienteItem[];
  children: ReactNode;
}) {
  const value = useMemo(() => {
    const pendingHrefs = Array.from(new Set(items.map((i) => i.href)));
    const countForHref = (href: string) => {
      if (href === "/app") {
        return items.length;
      }
      return items.filter(
        (i) => i.href === href || i.href.startsWith(`${href}/`),
      ).length;
    };
    return { items, pendingHrefs, countForHref };
  }, [items]);

  return (
    <PendientesContext.Provider value={value}>
      {children}
    </PendientesContext.Provider>
  );
}

export function usePendientes() {
  return useContext(PendientesContext);
}
