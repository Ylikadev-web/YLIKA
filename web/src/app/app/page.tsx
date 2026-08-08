import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { listExpedientes } from "@/lib/db/queries";
import { ESTATUS_LABEL, type EstatusExpediente } from "@/lib/domain/workflow";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const expedientes = await listExpedientes();
  const radar = expedientes.slice(0, 8);

  return (
    <AppShell
      title="Inicio"
      subtitle="Cola de trabajo desde Neon — no métricas decorativas."
      actions={
        <Link href="/app/comercial/nuevo">
          <Button>+ Nueva solicitud</Button>
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Glass className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="display text-lg font-semibold">En tu radar</h2>
            <Link
              href="/app/comercial"
              className="text-xs text-[var(--accent)] hover:underline"
            >
              Ver pipeline
            </Link>
          </div>
          {radar.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Sin expedientes. Crea uno o corre{" "}
              <code>npm run db:seed:flow</code>.
            </p>
          ) : (
            <ul className="space-y-3">
              {radar.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/app/comercial/${e.id}`}
                    className="glass-thin flex w-full items-start gap-3 rounded-2xl px-4 py-3 transition hover:ring-1 hover:ring-[var(--glass-border)]"
                  >
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background:
                          e.estatus === "REVISION_REQUISITOS"
                            ? "var(--accent-2)"
                            : e.estatus === "COMPARATIVO" ||
                                e.estatus === "COTIZACION_FINAL"
                              ? "var(--accent)"
                              : "var(--text-muted)",
                      }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11px] tracking-wide text-[var(--text-muted)]">
                        {e.codigo} · {e.empresaCodigo}
                      </span>
                      <span className="mt-0.5 block text-sm font-medium">
                        {e.titulo}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                        {ESTATUS_LABEL[e.estatus as EstatusExpediente] ??
                          e.estatus}
                        {e.clienteNombre ? ` · ${e.clienteNombre}` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Glass>

        <Glass strength="strong" className="p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Sistema
          </p>
          <h2 className="display mt-2 text-2xl font-semibold tracking-tight">
            Arquitectura viva
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Postgres en Neon · Auth.js · expedientes persistentes · comparativo
            con cotización final versionada. Sin datos fake en la UI.
          </p>
          <div className="mt-6 grid gap-2">
            <Link href="/app/comercial">
              <Button variant="accent" className="w-full">
                Abrir Comercial
              </Button>
            </Link>
            <Link href="/app/licitaciones">
              <Button variant="glass" className="w-full">
                Licitaciones (Laura)
              </Button>
            </Link>
            <Link href="/app/configuracion">
              <Button variant="ghost" className="w-full">
                Temas y workflow
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {expedientes.length} expediente(s) en base de datos
          </p>
        </Glass>
      </div>
    </AppShell>
  );
}
