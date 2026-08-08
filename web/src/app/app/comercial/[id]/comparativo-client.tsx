"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { GlassModal } from "@/components/ui/glass-modal";
import {
  generarCotizacionFinalAction,
  transitionExpedienteAction,
} from "@/app/app/comercial/actions";
import {
  buildCotizacionFinal,
  pickBest,
  type SelectionMode,
} from "@/lib/quotes/comparativo";
import { cn } from "@/lib/utils";

type Partida = {
  id: string;
  numero: number;
  descripcion: string;
  cantidad: string;
  unidad: string;
};

type Cot = {
  id: string;
  alias: string;
  proveedorNombre: string;
};

type Linea = {
  id: string;
  cotizacionId: string;
  partidaId: string | null;
  precioUnitarioConIva: string | null;
  tiempoEntregaDias: number | null;
  pctContenidoNacional: string | null;
  seleccionado: boolean;
};

export function ComparativoClient({
  expedienteId,
  partidas,
  cotizaciones,
  lineas,
  markupInicial,
  criterioInicial,
  estatus,
}: {
  expedienteId: string;
  partidas: Partida[];
  cotizaciones: Cot[];
  lineas: Linea[];
  markupInicial: number;
  criterioInicial: SelectionMode;
  estatus: string;
}) {
  const [mode, setMode] = useState<SelectionMode>(criterioInicial || "PRECIO");
  const [markup, setMarkup] = useState(markupInicial);
  const [manual, setManual] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const l of lineas) {
      if (l.seleccionado && l.partidaId) {
        const cot = cotizaciones.find((c) => c.id === l.cotizacionId);
        if (cot) init[l.partidaId] = cot.alias;
      }
    }
    return init;
  });
  const [showFinal, setShowFinal] = useState(false);
  const [finalLines, setFinalLines] = useState<
    ReturnType<typeof buildCotizacionFinal>
  >([]);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const matrix = useMemo(() => {
    const byPartida: Record<
      string,
      Record<string, { precio: number; entrega?: number; pct?: number }>
    > = {};
    for (const p of partidas) byPartida[p.id] = {};
    for (const l of lineas) {
      if (!l.partidaId || l.precioUnitarioConIva == null) continue;
      const cot = cotizaciones.find((c) => c.id === l.cotizacionId);
      if (!cot) continue;
      byPartida[l.partidaId][cot.alias] = {
        precio: Number(l.precioUnitarioConIva),
        entrega: l.tiempoEntregaDias ?? undefined,
        pct: l.pctContenidoNacional
          ? Number(l.pctContenidoNacional)
          : undefined,
      };
    }
    return byPartida;
  }, [partidas, lineas, cotizaciones]);

  const seleccion = useMemo(() => {
    const out: Record<string, string> = {};
    for (const p of partidas) {
      if (manual[p.id]) {
        out[p.id] = manual[p.id];
        continue;
      }
      const cells = cotizaciones
        .map((c) => {
          const cell = matrix[p.id]?.[c.alias];
          if (!cell) return null;
          return {
            alias: c.alias,
            precio: cell.precio,
            entrega: cell.entrega,
            pctNacional: cell.pct,
          };
        })
        .filter(Boolean) as {
        alias: string;
        precio: number;
        entrega?: number;
        pctNacional?: number;
      }[];
      const best = pickBest(cells, mode);
      if (best) out[p.id] = best;
    }
    return out;
  }, [partidas, manual, matrix, cotizaciones, mode]);

  const preview = useMemo(() => {
    const selected: Record<number, { alias: string; precio: number }> = {};
    for (const p of partidas) {
      const alias = seleccion[p.id];
      const precio = alias ? matrix[p.id]?.[alias]?.precio : undefined;
      if (alias && precio != null) selected[p.numero] = { alias, precio };
    }
    return buildCotizacionFinal({
      partidas: partidas.map((p) => ({
        numero: p.numero,
        descripcion: p.descripcion,
        cantidad: Number(p.cantidad),
        unidad: p.unidad,
      })),
      selected,
      markupPct: markup,
    });
  }, [partidas, seleccion, matrix, markup]);

  function generate() {
    start(async () => {
      setMsg(null);
      try {
        const res = await generarCotizacionFinalAction({
          expedienteId,
          markupPct: markup,
          criterio: mode,
          seleccion,
        });
        setFinalLines(res.lineas);
        setShowFinal(true);
        setMsg(`Cotización final v${res.version} guardada en el expediente`);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "Error al generar");
      }
    });
  }

  function passToItza() {
    start(async () => {
      await transitionExpedienteAction(
        expedienteId,
        "PROPUESTA_ADMIN",
        "Cotización final pasada a Admin/Finanzas (Itza)",
      );
      setMsg("Expediente en PROPUESTA_ADMIN → Itza");
    });
  }

  if (!partidas.length) {
    return (
      <Glass className="p-5">
        <h2 className="display text-lg font-semibold">Partidas</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Este expediente aún no tiene lista limpia. Cárgala desde el seed de
          flujo o la importación Excel (siguiente iteración UI).
        </p>
      </Glass>
    );
  }

  return (
    <>
      <Glass className="mb-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display text-lg font-semibold">
              Comparativo (Neon)
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Precios con IVA. Celda ganadora iluminada. Markup interno no sale
              en el documento final — solo refs P1/P2.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["PRECIO", "ENTREGA", "MIXTO"] as SelectionMode[]).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? "accent" : "glass"}
                onClick={() => setMode(m)}
              >
                {m}
              </Button>
            ))}
            <label className="glass-thin flex items-center gap-2 rounded-2xl px-3 py-2 text-xs">
              Markup %
              <input
                type="number"
                className="w-14 bg-transparent text-sm outline-none"
                value={markup}
                onChange={(e) => setMarkup(Number(e.target.value) || 0)}
              />
            </label>
            <Button onClick={generate} disabled={pending}>
              {pending ? "Guardando…" : "Generar cotización final"}
            </Button>
            {estatus === "COTIZACION_FINAL" || estatus === "COMPARATIVO" ? (
              <Button variant="glass" onClick={passToItza} disabled={pending}>
                Pasar a Itza
              </Button>
            ) : null}
          </div>
        </div>
        {msg ? (
          <p className="mt-3 text-sm text-[var(--accent)]">{msg}</p>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-sm">
            <thead>
              <tr className="text-left text-[11px] text-[var(--text-muted)]">
                <th className="px-3 py-1">Partida</th>
                {cotizaciones.map((c) => (
                  <th key={c.id} className="px-3 py-1">
                    {c.alias}
                    <span className="mt-0.5 block font-normal opacity-70">
                      {c.proveedorNombre}
                    </span>
                  </th>
                ))}
                <th className="px-3 py-1">Elegida</th>
              </tr>
            </thead>
            <tbody>
              {partidas.map((partida) => {
                const chosen = seleccion[partida.id];
                return (
                  <tr key={partida.id}>
                    <td className="glass-thin rounded-2xl px-3 py-3 align-top">
                      <p className="text-[11px] text-[var(--text-muted)]">
                        #{partida.numero} · {partida.cantidad} {partida.unidad}
                      </p>
                      <p className="font-medium">{partida.descripcion}</p>
                    </td>
                    {cotizaciones.map((cot) => {
                      const cell = matrix[partida.id]?.[cot.alias];
                      const win = chosen === cot.alias;
                      return (
                        <td key={cot.id} className="px-1 align-top">
                          <button
                            type="button"
                            onClick={() =>
                              setManual((m) => ({
                                ...m,
                                [partida.id]: cot.alias,
                              }))
                            }
                            className={cn(
                              "w-full rounded-2xl px-3 py-3 text-left transition",
                              win
                                ? "bg-[color-mix(in_srgb,var(--accent)_28%,transparent)] ring-2 ring-[var(--accent)] shadow-[0_0_24px_color-mix(in_srgb,var(--accent)_35%,transparent)]"
                                : "glass-thin hover:ring-1 hover:ring-[var(--glass-border)]",
                            )}
                          >
                            {cell ? (
                              <>
                                <p className="font-semibold">
                                  $
                                  {cell.precio.toLocaleString("es-MX", {
                                    minimumFractionDigits: 2,
                                  })}
                                </p>
                                <p className="text-[11px] text-[var(--text-muted)]">
                                  {cell.entrega ?? "—"}d
                                  {cell.pct != null
                                    ? ` · ${cell.pct}% nac.`
                                    : ""}
                                </p>
                              </>
                            ) : (
                              <p className="text-[var(--text-muted)]">—</p>
                            )}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 align-middle">
                      <span className="display text-base font-semibold text-[var(--accent)]">
                        {chosen ?? "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Glass>

      <GlassModal
        open={showFinal}
        onClose={() => setShowFinal(false)}
        title="Cotización final guardada"
        description="Persistida en Neon. Refs P1/P2 sin nombres de proveedor. Markup no impreso."
        wide
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-[var(--text-muted)]">
                <th className="py-2">#</th>
                <th>Descripción</th>
                <th>Cant</th>
                <th>P.U.</th>
                <th>Importe</th>
                <th>Prov</th>
              </tr>
            </thead>
            <tbody>
              {(finalLines.length ? finalLines : preview).map((l) => (
                <tr
                  key={l.numero}
                  className="border-t border-[var(--glass-border)]"
                >
                  <td className="py-2">{l.numero}</td>
                  <td>{l.descripcion}</td>
                  <td>
                    {l.cantidad} {l.unidad}
                  </td>
                  <td>
                    $
                    {l.precioUnitario.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    $
                    {l.importe.toLocaleString("es-MX", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="font-semibold text-[var(--accent)]">
                    {l.proveedorRef}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowFinal(false)}>
            Cerrar
          </Button>
          <Button onClick={passToItza}>Pasar a Itza</Button>
        </div>
      </GlassModal>
    </>
  );
}
