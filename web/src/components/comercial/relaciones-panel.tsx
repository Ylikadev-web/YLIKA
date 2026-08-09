"use client";

import { useMemo, useState } from "react";
import { Glass } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { upsertPartidaRelacionAction } from "@/app/app/actions-modules";
import {
  TIPO_PROVEEDOR_LABEL,
  type TipoProveedor,
} from "@/lib/domain/proveedores";
import { cn } from "@/lib/utils";

type Partida = {
  id: string;
  numero: number;
  descripcion: string;
  marcaSolicitada: string | null;
};

type Relacion = {
  id: string;
  partidaId: string;
  proveedorId: string | null;
  marcaId: string | null;
  marcaTexto: string | null;
  origen: string;
  notas: string | null;
  proveedorNombre: string | null;
  proveedorTipo: string | null;
  marcaNombre: string | null;
};

type Proveedor = {
  id: string;
  razonSocial: string;
  tipo: string;
  preferido: boolean;
};

type Marca = {
  id: string;
  nombre: string;
};

/**
 * Objetivo del submódulo: asignar proveedor/marca rápido por partida.
 * Layout denso (barra de partidas + fila de selects) — sin bloques vacíos.
 */
export function RelacionesPanel({
  expedienteId,
  partidas,
  relaciones,
  proveedores,
  marcas,
}: {
  expedienteId: string;
  partidas: Partida[];
  relaciones: Relacion[];
  proveedores: Proveedor[];
  marcas: Marca[];
}) {
  const byPartida = useMemo(
    () => new Map(relaciones.map((r) => [r.partidaId, r])),
    [relaciones],
  );
  const [activeId, setActiveId] = useState(partidas[0]?.id ?? "");

  const active = partidas.find((p) => p.id === activeId) ?? partidas[0];
  const rel = active ? byPartida.get(active.id) : undefined;
  const idx = partidas.findIndex((p) => p.id === active?.id);
  const assignedCount = partidas.filter((p) => byPartida.get(p.id)?.proveedorId)
    .length;

  if (partidas.length === 0) {
    return (
      <Glass className="px-4 py-5 text-sm text-[var(--text-muted)]">
        Sin partidas. Cárgalas en Importar o Edición.
      </Glass>
    );
  }

  return (
    <Glass className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] px-3 py-2.5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Relaciones</h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Asigna proveedor y marca · {assignedCount}/{partidas.length} listas
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={idx <= 0}
            onClick={() => setActiveId(partidas[idx - 1]?.id ?? "")}
          >
            ←
          </Button>
          <span className="tabular-nums text-[var(--text-muted)]">
            {idx + 1}/{partidas.length}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={idx < 0 || idx >= partidas.length - 1}
            onClick={() => setActiveId(partidas[idx + 1]?.id ?? "")}
          >
            →
          </Button>
        </div>
      </div>

      {/* Chips densos de partida */}
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-[var(--glass-border)] px-2 py-1.5"
      >
        {partidas.map((p) => {
          const r = byPartida.get(p.id);
          const assigned = !!r?.proveedorId;
          const isOn = p.id === (active?.id ?? "");
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={isOn}
              title={p.descripcion}
              onClick={() => setActiveId(p.id)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition",
                isOn
                  ? "bg-[color-mix(in_srgb,var(--accent)_24%,transparent)] text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]",
              )}
            >
              <span className="text-[var(--accent)]">#{p.numero}</span>
              <span className="max-w-[88px] truncate">{p.descripcion}</span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  assigned ? "bg-[var(--accent)]" : "bg-[var(--text-muted)]",
                )}
              />
            </button>
          );
        })}
      </div>

      {active && (
        <form
          action={upsertPartidaRelacionAction}
          className="space-y-2 px-3 py-3"
        >
          <input type="hidden" name="expedienteId" value={expedienteId} />
          <input type="hidden" name="partidaId" value={active.id} />

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xs font-semibold text-[var(--accent)]">
              #{active.numero}
            </span>
            <span className="text-sm font-medium">{active.descripcion}</span>
            {rel?.origen === "COMPARATIVO" && (
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                auto
              </span>
            )}
          </div>

          {/* Una sola fila de controles en desktop */}
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <label className="text-[11px] text-[var(--text-muted)]">
              Proveedor
              <select
                key={`prov-${active.id}-${rel?.proveedorId ?? ""}`}
                name="proveedorId"
                defaultValue={rel?.proveedorId ?? ""}
                className="mt-0.5 w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-2.5 py-1.5 text-sm"
              >
                <option value="">— Sin asignar —</option>
                {proveedores.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.preferido ? "★ " : ""}
                    {pr.razonSocial} (
                    {TIPO_PROVEEDOR_LABEL[pr.tipo as TipoProveedor] ?? pr.tipo})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-[var(--text-muted)]">
              Marca catálogo
              <select
                key={`marca-${active.id}-${rel?.marcaId ?? ""}`}
                name="marcaId"
                defaultValue={rel?.marcaId ?? ""}
                className="mt-0.5 w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-2.5 py-1.5 text-sm"
              >
                <option value="">—</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-[var(--text-muted)]">
              Marca texto
              <input
                key={`texto-${active.id}`}
                name="marcaTexto"
                defaultValue={rel?.marcaTexto ?? active.marcaSolicitada ?? ""}
                placeholder="Honeywell…"
                className="mt-0.5 w-full rounded-xl border border-[var(--glass-border)] bg-transparent px-2.5 py-1.5 text-sm"
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" size="sm" className="w-full sm:w-auto">
                Guardar
              </Button>
            </div>
          </div>
        </form>
      )}
    </Glass>
  );
}
