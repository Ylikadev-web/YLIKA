import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { listExpedientes } from "@/lib/db/queries";
import { ESTATUS_LABEL, type EstatusExpediente } from "@/lib/domain/workflow";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const expedientes = await listExpedientes();
  const paraItza = expedientes.filter((e) => e.estatus === "PROPUESTA_ADMIN");
  const radar = expedientes.slice(0, 8);

  return (
    <AppShell
      title="Inicio"
      actions={
        <div className="flex gap-2">
          {paraItza.length > 0 ? (
            <Link href="/app/propuestas">
              <Button size="sm" variant="accent">
                Itza · {paraItza.length}
              </Button>
            </Link>
          ) : null}
          <Link href="/app/comercial/nuevo">
            <Button size="sm">+ Solicitud</Button>
          </Link>
        </div>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {radar.map((e, i) => {
          const toPropuestas =
            e.estatus === "PROPUESTA_ADMIN" ||
            e.estatus === "REVISION_DIRECTOR" ||
            e.estatus === "ENVIADA";
          return (
            <Link
              key={e.id}
              href={toPropuestas ? "/app/propuestas" : `/app/comercial/${e.id}`}
              className="float-card glass rounded-[28px] p-4 transition hover:-translate-y-0.5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background:
                      e.estatus === "PROPUESTA_ADMIN"
                        ? "var(--accent-2)"
                        : e.estatus === "REVISION_REQUISITOS"
                          ? "var(--accent-2)"
                          : e.estatus === "COMPARATIVO" ||
                              e.estatus === "COTIZACION_FINAL"
                            ? "var(--accent)"
                            : "var(--text-muted)",
                  }}
                />
                <span className="text-[11px] text-[var(--text-muted)]">
                  {e.codigo}
                </span>
              </div>
              <p className="mt-2 truncate text-sm font-semibold">{e.titulo}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {ESTATUS_LABEL[e.estatus as EstatusExpediente] ?? e.estatus}
                {e.estatus === "PROPUESTA_ADMIN" ? " · → Propuestas" : ""}
              </p>
            </Link>
          );
        })}
        {radar.length === 0 && (
          <div className="float-card glass col-span-full rounded-[28px] p-8 text-center text-sm text-[var(--text-muted)]">
            Sin expedientes
          </div>
        )}
      </div>
    </AppShell>
  );
}
