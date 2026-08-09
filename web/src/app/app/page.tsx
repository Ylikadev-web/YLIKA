import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { RadarCard } from "@/components/dashboard/radar-card";
import { listDashboardRadar } from "@/lib/db/queries-modules";
import { listExpedientes } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [radar, expedientes] = await Promise.all([
    listDashboardRadar(8),
    listExpedientes(),
  ]);
  const paraItza = expedientes.filter((e) => e.estatus === "PROPUESTA_ADMIN");

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
          <Link href="/app/entregas">
            <Button size="sm" variant="glass">
              Calendario
            </Button>
          </Link>
          <Link href="/app/comercial/nuevo">
            <Button size="sm">+ Solicitud</Button>
          </Link>
        </div>
      }
    >
      <p className="mb-3 text-xs text-[var(--text-muted)]">
        Pasa el cursor sobre un pendiente de entrega para ver qué, dónde y con
        quién · clic entra al expediente.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {radar.map((e, i) => (
          <RadarCard key={e.id} item={e} index={i} />
        ))}
        {radar.length === 0 && (
          <div className="float-card glass col-span-full rounded-[28px] p-8 text-center text-sm text-[var(--text-muted)]">
            Sin expedientes
          </div>
        )}
      </div>
    </AppShell>
  );
}
