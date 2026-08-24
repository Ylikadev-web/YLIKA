"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCobranzaAction } from "@/app/app/comercial/actions";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

const ESTADOS = [
  { id: "PENDIENTE", label: "Pendiente" },
  { id: "FACTURADA", label: "Facturada" },
  { id: "PARCIAL", label: "Parcial" },
  { id: "COBRADA", label: "Cobrada" },
  { id: "VENCIDA", label: "Vencida" },
] as const;

export function CobranzaPanel({
  expedienteId,
  cobranza,
}: {
  expedienteId: string;
  cobranza: {
    id?: string;
    estatus: string;
    montoTotal: string | null;
    montoCobrado: string | null;
    fechaFactura: Date | string | null;
    fechaVencimiento: Date | string | null;
    notas: string | null;
  } | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const current = cobranza?.estatus ?? "PENDIENTE";

  function toDateInput(v: Date | string | null | undefined) {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }

  return (
    <Glass className="p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold">Cobranza</p>
        <p className="text-xs text-[var(--text-muted)]">
          Estados: Facturada · Parcial · Cobrada · Vencida + montos.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {ESTADOS.map((e) => (
          <span
            key={e.id}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium",
              current === e.id
                ? "bg-[var(--accent)] text-[var(--bg)]"
                : "glass-thin text-[var(--text-muted)]",
            )}
          >
            {e.label}
          </span>
        ))}
      </div>

      <form
        className="grid gap-2 sm:grid-cols-2"
        action={(fd) => {
          setErr(null);
          start(async () => {
            const res = await updateCobranzaAction(fd);
            if (!res.ok) setErr(res.error);
            else router.refresh();
          });
        }}
      >
        <input type="hidden" name="expedienteId" value={expedienteId} />
        <label className="block text-xs sm:col-span-2">
          <span className="text-[var(--text-muted)]">Estado</span>
          <select
            name="estatus"
            defaultValue={current}
            className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
          >
            {ESTADOS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-[var(--text-muted)]">Monto total</span>
          <input
            name="montoTotal"
            type="number"
            step="0.01"
            defaultValue={cobranza?.montoTotal ?? ""}
            className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="text-[var(--text-muted)]">Monto cobrado</span>
          <input
            name="montoCobrado"
            type="number"
            step="0.01"
            defaultValue={cobranza?.montoCobrado ?? ""}
            className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="text-[var(--text-muted)]">Fecha factura</span>
          <input
            name="fechaFactura"
            type="date"
            defaultValue={toDateInput(cobranza?.fechaFactura)}
            className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="text-[var(--text-muted)]">Vencimiento</span>
          <input
            name="fechaVencimiento"
            type="date"
            defaultValue={toDateInput(cobranza?.fechaVencimiento)}
            className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
          />
        </label>
        <label className="block text-xs sm:col-span-2">
          <span className="text-[var(--text-muted)]">Notas</span>
          <input
            name="notas"
            defaultValue={cobranza?.notas ?? ""}
            className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
          />
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Guardando…" : "Actualizar cobranza"}
          </Button>
          {err ? (
            <span className="ml-2 text-sm text-[var(--danger)]">{err}</span>
          ) : null}
        </div>
      </form>
    </Glass>
  );
}
