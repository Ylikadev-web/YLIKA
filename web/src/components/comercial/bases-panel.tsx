"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Glass } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { setRequisitoCumpleAction } from "@/app/app/comercial/requisitos-actions";
import { cn } from "@/lib/utils";

type Req = {
  id: string;
  descripcion: string;
  obligatorio: boolean;
  cumple: boolean | null;
  motivo: string | null;
  fuente?: string | null;
};

export function BasesPanel({
  expedienteId,
  requisitos,
}: {
  expedienteId: string;
  requisitos: Req[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const ok = requisitos.filter((r) => r.cumple === true).length;
  const no = requisitos.filter((r) => r.cumple === false).length;
  const pend = requisitos.filter((r) => r.cumple == null).length;
  const plantilla =
    requisitos[0]?.fuente === "PRIVADO_TEMPLATE"
      ? "Plantilla privado"
      : "Plantilla gobierno / bases";

  function setCumple(id: string, cumple: boolean | null) {
    start(async () => {
      const fd = new FormData();
      fd.set("requisitoId", id);
      fd.set("expedienteId", expedienteId);
      fd.set(
        "cumple",
        cumple === null ? "" : cumple ? "1" : "0",
      );
      await setRequisitoCumpleAction(fd);
      router.refresh();
    });
  }

  return (
    <Glass className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Análisis de bases</h3>
          <p className="text-[11px] text-[var(--text-muted)]">
            Cumplimos / no · checklist Laura antes de luz verde
          </p>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          {plantilla}
          {" · "}
          <span className="text-[var(--accent)]">{ok} sí</span>
          {" · "}
          <span className="text-[var(--danger)]">{no} no</span>
          {" · "}
          {pend} pend.
        </p>
      </div>

      {requisitos.length === 0 ? (
        <p className="px-4 py-5 text-sm text-[var(--text-muted)]">
          Sin requisitos cargados.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--glass-border)]">
          {requisitos.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm">{r.descripcion}</p>
                {r.obligatorio ? (
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    Obligatorio
                  </p>
                ) : null}
              </div>
              <div className="flex gap-1">
                {(
                  [
                    [true, "Sí"] as const,
                    [false, "No"] as const,
                    [null, "—"] as const,
                  ]
                ).map(([val, label]) => {
                  const active = r.cumple === val;
                  return (
                    <Button
                      key={String(val)}
                      type="button"
                      size="sm"
                      variant={
                        active
                          ? val === true
                            ? "accent"
                            : val === false
                              ? "danger"
                              : "glass"
                          : "ghost"
                      }
                      disabled={pending}
                      className={cn(!active && "opacity-55")}
                      onClick={() => setCumple(r.id, val)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Glass>
  );
}
