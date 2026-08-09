"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { Glass } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalEntrega = {
  id: string;
  folio: string;
  destinatario: string;
  direccionEntrega: string | null;
  fechaProgramada: Date | string | null;
  responsableEntrega: string | null;
  estatus: string;
  expedienteId: string;
  expedienteCodigo: string;
  titulo: string;
  empresaCodigo: string;
  clienteNombre: string | null;
};

export function EntregasCalendar({ items }: { items: CalEntrega[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalEntrega[]>();
    for (const item of items) {
      if (!item.fechaProgramada) continue;
      const d = new Date(item.fechaProgramada);
      const key = format(d, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return map;
  }, [items]);

  const today = new Date();

  return (
    <Glass className="mb-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--glass-border)] px-5 py-4">
        <div>
          <h2 className="display text-lg font-semibold">Calendario de entregas</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Entregas programadas · pasa el cursor para ver detalle
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="glass"
            onClick={() => setCursor((c) => subMonths(c, 1))}
          >
            ←
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium capitalize">
            {format(cursor, "MMMM yyyy", { locale: es })}
          </span>
          <Button
            type="button"
            size="sm"
            variant="glass"
            onClick={() => setCursor((c) => addMonths(c, 1))}
          >
            →
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setCursor(startOfMonth(new Date()))}
          >
            Hoy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-[var(--glass-border)] p-px">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div
            key={d}
            className="bg-[color-mix(in_srgb,var(--glass)_85%,transparent)] px-2 py-2 text-center text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]"
          >
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayItems = byDay.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={key}
              className={cn(
                "min-h-[92px] bg-[color-mix(in_srgb,var(--bg)_92%,var(--glass))] p-1.5",
                !inMonth && "opacity-40",
              )}
            >
              <div
                className={cn(
                  "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs",
                  isToday &&
                    "bg-[var(--accent)] font-semibold text-[var(--bg)]",
                )}
              >
                {format(day, "d")}
              </div>
              <ul className="space-y-1">
                {dayItems.slice(0, 3).map((ev) => (
                  <li key={ev.id} className="group relative">
                    <Link
                      href={`/app/comercial/${ev.expedienteId}`}
                      className="block truncate rounded-lg bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-1.5 py-1 text-[10px] font-medium leading-tight text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--accent)_32%,transparent)]"
                    >
                      {ev.empresaCodigo} · {ev.expedienteCodigo.split("-").pop()}
                    </Link>
                    <div className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-56 rounded-2xl border border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass)_92%,transparent)] p-3 text-left shadow-xl backdrop-blur-xl group-hover:block">
                      <p className="text-xs font-semibold">{ev.folio}</p>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        {ev.titulo}
                      </p>
                      <p className="mt-2 text-[11px]">
                        <span className="text-[var(--text-muted)]">Dónde · </span>
                        {ev.direccionEntrega ?? "Sin dirección"}
                      </p>
                      <p className="text-[11px]">
                        <span className="text-[var(--text-muted)]">Con · </span>
                        {ev.responsableEntrega ?? ev.destinatario}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--accent)]">
                        {ev.estatus}
                      </p>
                    </div>
                  </li>
                ))}
                {dayItems.length > 3 && (
                  <li className="px-1 text-[10px] text-[var(--text-muted)]">
                    +{dayItems.length - 3} más
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </Glass>
  );
}
