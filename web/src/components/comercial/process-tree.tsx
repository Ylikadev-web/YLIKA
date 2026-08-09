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

export function ProcessTree({
  estatus,
  responsableNombre,
  codigo,
}: {
  estatus: string;
  responsableNombre?: string | null;
  codigo: string;
}) {
  const current = STAGE_INDEX[estatus as EstatusExpediente] ?? 0;
  const cancelled = estatus === "CANCELADO" || estatus === "PERDIDA";

  return (
    <section className="float-card glass mb-4 overflow-hidden p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Árbol de proceso</p>
          <p className="text-xs text-[var(--text-muted)]">
            {codigo} · fase actual con responsable
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--text-muted)]">Con quién está</p>
          <p className="text-sm font-medium">
            {responsableNombre ?? PIPELINE_STAGES[current]?.owner ?? "—"}
          </p>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-2">
        <div className="flex min-w-max items-stretch gap-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const done = !cancelled && idx < current;
            const active = !cancelled && idx === current;
            const future = idx > current || cancelled;
            return (
              <motion.div
                key={stage.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="relative flex w-[108px] flex-col"
              >
                {idx < PIPELINE_STAGES.length - 1 ? (
                  <span
                    className={cn(
                      "absolute left-[54px] top-4 h-0.5 w-[calc(100%+0.5rem)]",
                      done || active
                        ? "bg-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
                        : "bg-[color-mix(in_srgb,var(--text)_12%,transparent)]",
                    )}
                    aria-hidden
                  />
                ) : null}
                <div
                  className={cn(
                    "relative z-[1] flex flex-col rounded-2xl px-2.5 py-3 transition",
                    active &&
                      "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] ring-2 ring-[var(--accent)] shadow-[0_0_28px_color-mix(in_srgb,var(--accent)_35%,transparent)]",
                    done &&
                      "bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]",
                    future && "glass-thin opacity-60",
                  )}
                >
                  <motion.span
                    className="mb-2 h-2 w-2 rounded-full"
                    style={{ background: stage.color }}
                    animate={
                      active
                        ? { scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }
                        : { scale: 1, opacity: 1 }
                    }
                    transition={
                      active
                        ? { repeat: Infinity, duration: 1.6 }
                        : undefined
                    }
                  />
                  <p className="text-[11px] font-semibold leading-tight">
                    {stage.label}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {stage.owner}
                  </p>
                  {active ? (
                    <p className="mt-2 text-[10px] font-medium text-[var(--accent)]">
                      Ahora
                    </p>
                  ) : done ? (
                    <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                      Hecho
                    </p>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {cancelled ? (
        <p className="mt-3 text-xs text-[var(--danger)]">
          Proceso en {estatus === "PERDIDA" ? "PERDIDA" : "CANCELADO"}
        </p>
      ) : null}
    </section>
  );
}
