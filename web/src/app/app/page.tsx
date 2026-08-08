"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { GlassModal } from "@/components/ui/glass-modal";

const TASKS = [
  {
    code: "YLK-MONE-2026-00041",
    title: "Comparativo · 3 proveedores listos",
    meta: "Comercial · elegir P1/P2 y generar cot. final",
    tone: "accent" as const,
    href: "/app/comercial/exp-1",
  },
  {
    code: "YLK-MONE-2026-00042",
    title: "Laura · revisión de requisitos",
    meta: "1 documento por vencer · pendiente luz verde",
    tone: "warn" as const,
    href: "/app/licitaciones",
  },
  {
    code: "YLK-NARAMO-2026-00007",
    title: "Itza · propuesta Admin/Finanzas",
    meta: "Proyecto privado en etapa propuesta",
    tone: "muted" as const,
    href: "/app/comercial/exp-3",
  },
];

export default function HomePage() {
  const [open, setOpen] = useState(false);

  return (
    <AppShell
      title="Inicio"
      subtitle="Una cola de trabajo clara — no un dashboard de métricas decorativas."
      actions={
        <>
          <Button variant="glass" onClick={() => setOpen(true)}>
            <Sparkles className="h-4 w-4" />
            Demo modal glass
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva solicitud
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Glass className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="display text-lg font-semibold">En tu radar</h2>
            <span className="text-xs text-[var(--text-muted)]">
              Hoy · empresa MONE
            </span>
          </div>
          <ul className="space-y-3">
            {TASKS.map((task) => (
              <li key={task.code}>
                <Link
                  href={task.href}
                  className="glass-thin group flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left transition hover:ring-1 hover:ring-[var(--glass-border)]"
                >
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      background:
                        task.tone === "accent"
                          ? "var(--accent)"
                          : task.tone === "warn"
                            ? "var(--accent-2)"
                            : "var(--text-muted)",
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] tracking-wide text-[var(--text-muted)]">
                      {task.code}
                    </span>
                    <span className="mt-0.5 block text-sm font-medium">
                      {task.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                      {task.meta}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Glass>

        <Glass strength="strong" className="overflow-hidden p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Material
          </p>
          <h2 className="display mt-2 text-2xl font-semibold tracking-tight">
            Vidrio, no cajas grises
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Los paneles usan blur + saturación al estilo iOS. Los diálogos
            emergen sobre un scrim translúcido — todo dentro de la misma
            plataforma, sin “ventanas de sistema” planas.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {["Obsidian", "Frost", "Aurora"].map((name) => (
              <div
                key={name}
                className="glass-thin rounded-2xl px-2 py-3 text-center text-[11px]"
              >
                {name}
              </div>
            ))}
          </div>
          <Button
            variant="accent"
            className="mt-6 w-full"
            onClick={() => setOpen(true)}
          >
            Probar sheet translúcido
          </Button>
        </Glass>
      </div>

      <GlassModal
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva solicitud"
        description="Wizard corto · empresa, sector y tipo. El fondo se mantiene vivo detrás del vidrio."
      >
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--text-muted)]">
              Empresa destino
            </span>
            <select className="glass-thin h-11 w-full rounded-2xl px-3 text-sm outline-none">
              <option>Distribuidora MONE</option>
              <option>Dakam Developers</option>
              <option>Naramo</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs text-[var(--text-muted)]">
              Sector
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="glass-thin rounded-2xl px-3 py-3 text-sm ring-1 ring-[color-mix(in_srgb,var(--accent)_45%,transparent)]"
              >
                Gobierno
              </button>
              <button
                type="button"
                className="glass-thin rounded-2xl px-3 py-3 text-sm text-[var(--text-muted)]"
              >
                Privado
              </button>
            </div>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setOpen(false)}>Continuar</Button>
          </div>
        </div>
      </GlassModal>
    </AppShell>
  );
}
