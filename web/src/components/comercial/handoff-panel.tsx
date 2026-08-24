"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { handoffExpedienteAction } from "@/app/app/comercial/actions";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { handoffsFor, type HandoffOption } from "@/lib/domain/handoff";
import type { EstatusExpediente } from "@/lib/domain/workflow";

export function HandoffPanel({
  expedienteId,
  estatus,
}: {
  expedienteId: string;
  estatus: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [nota, setNota] = useState("");
  const [error, setError] = useState<string | null>(null);
  const options = handoffsFor(estatus);

  if (!options.length) return null;

  function run(opt: HandoffOption) {
    setError(null);
    start(async () => {
      try {
        const res = await handoffExpedienteAction({
          expedienteId,
          hacia: opt.hacia,
          nota: nota.trim() || opt.hint || opt.label,
        });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setNota("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo avanzar");
      }
    });
  }

  return (
    <Glass className="p-4">
      <div className="mb-3">
        <p className="text-sm font-semibold">Handoff · siguiente paso</p>
        <p className="text-xs text-[var(--text-muted)]">
          Asigna responsable, escribe bitácora y mueve el expediente.
        </p>
      </div>
      <label className="mb-3 block text-xs">
        <span className="text-[var(--text-muted)]">Nota (opcional)</span>
        <input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ej. requisitos OK, pasar a Ventas"
          className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm outline-none"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <Button
            key={opt.hacia}
            type="button"
            size="sm"
            variant={opt.hacia === "CANCELADO" || opt.hacia === "PERDIDA" ? "ghost" : "accent"}
            disabled={pending}
            onClick={() => run(opt)}
            title={opt.owner}
          >
            {opt.label}
          </Button>
        ))}
      </div>
      {error ? (
        <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>
      ) : null}
      <p className="mt-2 text-[10px] text-[var(--text-muted)]">
        Destinos:{" "}
        {options
          .map((o) => `${o.hacia as EstatusExpediente} (${o.owner})`)
          .join(" · ")}
      </p>
    </Glass>
  );
}
