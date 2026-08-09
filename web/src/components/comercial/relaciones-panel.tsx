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

  if (partidas.length === 0) {
    return (
      <Glass className="overflow-hidden">
        <div className="px-5 py-6 text-sm text-[var(--text-muted)]">
          Sin partidas todavía. Cárgalas en Importar o Edición.
        </div>
      </Glass>
    );
  }

  return (
    <Glass className="overflow-hidden">
      <div className="border-b border-[var(--glass-border)] px-5 py-4">
        <h3 className="display text-lg font-semibold">Relaciones</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Una partida a la vez. Se llenan solos al elegir en Comparativo.
        </p>
      </div>

      {/* Pestañas por partida */}
      <div
        role="tablist"
        className="flex gap-0.5 overflow-x-auto border-b border-[var(--glass-border)] px-2 py-1.5"
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
              onClick={() => setActiveId(p.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition",
                isOn
                  ? "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]",
              )}
            >
              <span className="text-[var(--accent)]">#{p.numero}</span>
              <span className="max-w-[140px] truncate">{p.descripcion}</span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  assigned ? "bg-[var(--accent)]" : "bg-[var(--text-muted)]",
                )}
                title={assigned ? "Asignada" : "Sin asignar"}
              />
            </button>
          );
        })}
      </div>

      {active && (
        <div className="px-5 py-5">
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--accent)]">
              Partida #{active.numero}
            </p>
            <p className="mt-1 text-sm font-medium">{active.descripcion}</p>
            {rel?.origen === "COMPARATIVO" && (
              <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                auto · comparativo
              </p>
            )}
            {rel?.proveedorNombre && (
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Actual:{" "}
                <span className="text-[var(--text)]">{rel.proveedorNombre}</span>
                {rel.proveedorTipo
                  ? ` · ${TIPO_PROVEEDOR_LABEL[rel.proveedorTipo as TipoProveedor] ?? rel.proveedorTipo}`
                  : ""}
                {rel.marcaNombre || rel.marcaTexto
                  ? ` · marca ${rel.marcaNombre ?? rel.marcaTexto}`
                  : active.marcaSolicitada
                    ? ` · solicita ${active.marcaSolicitada}`
                    : ""}
              </p>
            )}
          </div>

          <form
            action={upsertPartidaRelacionAction}
            className="grid gap-3 md:grid-cols-2"
          >
            <input type="hidden" name="expedienteId" value={expedienteId} />
            <input type="hidden" name="partidaId" value={active.id} />
            <label className="text-xs md:col-span-2">
              Proveedor
              <select
                key={`prov-${active.id}-${rel?.proveedorId ?? ""}`}
                name="proveedorId"
                defaultValue={rel?.proveedorId ?? ""}
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm"
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
            <label className="text-xs">
              Marca catálogo
              <select
                key={`marca-${active.id}-${rel?.marcaId ?? ""}`}
                name="marcaId"
                defaultValue={rel?.marcaId ?? ""}
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              Marca texto
              <input
                key={`texto-${active.id}`}
                name="marcaTexto"
                defaultValue={rel?.marcaTexto ?? active.marcaSolicitada ?? ""}
                placeholder="ej. Honeywell"
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2 md:col-span-2">
              <Button type="submit" size="sm">
                Guardar relación
              </Button>
              <div className="flex gap-1">
                {partidas.map((p, idx) => {
                  if (p.id !== active.id) return null;
                  const prev = partidas[idx - 1];
                  const next = partidas[idx + 1];
                  return (
                    <span key="nav" className="flex gap-1">
                      {prev && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveId(prev.id)}
                        >
                          ← #{prev.numero}
                        </Button>
                      )}
                      {next && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveId(next.id)}
                        >
                          #{next.numero} →
                        </Button>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          </form>
        </div>
      )}
    </Glass>
  );
}
