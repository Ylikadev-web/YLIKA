"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adjuntarComprobanteCajaAction,
  comprobarCajaChicaAction,
  rechazarCajaChicaAction,
  solicitarCajaChicaAction,
} from "@/app/app/comercial/actions";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

type Mov = {
  id: string;
  concepto: string;
  monto: string;
  moneda: string;
  estatus: string;
  fecha: Date | string;
  solicitadoNombre: string | null;
  documentoId: string | null;
  documentoNombre: string | null;
  motivoRechazo: string | null;
  notas: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  POR_COMPROBAR: "Por comprobar",
  COMPROBADO: "Comprobado",
  RECHAZADO: "Rechazado",
};

export function CajaChicaPanel({
  expedienteId,
  movimientos,
  canFinance,
}: {
  expedienteId: string;
  movimientos: Mov[];
  canFinance: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);

  const open = movimientos.filter((m) => m.estatus === "POR_COMPROBAR").length;
  const totalOpen = movimientos
    .filter((m) => m.estatus === "POR_COMPROBAR")
    .reduce((a, m) => a + Number(m.monto || 0), 0);

  return (
    <Glass className="p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Caja chica del expediente</p>
          <p className="text-xs text-[var(--text-muted)]">
            Gastos operativos · comprobante · revisión Finanzas
          </p>
        </div>
        {open > 0 ? (
          <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-2.5 py-1 text-[11px] font-medium">
            {open} por comprobar · ${totalOpen.toLocaleString("es-MX")}
          </span>
        ) : null}
      </div>

      {movimientos.length > 0 ? (
        <ul className="mb-3 space-y-2">
          {movimientos.map((m) => (
            <li
              key={m.id}
              className="glass-thin space-y-2 rounded-2xl px-3 py-2.5 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{m.concepto}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {m.solicitadoNombre ?? "—"} ·{" "}
                    {new Date(m.fecha).toLocaleDateString("es-MX")}
                    {m.documentoNombre ? ` · ${m.documentoNombre}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${Number(m.monto).toLocaleString("es-MX")} {m.moneda}
                  </p>
                  <span
                    className={cn(
                      "text-[10px] font-medium uppercase tracking-wide",
                      m.estatus === "COMPROBADO"
                        ? "text-[var(--accent)]"
                        : m.estatus === "RECHAZADO"
                          ? "text-[var(--danger)]"
                          : "text-[var(--text-muted)]",
                    )}
                  >
                    {STATUS_LABEL[m.estatus] ?? m.estatus}
                  </span>
                </div>
              </div>

              {m.motivoRechazo ? (
                <p className="text-[11px] text-[var(--danger)]">
                  Rechazo: {m.motivoRechazo}
                </p>
              ) : null}

              {m.estatus === "POR_COMPROBAR" ? (
                <div className="flex flex-wrap gap-2">
                  {!m.documentoId ? (
                    <form
                      className="flex flex-wrap items-center gap-2"
                      action={(fd) => {
                        setErr(null);
                        setMsg(null);
                        start(async () => {
                          const res = await adjuntarComprobanteCajaAction(fd);
                          if (!res.ok) setErr(res.error);
                          else {
                            setMsg("Comprobante adjunto");
                            router.refresh();
                          }
                        });
                      }}
                    >
                      <input type="hidden" name="movimientoId" value={m.id} />
                      <input
                        type="hidden"
                        name="expedienteId"
                        value={expedienteId}
                      />
                      <input
                        type="file"
                        name="file"
                        required
                        accept="image/*,.pdf"
                        className="max-w-[180px] text-[10px]"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                      >
                        Adjuntar
                      </Button>
                    </form>
                  ) : null}

                  {canFinance ? (
                    <>
                      <form
                        action={(fd) => {
                          setErr(null);
                          start(async () => {
                            const res = await comprobarCajaChicaAction(fd);
                            if (!res.ok) setErr(res.error);
                            else router.refresh();
                          });
                        }}
                      >
                        <input type="hidden" name="movimientoId" value={m.id} />
                        <input
                          type="hidden"
                          name="expedienteId"
                          value={expedienteId}
                        />
                        <Button type="submit" size="sm" disabled={pending}>
                          Comprobar
                        </Button>
                      </form>
                      {rejectId === m.id ? (
                        <form
                          className="flex flex-wrap gap-1"
                          action={(fd) => {
                            setErr(null);
                            start(async () => {
                              const res = await rechazarCajaChicaAction(fd);
                              if (!res.ok) setErr(res.error);
                              else {
                                setRejectId(null);
                                router.refresh();
                              }
                            });
                          }}
                        >
                          <input type="hidden" name="movimientoId" value={m.id} />
                          <input
                            type="hidden"
                            name="expedienteId"
                            value={expedienteId}
                          />
                          <input
                            name="motivo"
                            required
                            placeholder="Motivo"
                            className="glass-thin h-8 rounded-xl px-2 text-xs"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            disabled={pending}
                          >
                            Confirmar
                          </Button>
                        </form>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setRejectId(m.id)}
                        >
                          Rechazar
                        </Button>
                      )}
                    </>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-[var(--text-muted)]">
          Sin movimientos de caja chica.
        </p>
      )}

      <form
        className="grid gap-2 border-t border-[var(--glass-border)] pt-3 sm:grid-cols-[1fr_110px_auto]"
        action={(fd) => {
          setErr(null);
          setMsg(null);
          start(async () => {
            const res = await solicitarCajaChicaAction(fd);
            if (!res.ok) setErr(res.error);
            else {
              setMsg("Gasto registrado (por comprobar)");
              router.refresh();
            }
          });
        }}
      >
        <input type="hidden" name="expedienteId" value={expedienteId} />
        <input
          name="concepto"
          required
          placeholder="Concepto (taxi, papelería…)"
          className="glass-thin h-10 rounded-2xl px-3 text-sm"
        />
        <input
          name="monto"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="Monto"
          className="glass-thin h-10 rounded-2xl px-3 text-sm"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Registrar"}
        </Button>
        <input
          name="notas"
          placeholder="Notas (opcional)"
          className="glass-thin h-10 rounded-2xl px-3 text-sm sm:col-span-3"
        />
      </form>

      {err ? <p className="mt-2 text-sm text-[var(--danger)]">{err}</p> : null}
      {msg ? <p className="mt-2 text-sm text-[var(--accent)]">{msg}</p> : null}
    </Glass>
  );
}
