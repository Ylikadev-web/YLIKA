"use client";

import Link from "next/link";
import { ESTATUS_LABEL, type EstatusExpediente } from "@/lib/domain/workflow";
import { cn } from "@/lib/utils";

export type RadarItem = {
  id: string;
  codigo: string;
  estatus: string;
  titulo: string;
  empresaCodigo: string;
  clienteNombre: string | null;
  entrega: {
    folio: string | null;
    que: string;
    donde: string;
    conQuien: string;
    fechaProgramada: Date | string | null;
    estatus: string;
  } | null;
};

export function RadarCard({ item, index }: { item: RadarItem; index: number }) {
  const toPropuestas =
    item.estatus === "PROPUESTA_ADMIN" ||
    item.estatus === "REVISION_DIRECTOR" ||
    item.estatus === "ENVIADA";
  const href = toPropuestas ? "/app/propuestas" : `/app/comercial/${item.id}`;
  const showEntregaTip =
    !!item.entrega ||
    item.estatus === "ENTREGA" ||
    item.estatus === "COMPRA";

  const fecha =
    item.entrega?.fechaProgramada != null
      ? new Date(item.entrega.fechaProgramada).toLocaleDateString("es-MX", {
          day: "numeric",
          month: "short",
        })
      : null;

  return (
    <Link
      href={href}
      className="group float-card glass relative rounded-[28px] p-4 transition hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{
            background:
              item.estatus === "PROPUESTA_ADMIN"
                ? "var(--accent-2)"
                : item.estatus === "ENTREGA" || item.estatus === "COMPRA"
                  ? "var(--accent)"
                  : item.estatus === "REVISION_REQUISITOS"
                    ? "var(--accent-2)"
                    : item.estatus === "COMPARATIVO" ||
                        item.estatus === "COTIZACION_FINAL"
                      ? "var(--accent)"
                      : "var(--text-muted)",
          }}
        />
        <span className="text-[11px] text-[var(--text-muted)]">
          {item.codigo}
        </span>
        {item.entrega?.folio && (
          <span className="ml-auto text-[10px] text-[var(--accent)]">
            {fecha ?? "prog."}
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-sm font-semibold">{item.titulo}</p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {ESTATUS_LABEL[item.estatus as EstatusExpediente] ?? item.estatus}
        {item.estatus === "PROPUESTA_ADMIN" ? " · → Propuestas" : ""}
        {item.estatus === "ENTREGA" ? " · clic → expediente" : ""}
      </p>

      {showEntregaTip && item.entrega && (
        <div
          className={cn(
            "pointer-events-none absolute left-3 right-3 top-[calc(100%-6px)] z-30",
            "opacity-0 translate-y-1 transition duration-200",
            "group-hover:opacity-100 group-hover:translate-y-0",
          )}
        >
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass)_94%,transparent)] p-3 shadow-xl backdrop-blur-xl">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
              Entrega
              {item.entrega.folio ? ` · ${item.entrega.folio}` : ""}
            </p>
            <p className="mt-1 text-xs font-medium leading-snug">
              {item.entrega.que}
            </p>
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              Dónde ·{" "}
              <span className="text-[var(--text)]">{item.entrega.donde}</span>
            </p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Con ·{" "}
              <span className="text-[var(--text)]">
                {item.entrega.conQuien}
              </span>
            </p>
            {fecha && (
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                Cuándo · <span className="text-[var(--text)]">{fecha}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
