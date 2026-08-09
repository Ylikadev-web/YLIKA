"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import {
  enviarADirectorAction,
  marcarEnviadaAction,
  marcarGanadaAction,
  marcarPerdidaAction,
  transitionExpedienteAction,
} from "@/app/app/comercial/actions";
import type { EstatusExpediente } from "@/lib/domain/workflow";

export function WorkflowPanel({
  expedienteId,
  estatus,
}: {
  expedienteId: string;
  estatus: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (
    ![
      "PROPUESTA_ADMIN",
      "REVISION_DIRECTOR",
      "ENVIADA",
      "COTIZACION_FINAL",
      "COMPARATIVO",
    ].includes(estatus)
  ) {
    return null;
  }

  return (
    <Glass className="float-card mb-4 p-4">
      {estatus === "PROPUESTA_ADMIN" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Bandeja Itza</p>
            <p className="text-xs text-[var(--text-muted)]">
              Arma propuesta económica/técnica y pásala a Nesim
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/app/comercial/${expedienteId}/propuesta`} target="_blank">
              <Button size="sm" variant="glass">
                PDF propuesta
              </Button>
            </Link>
            <Link href="/app/propuestas">
              <Button size="sm" variant="ghost">
                Ver cola
              </Button>
            </Link>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const fd = new FormData();
                  fd.set("expedienteId", expedienteId);
                  await enviarADirectorAction(fd);
                  router.refresh();
                })
              }
            >
              Listo → Nesim
            </Button>
          </div>
        </div>
      )}

      {estatus === "REVISION_DIRECTOR" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Revisión Nesim</p>
            <p className="text-xs text-[var(--text-muted)]">
              Aprueba y envía la propuesta al cliente
            </p>
          </div>
          <Button
            size="sm"
            variant="accent"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const fd = new FormData();
                fd.set("expedienteId", expedienteId);
                await marcarEnviadaAction(fd);
                router.refresh();
              })
            }
          >
            Enviar propuesta
          </Button>
        </div>
      )}

      {estatus === "ENVIADA" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Esperando fallo</p>
            <p className="text-xs text-[var(--text-muted)]">
              Registra el resultado del proceso
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="accent"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const fd = new FormData();
                  fd.set("expedienteId", expedienteId);
                  await marcarGanadaAction(fd);
                  router.refresh();
                })
              }
            >
              Ganada
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const fd = new FormData();
                  fd.set("expedienteId", expedienteId);
                  await marcarPerdidaAction(fd);
                  router.refresh();
                })
              }
            >
              Perdida
            </Button>
          </div>
        </div>
      )}

      {(estatus === "COTIZACION_FINAL" || estatus === "COMPARATIVO") && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Listo para Admin</p>
            <p className="text-xs text-[var(--text-muted)]">
              Genera cotización final y pásala a la cola de Itza
            </p>
          </div>
          <Button
            size="sm"
            variant="glass"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await transitionExpedienteAction(
                  expedienteId,
                  "PROPUESTA_ADMIN" as EstatusExpediente,
                  "Cotización final pasada a Admin/Finanzas (Itza)",
                );
                router.push("/app/propuestas");
                router.refresh();
              })
            }
          >
            Pasar a Itza
          </Button>
        </div>
      )}
    </Glass>
  );
}
