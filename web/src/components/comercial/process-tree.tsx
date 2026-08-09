"use client";

import { motion } from "framer-motion";
import { PIPELINE_STAGES, type EstatusExpediente } from "@/lib/domain/workflow";
import { cn } from "@/lib/utils";

const STAGE_INDEX: Partial<Record<EstatusExpediente, number>> = {
  BORRADOR: 0,
  REVISION_REQUISITOS: 0,
  APTO: 0,
  ORDEN_COTIZAR: 1,
  EN_COTIZACION: 2,
  COMPARATIVO: 3,
  COTIZACION_FINAL: 4,
  PROPUESTA_ADMIN: 5,
  REVISION_DIRECTOR: 6,
  ENVIADA: 7,
  GANADA: 8,
  PERDIDA: 7,
  RECOTIZACION: 8,
  COMPRA: 8,
  ENTREGA: 9,
  COBRANZA: 9,
  CERRADO: 9,
  CANCELADO: -1,
};

/** Compacto: aprovecha hueco bajo el header sin repetir el folio */
export function ProcessTree({
  estatus,
  responsableNombre,
}: {
  estatus: string;
  responsableNombre?: string | null;
  /** @deprecated folio ya va en AppShell compacto */
  codigo?: string;
}) {
  const current = STAGE_INDEX[estatus as EstatusExpediente] ?? 0;
  const cancelled = estatus === "CANCELADO" || estatus === "PERDIDA";
  const activeStage = PIPELINE_STAGES[current];

  return (
    <section className="glass mb-3 overflow-hidden rounded-2xl px-3 py-2.5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-[var(--text-muted)]">
          Proceso
          {activeStage ? (
            <>
              {" · "}
              <span className="font-medium text-[var(--text)]">
                {activeStage.label}
              </span>
            </>
          ) : null}
        </p>
        <p className="text-[11px] text-[var(--text-muted)]">
          Con ·{" "}
          <span className="font-medium text-[var(--text)]">
            {responsableNombre ?? activeStage?.owner ?? "—"}
          </span>
        </p>
      </div>

      <div className="relative overflow-x-auto pb-0.5">
        <div className="flex min-w-max items-center gap-1">
          {PIPELINE_STAGES.map((stage, idx) => {
            const done = !cancelled && idx < current;
            const active = !cancelled && idx === current;
            const future = idx > current || cancelled;
            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="relative flex items-center"
                title={`${stage.label} · ${stage.owner}`}
              >
                {idx > 0 ? (
                  <span
                    className={cn(
                      "mr-1 h-px w-2.5",
                      done || active
                        ? "bg-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
                        : "bg-[color-mix(in_srgb,var(--text)_14%,transparent)]",
                    )}
                    aria-hidden
                  />
                ) : null}
                <div
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium transition",
                    active &&
                      "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] ring-1 ring-[var(--accent)]",
                    done &&
                      "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--text)]",
                    future && "opacity-45",
                  )}
                >
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: stage.color }}
                  />
                  <span className="max-w-[72px] truncate">{stage.label}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {cancelled ? (
        <p className="mt-2 text-[11px] text-[var(--danger)]">
          Proceso en {estatus === "PERDIDA" ? "PERDIDA" : "CANCELADO"}
        </p>
      ) : null}
    </section>
  );
}
