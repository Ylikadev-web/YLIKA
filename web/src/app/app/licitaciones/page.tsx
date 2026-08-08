"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { GlassModal } from "@/components/ui/glass-modal";
import { cn } from "@/lib/utils";

type DocEmpresa = {
  id: string;
  nombre: string;
  empresa: string;
  vence: string;
  estado: "VIGENTE" | "POR_VENCER" | "VENCIDO";
};

const DOCS: DocEmpresa[] = [
  {
    id: "1",
    nombre: "Opinión de cumplimiento SAT",
    empresa: "MONE",
    vence: "2026-09-12",
    estado: "VIGENTE",
  },
  {
    id: "2",
    nombre: "Registro CompraNet / RUPC",
    empresa: "MONE",
    vence: "2026-08-20",
    estado: "POR_VENCER",
  },
  {
    id: "3",
    nombre: "Acta constitutiva (copia certificada)",
    empresa: "MONE",
    vence: "—",
    estado: "VIGENTE",
  },
  {
    id: "4",
    nombre: "Constancia de situación fiscal",
    empresa: "DAKAM",
    vence: "2026-07-01",
    estado: "VENCIDO",
  },
];

const REQUISITOS = [
  { text: "Opinión de cumplimiento vigente", ok: true },
  { text: "Experiencia en suministros similares (3 contratos)", ok: true },
  { text: "Manifestación de nacionalidad / contenido nacional", ok: null },
  { text: "Capital contable mínimo", ok: false },
];

export default function LicitacionesPage() {
  const [open, setOpen] = useState(false);

  return (
    <AppShell
      title="Licitaciones"
      subtitle="Espacio de Laura: aptitud por documentos de empresa + checklist de bases. Roles reasignables en Configuración."
      actions={
        <Button onClick={() => setOpen(true)}>
          Analizar bases (demo)
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Glass className="p-5">
          <h2 className="display text-lg font-semibold">
            Documentos por empresa
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Caducidad = semáforo de aptitud. Si un doc obligatorio está vencido,
            el expediente no puede pasar a “luz verde” sin override de Laura.
          </p>
          <ul className="mt-4 space-y-2">
            {DOCS.map((d) => (
              <li
                key={d.id}
                className="glass-thin flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{d.nombre}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {d.empresa} · vence {d.vence}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                    d.estado === "VIGENTE" &&
                      "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)]",
                    d.estado === "POR_VENCER" &&
                      "bg-[color-mix(in_srgb,var(--accent-2)_25%,transparent)] text-[var(--accent-2)]",
                    d.estado === "VENCIDO" &&
                      "bg-[color-mix(in_srgb,var(--danger)_20%,transparent)] text-[var(--danger)]",
                  )}
                >
                  {d.estado.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
          <Button variant="glass" className="mt-4">
            Subir / actualizar documento
          </Button>
        </Glass>

        <Glass className="p-5">
          <h2 className="display text-lg font-semibold">
            Checklist expediente activo
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            YLK-MONE-2026-00042 · Invitación a 3
          </p>
          <ul className="mt-4 space-y-2">
            {REQUISITOS.map((r) => (
              <li
                key={r.text}
                className="glass-thin flex items-center gap-3 rounded-2xl px-4 py-3 text-sm"
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    r.ok === true && "bg-[var(--accent)]",
                    r.ok === false && "bg-[var(--danger)]",
                    r.ok === null && "bg-[var(--accent-2)]",
                  )}
                />
                {r.text}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="accent">Luz verde · ordenar cotizar</Button>
            <Button variant="danger">No participamos</Button>
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            El análisis automático de PDF de bases se conecta cuando subas un
            ejemplo real (ver docs/PROGRESS.md).
          </p>
        </Glass>
      </div>

      <GlassModal
        open={open}
        onClose={() => setOpen(false)}
        title="Análisis de bases"
        description="Motor: extractores estructurados + checklist. No usamos RAG que quema tokens."
      >
        <p className="text-sm text-[var(--text-muted)]">
          Cuando tengamos un PDF real de convocatoria, el pipeline será:
          Document Intelligence → requisitos candidatos → cruce con
          documentos_empresa → Laura confirma.
        </p>
        <Button className="mt-4" onClick={() => setOpen(false)}>
          Entendido
        </Button>
      </GlassModal>
    </AppShell>
  );
}
