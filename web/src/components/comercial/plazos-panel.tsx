"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateExpedientePlazosAction } from "@/app/app/comercial/actions";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";

function toInputDate(v?: Date | string | null) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function PlazosPanel({
  expedienteId,
  fechaJuntaAclaraciones,
  fechaApertura,
  fechaFallo,
  vigenciaOfertaHasta,
}: {
  expedienteId: string;
  fechaJuntaAclaraciones?: Date | string | null;
  fechaApertura?: Date | string | null;
  fechaFallo?: Date | string | null;
  vigenciaOfertaHasta?: Date | string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <Glass className="p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold">Plazos · tiempo y forma</p>
        <p className="text-xs text-[var(--text-muted)]">
          Fechas clave del proceso (alertan en Inicio cuando se acercan).
        </p>
      </div>
      <form
        className="grid gap-3 sm:grid-cols-2"
        action={(fd) => {
          setMsg(null);
          setErr(null);
          start(async () => {
            const res = await updateExpedientePlazosAction(fd);
            if (!res.ok) setErr(res.error);
            else {
              setMsg("Plazos guardados");
              router.refresh();
            }
          });
        }}
      >
        <input type="hidden" name="expedienteId" value={expedienteId} />
        <label className="block text-xs">
          <span className="text-[var(--text-muted)]">Junta de aclaraciones</span>
          <input
            type="date"
            name="fechaJuntaAclaraciones"
            defaultValue={toInputDate(fechaJuntaAclaraciones)}
            className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="text-[var(--text-muted)]">Apertura / presentación</span>
          <input
            type="date"
            name="fechaApertura"
            defaultValue={toInputDate(fechaApertura)}
            className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="text-[var(--text-muted)]">Fallo</span>
          <input
            type="date"
            name="fechaFallo"
            defaultValue={toInputDate(fechaFallo)}
            className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
          />
        </label>
        <label className="block text-xs">
          <span className="text-[var(--text-muted)]">Vigencia de oferta</span>
          <input
            type="date"
            name="vigenciaOfertaHasta"
            defaultValue={toInputDate(vigenciaOfertaHasta)}
            className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
          />
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Guardando…" : "Guardar plazos"}
          </Button>
          {err ? <span className="text-sm text-[var(--danger)]">{err}</span> : null}
          {msg ? (
            <span className="text-sm text-[var(--accent)]">{msg}</span>
          ) : null}
        </div>
      </form>
    </Glass>
  );
}
