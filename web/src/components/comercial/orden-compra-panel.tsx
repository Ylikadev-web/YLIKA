"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { emitirOrdenCompraAction } from "@/app/app/comercial/actions";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";

type ProveedorOpt = { id: string; razonSocial: string };
type PartidaOpt = {
  id: string;
  numero: number;
  descripcion: string;
  cantidad: string;
  unidad: string;
};

type OcLinea = {
  numero: number;
  descripcion: string;
  cantidad: string;
  unidad: string;
};

type OcRow = {
  id: string;
  folio: string;
  proveedorNombre: string;
  estatus: string;
  montoTotal: string | null;
  createdAt: Date | string | null;
  lineas?: OcLinea[];
};

export function OrdenCompraPanel({
  expedienteId,
  proveedores,
  partidas,
  ordenes,
  canEmit,
}: {
  expedienteId: string;
  proveedores: ProveedorOpt[];
  partidas: PartidaOpt[];
  ordenes: OcRow[];
  canEmit: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(partidas.map((p) => p.id)),
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  const allSelected = useMemo(
    () => partidas.length > 0 && selected.size === partidas.length,
    [partidas.length, selected.size],
  );

  if (!canEmit && ordenes.length === 0) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(partidas.map((p) => p.id)));
  }

  return (
    <Glass className="p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold">Órdenes de compra</p>
        <p className="text-xs text-[var(--text-muted)]">
          Folio + proveedor + partidas · queda en el expediente.
        </p>
      </div>

      {ordenes.length > 0 ? (
        <ul className="mb-3 space-y-1.5 text-sm">
          {ordenes.map((o) => (
            <li key={o.id} className="glass-thin rounded-xl px-3 py-2">
              <button
                type="button"
                className="flex w-full flex-wrap items-center justify-between gap-2 text-left"
                onClick={() =>
                  setExpanded((cur) => (cur === o.id ? null : o.id))
                }
              >
                <span>
                  <strong>{o.folio}</strong> · {o.proveedorNombre}
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {o.estatus}
                  {o.montoTotal ? ` · $${o.montoTotal}` : ""}
                  {o.lineas?.length ? ` · ${o.lineas.length} part.` : ""}
                </span>
              </button>
              {expanded === o.id && o.lineas && o.lineas.length > 0 ? (
                <ul className="mt-2 space-y-1 border-t border-[var(--glass-border)] pt-2 text-[11px] text-[var(--text-muted)]">
                  {o.lineas.map((l, i) => (
                    <li key={`${o.id}-${i}`}>
                      #{l.numero} {l.descripcion} · {l.cantidad} {l.unidad}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-[var(--text-muted)]">Sin OC aún.</p>
      )}

      {canEmit ? (
        <form
          className="space-y-3"
          action={(fd) => {
            setMsg(null);
            setErr(null);
            for (const id of selected) fd.append("partidaIds", id);
            start(async () => {
              const res = await emitirOrdenCompraAction(fd);
              if (!res.ok) setErr(res.error);
              else {
                setMsg(`OC ${res.folio} emitida`);
                router.refresh();
              }
            });
          }}
        >
          <input type="hidden" name="expedienteId" value={expedienteId} />
          <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
            <select
              name="proveedorId"
              required
              className="glass-thin h-10 rounded-2xl px-3 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Proveedor…
              </option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.razonSocial}
                </option>
              ))}
            </select>
            <input
              name="montoTotal"
              type="number"
              step="0.01"
              min="0"
              placeholder="Monto"
              className="glass-thin h-10 rounded-2xl px-3 text-sm"
            />
          </div>

          {partidas.length > 0 ? (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Partidas en la OC ({selected.size})</span>
                <button
                  type="button"
                  className="text-[var(--accent)]"
                  onClick={toggleAll}
                >
                  {allSelected ? "Quitar todas" : "Todas"}
                </button>
              </div>
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-2xl border border-[var(--glass-border)] p-2">
                {partidas.map((p) => (
                  <li key={p.id}>
                    <label className="flex cursor-pointer items-start gap-2 rounded-xl px-2 py-1.5 text-xs hover:bg-[color-mix(in_srgb,var(--text)_4%,transparent)]">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggle(p.id)}
                        className="mt-0.5"
                      />
                      <span>
                        <strong>#{p.numero}</strong> {p.descripcion}
                        <span className="text-[var(--text-muted)]">
                          {" "}
                          · {p.cantidad} {p.unidad}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-xs text-[var(--danger)]">
              Sin partidas en el expediente — carga lista limpia primero.
            </p>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={pending || selected.size === 0}
          >
            {pending ? "…" : "Emitir OC"}
          </Button>
          {err ? <p className="text-sm text-[var(--danger)]">{err}</p> : null}
          {msg ? <p className="text-sm text-[var(--accent)]">{msg}</p> : null}
        </form>
      ) : null}
    </Glass>
  );
}
