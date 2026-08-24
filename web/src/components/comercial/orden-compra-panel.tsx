"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { emitirOrdenCompraAction } from "@/app/app/comercial/actions";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";

type ProveedorOpt = { id: string; razonSocial: string };

type OcRow = {
  id: string;
  folio: string;
  proveedorNombre: string;
  estatus: string;
  montoTotal: string | null;
  createdAt: Date | string | null;
};

export function OrdenCompraPanel({
  expedienteId,
  proveedores,
  ordenes,
  canEmit,
}: {
  expedienteId: string;
  proveedores: ProveedorOpt[];
  ordenes: OcRow[];
  canEmit: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!canEmit && ordenes.length === 0) return null;

  return (
    <Glass className="p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold">Órdenes de compra</p>
        <p className="text-xs text-[var(--text-muted)]">
          Folio formal post-ganada · queda en el expediente (Archivo).
        </p>
      </div>

      {ordenes.length > 0 ? (
        <ul className="mb-3 space-y-1.5 text-sm">
          {ordenes.map((o) => (
            <li
              key={o.id}
              className="glass-thin flex flex-wrap justify-between gap-2 rounded-xl px-3 py-2"
            >
              <span>
                <strong>{o.folio}</strong> · {o.proveedorNombre}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">
                {o.estatus}
                {o.montoTotal ? ` · $${o.montoTotal}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-[var(--text-muted)]">Sin OC aún.</p>
      )}

      {canEmit ? (
        <form
          className="grid gap-2 sm:grid-cols-[1fr_120px_auto]"
          action={(fd) => {
            setMsg(null);
            setErr(null);
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
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "…" : "Emitir OC"}
          </Button>
          {err ? (
            <p className="sm:col-span-3 text-sm text-[var(--danger)]">{err}</p>
          ) : null}
          {msg ? (
            <p className="sm:col-span-3 text-sm text-[var(--accent)]">{msg}</p>
          ) : null}
        </form>
      ) : null}
    </Glass>
  );
}
