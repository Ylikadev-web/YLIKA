import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { RadarCard } from "@/components/dashboard/radar-card";
import { AreaDashboard } from "@/components/dashboard/area-dashboard";
import { auth } from "@/lib/auth/config";
import { listDashboardRadar } from "@/lib/db/queries-modules";
import { listExpedientes } from "@/lib/db/queries";
import { listPendientesForRoles } from "@/lib/db/pendientes";
import { areasForRoles } from "@/lib/domain/areas";
import { isGoogleDriveConfigured } from "@/lib/storage/drive";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];
  const userId = session?.user?.id;
  const userName = session?.user?.name ?? "Usuario";

  const [radar, expedientes, pendientes] = await Promise.all([
    listDashboardRadar(8),
    listExpedientes(),
    listPendientesForRoles(roles, userId),
  ]);

  const areas = areasForRoles(roles);
  const paraItza = expedientes.filter((e) => e.estatus === "PROPUESTA_ADMIN");
  const driveOk = isGoogleDriveConfigured();

  const kpis = [
    {
      label: "Mis pendientes",
      value: String(pendientes.length),
      hint: "Filtrados por tus áreas",
      href: pendientes[0]?.href ?? "/app",
      tone: "amber" as const,
    },
    {
      label: "Áreas asignadas",
      value: String(areas.length),
      hint: areas.map((a) => a.nombre).slice(0, 2).join(" · ") || "Sin áreas",
      href: "/app/configuracion",
      tone: "cyan" as const,
    },
    {
      label: "Cola Itza",
      value: String(paraItza.length),
      hint: "PROPUESTA_ADMIN",
      href: "/app/propuestas",
      tone: "rose" as const,
    },
    {
      label: "Drive",
      value: driveOk ? "ON" : "OFF",
      hint: driveOk ? "Sync activo" : "Configura GOOGLE_DRIVE_*",
      href: "/app/configuracion/usuarios",
      tone: "mint" as const,
    },
  ];

  return (
    <AppShell
      title="Inicio"
      subtitle={`Hola ${userName.split(" ")[0]} · dashboard de tus áreas`}
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
      <AreaDashboard
        kpis={kpis}
        areas={areas.map((a) => ({
          codigo: a.codigo,
          nombre: a.nombre,
          descripcion: a.descripcion,
          href: a.href,
          color: a.color,
          pendingCount: pendientes.filter((p) => {
            if (a.codigo === "LICITACIONES")
              return p.owner.toLowerCase().includes("laura") || p.href.includes("licitaciones");
            if (a.codigo === "PROPUESTAS" || a.codigo === "DIRECCION")
              return p.href.includes("propuestas");
            if (a.codigo === "ENTREGAS")
              return p.href.includes("entregas") || p.href.includes("comercial");
            if (a.codigo === "COMERCIAL" || a.codigo === "COMPRAS")
              return p.href.includes("comercial") || p.href.includes("compras");
            if (a.codigo === "TESORERIA") return p.href.includes("tesoreria");
            return false;
          }).length,
        }))}
        pendientes={pendientes.slice(0, 8).map((p) => ({
          id: p.id,
          title: p.title,
          href: p.href,
          owner: p.owner,
          tone: p.tone,
        }))}
      />

      <p className="mb-3 mt-6 text-xs text-[var(--text-muted)]">
        Radar de expedientes · hover en entregas para qué / dónde / con quién
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
