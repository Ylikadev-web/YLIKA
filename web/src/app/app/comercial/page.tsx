"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Glass } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { DEMO_EXPEDIENTES } from "@/lib/domain/demo-data";
import {
  ESTATUS_LABEL,
  PIPELINE_STAGES,
  type EstatusExpediente,
} from "@/lib/domain/workflow";
import { cn } from "@/lib/utils";

function stageIndex(estatus: EstatusExpediente) {
  const i = PIPELINE_STAGES.findIndex((s) => s.key === estatus);
  if (estatus === "APTO") return 0;
  if (estatus === "COTIZACION_FINAL") return 4;
  if (estatus === "GANADA") return 8;
  if (estatus === "COBRANZA" || estatus === "COMPRA") return 9;
  return i < 0 ? 0 : i;
}

export default function ComercialPage() {
  return (
    <AppShell
      title="Comercial"
      subtitle="Pipeline vivo del expediente — Laura, Ventas, Itza y Nesim en la misma línea de tiempo."
      actions={
        <Link href="/app/comercial/nuevo">
          <Button>+ Nueva solicitud</Button>
        </Link>
      }
    >
      <Glass className="mb-4 overflow-x-auto p-4">
        <div className="flex min-w-max gap-2">
          {PIPELINE_STAGES.map((s, idx) => (
            <div
              key={s.key}
              className="glass-thin w-[128px] rounded-2xl px-3 py-3"
            >
              <div
                className="mb-2 h-1 rounded-full"
                style={{ background: s.color }}
              />
              <p className="text-xs font-semibold leading-tight">{s.label}</p>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                {s.owner}
              </p>
              <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                {
                  DEMO_EXPEDIENTES.filter((e) => stageIndex(e.estatus) === idx)
                    .length
                }{" "}
                activos
              </p>
            </div>
          ))}
        </div>
      </Glass>

      <div className="space-y-3">
        {DEMO_EXPEDIENTES.map((exp) => {
          const idx = stageIndex(exp.estatus);
          const pct = Math.round(
            ((idx + 1) / PIPELINE_STAGES.length) * 100,
          );
          return (
            <Link key={exp.id} href={`/app/comercial/${exp.id}`}>
              <Glass className="mb-3 block p-5 transition hover:ring-1 hover:ring-[var(--glass-border)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] tracking-wide text-[var(--text-muted)]">
                      {exp.codigo} · {exp.empresa} · {exp.tipo}
                    </p>
                    <h2 className="display mt-1 text-lg font-semibold">
                      {exp.titulo}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {exp.cliente} · Responsable: {exp.owner}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="glass-thin inline-flex rounded-full px-3 py-1 text-xs">
                      {ESTATUS_LABEL[exp.estatus]}
                    </span>
                    {exp.docsVencidos > 0 ? (
                      <p className="mt-2 text-xs text-[var(--danger)]">
                        {exp.docsVencidos} doc. por vencer / vencido
                      </p>
                    ) : exp.apto === true ? (
                      <p className="mt-2 text-xs text-[var(--accent)]">
                        Aptitud OK
                      </p>
                    ) : exp.apto === null ? (
                      <p className="mt-2 text-xs text-[var(--accent-2)]">
                        Pendiente revisión Laura
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text)_8%,transparent)]">
                  <div
                    className={cn("h-full rounded-full transition-all")}
                    style={{
                      width: `${pct}%`,
                      background:
                        "linear-gradient(90deg, var(--accent), var(--accent-2))",
                    }}
                  />
                </div>
              </Glass>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
