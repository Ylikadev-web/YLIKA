"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { GlassModal } from "@/components/ui/glass-modal";
import { DEMO_EXPEDIENTES } from "@/lib/domain/demo-data";
import { ESTATUS_LABEL } from "@/lib/domain/workflow";
import {
  buildCotizacionFinal,
  pickBest,
  type SelectionMode,
} from "@/lib/quotes/comparativo";
import { cn } from "@/lib/utils";

export default function ExpedientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const exp = DEMO_EXPEDIENTES.find((e) => e.id === id);
  const [mode, setMode] = useState<SelectionMode>("PRECIO");
  const [markup, setMarkup] = useState(exp?.markupPct ?? 12);
  const [showFinal, setShowFinal] = useState(false);
  const [manual, setManual] = useState<Record<number, string>>({});

  const selected = useMemo(() => {
    if (!exp) return {};
    const out: Record<number, { alias: string; precio: number }> = {};
    for (const p of exp.partidas) {
      const cells = exp.proveedores.map((prov) => {
        const cell = exp.precios[p.numero]?.[prov.alias];
        return {
          alias: prov.alias,
          precio: cell?.precio ?? Infinity,
          entrega: cell?.entrega,
          pctNacional: cell?.pctNacional,
        };
      });
      const auto = pickBest(
        cells.filter((c) => Number.isFinite(c.precio)),
        mode,
      );
      const alias = manual[p.numero] ?? auto;
      if (!alias) continue;
      const precio = exp.precios[p.numero]?.[alias]?.precio ?? 0;
      out[p.numero] = { alias, precio };
    }
    return out;
  }, [exp, mode, manual]);

  const finalLines = useMemo(() => {
    if (!exp) return [];
    return buildCotizacionFinal({
      partidas: exp.partidas,
      selected,
      markupPct: markup,
    });
  }, [exp, selected, markup]);

  if (!exp) {
    return (
      <AppShell title="Expediente">
        <Glass className="p-8">
          <p>No encontrado.</p>
          <Link href="/app/comercial">
            <Button variant="glass" className="mt-4">
              Volver
            </Button>
          </Link>
        </Glass>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={exp.codigo}
      subtitle={`${exp.titulo} · ${ESTATUS_LABEL[exp.estatus]} · ${exp.owner}`}
      actions={
        <>
          <Link href="/app/comercial">
            <Button variant="ghost">Pipeline</Button>
          </Link>
          <Button onClick={() => setShowFinal(true)}>
            Generar cotización final
          </Button>
        </>
      }
    >
      <div className="mb-4 grid gap-3 lg:grid-cols-4">
        {[
          ["Empresa", exp.empresa],
          ["Sector", exp.sector],
          ["Tipo", exp.tipo],
          ["Cliente", exp.cliente],
        ].map(([k, v]) => (
          <Glass key={k} className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {k}
            </p>
            <p className="mt-1 text-sm font-medium">{v}</p>
          </Glass>
        ))}
      </div>

      <Glass className="mb-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display text-lg font-semibold">
              Comparativo iluminado
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              Precios con IVA 16%. La celda ganadora brilla. En el PDF final solo
              sale la ref. P1/P2 — nunca el nombre del proveedor ni el % de
              markup.
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
          </div>
        </div>

        {exp.partidas.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--text-muted)]">
            Sin partidas aún — Laura/Ventas cargan la lista limpia (Excel).
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-sm">
              <thead>
                <tr className="text-left text-[11px] text-[var(--text-muted)]">
                  <th className="px-3 py-1">Partida</th>
                  {exp.proveedores.map((p) => (
                    <th key={p.alias} className="px-3 py-1">
                      {p.alias}
                      <span className="mt-0.5 block font-normal opacity-70">
                        {p.nombre}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-1">Elegida</th>
                </tr>
              </thead>
              <tbody>
                {exp.partidas.map((partida) => {
                  const chosen = selected[partida.numero]?.alias;
                  return (
                    <tr key={partida.numero}>
                      <td className="glass-thin rounded-2xl px-3 py-3 align-top">
                        <p className="text-[11px] text-[var(--text-muted)]">
                          #{partida.numero} · {partida.cantidad}{" "}
                          {partida.unidad}
                        </p>
                        <p className="font-medium">{partida.descripcion}</p>
                      </td>
                      {exp.proveedores.map((prov) => {
                        const cell = exp.precios[partida.numero]?.[prov.alias];
                        const win = chosen === prov.alias;
                        return (
                          <td key={prov.alias} className="px-1 align-top">
                            <button
                              type="button"
                              onClick={() =>
                                setManual((m) => ({
                                  ...m,
                                  [partida.numero]: prov.alias,
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
                                    {cell.entrega}d
                                    {cell.pctNacional
                                      ? ` · ${cell.pctNacional}% nac.`
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
        )}
      </Glass>

      <div className="grid gap-3 lg:grid-cols-2">
        <Glass className="p-5">
          <h3 className="display font-semibold">Bitácora del expediente</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
            <li className="glass-thin rounded-2xl px-3 py-2">
              Laura · luz verde requisitos
            </li>
            <li className="glass-thin rounded-2xl px-3 py-2">
              Laura · orden de cotizar → Ventas
            </li>
            <li className="glass-thin rounded-2xl px-3 py-2">
              Miguel · 3 cotizaciones parseadas (demo)
            </li>
          </ul>
        </Glass>
        <Glass className="p-5">
          <h3 className="display font-semibold">Leyenda documento final</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Columnas: Partida · Cantidad · Precio unit. · Importe · Ref.
            proveedor (P1…). El markup {markup}% ya va cocinado en el precio;
            el cliente no lo ve.
          </p>
          <Button className="mt-4" onClick={() => setShowFinal(true)}>
            Vista previa cotización final
          </Button>
        </Glass>
      </div>

      <GlassModal
        open={showFinal}
        onClose={() => setShowFinal(false)}
        title="Cotización final"
        description="Lo que se imprime / exporta. Refs P1/P2 sin nombres reales."
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
              {finalLines.map((l) => (
                <tr key={l.numero} className="border-t border-[var(--glass-border)]">
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
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Total: $
          {finalLines
            .reduce((a, b) => a + b.importe, 0)
            .toLocaleString("es-MX", { minimumFractionDigits: 2 })}{" "}
          IVA incluido · markup interno no impreso
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setShowFinal(false)}>
            Cerrar
          </Button>
          <Button onClick={() => setShowFinal(false)}>
            Guardar en expediente
          </Button>
        </div>
      </GlassModal>
    </AppShell>
  );
}
