"use client";

import { use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { NAV_ITEMS } from "@/components/nav/nav-items";

const LABELS: Record<string, string> = {
  comercial: "Comercial",
  compras: "Compras",
  entregas: "Entregas",
  clientes: "Clientes y Cobranza",
  tesoreria: "Administración y Tesorería",
  proyectos: "Proyectos",
  licitaciones: "Licitaciones",
  obra: "Obra Pública",
  documentos: "Documentos",
};

export default function ModulePlaceholderPage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const { module } = use(params);
  const label = LABELS[module] ?? module;
  const known = NAV_ITEMS.some((n) => n.href === `/app/${module}`);

  if (!known || module === "configuracion") {
    return (
      <AppShell title="No encontrado">
        <Glass className="p-8">
          <p className="text-sm text-[var(--text-muted)]">
            Módulo no reconocido.
          </p>
          <Link href="/app" className="mt-4 inline-block">
            <Button variant="glass">Volver al inicio</Button>
          </Link>
        </Glass>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={label}
      subtitle="Estructura lista en el menú. La lógica de expediente llega en las siguientes fases."
    >
      <Glass className="p-8">
        <p className="display text-2xl font-semibold tracking-tight">
          En construcción — con el mismo material glass
        </p>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--text-muted)]">
          Este módulo ya tiene lugar en la navegación para mapear el desarrollo.
          Primero cerramos identidad visual, temas y shell; después el flujo
          solicitud → expediente → partidas.
        </p>
        <div className="mt-6 flex gap-2">
          <Link href="/app">
            <Button variant="glass">Ir a Inicio</Button>
          </Link>
          <Link href="/app/configuracion">
            <Button>Cambiar tema</Button>
          </Link>
        </div>
      </Glass>
    </AppShell>
  );
}
