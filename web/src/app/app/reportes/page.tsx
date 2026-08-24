import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Glass } from "@/components/ui/glass";
import { listReporteOperativo } from "@/lib/db/queries-modules";
import { expedienteHref } from "@/lib/domain/handoff";
import { ESTATUS_LABEL, type EstatusExpediente } from "@/lib/domain/workflow";

export const dynamic = "force-dynamic";

export default async function ReportesPage() {
  const { kpis, porEstatus, recientes } = await listReporteOperativo();

  const kpiCards = [
    { label: "En proceso", value: kpis.enProceso, hint: "No cerrados" },
    { label: "Creados 7d", value: kpis.creadosSemana, hint: "Nuevos" },
    { label: "Movidos 7d", value: kpis.movidosSemana, hint: "Actividad" },
    { label: "Enviadas", value: kpis.enviadas, hint: "Esperando fallo" },
    { label: "Ciclo ganado", value: kpis.ganadas, hint: "Post-ganada+" },
    { label: "Perdidas", value: kpis.perdidas, hint: "Histórico" },
    { label: "OC emitidas", value: kpis.ocEmitidas, hint: "Compras" },
    { label: "Cobranza abierta", value: kpis.cobranzaAbierta, hint: "Itza" },
  ];

  const statusRows = Object.entries(porEstatus).sort((a, b) => b[1] - a[1]);

  return (
    <AppShell
      title="Reportes"
      subtitle="Snapshot operativo · últimos 7 días + cartera"
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((k) => (
          <Glass key={k.label} className="px-4 py-3">
            <p className="text-[11px] text-[var(--text-muted)]">{k.label}</p>
            <p className="display text-2xl font-semibold">{k.value}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{k.hint}</p>
          </Glass>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Glass className="overflow-hidden">
          <div className="border-b border-[var(--glass-border)] px-4 py-3 text-sm font-semibold">
            Por estatus
          </div>
          <ul className="divide-y divide-[var(--glass-border)] text-sm">
            {statusRows.map(([estatus, n]) => (
              <li
                key={estatus}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <span>
                  {ESTATUS_LABEL[estatus as EstatusExpediente] ?? estatus}
                </span>
                <span className="font-medium">{n}</span>
              </li>
            ))}
            {statusRows.length === 0 ? (
              <li className="px-4 py-6 text-[var(--text-muted)]">Sin datos</li>
            ) : null}
          </ul>
        </Glass>

        <Glass className="overflow-hidden">
          <div className="border-b border-[var(--glass-border)] px-4 py-3 text-sm font-semibold">
            Recientes
          </div>
          <ul className="divide-y divide-[var(--glass-border)] text-sm">
            {recientes.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {e.codigo} · {e.titulo}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {e.empresaCodigo}
                    {e.clienteNombre ? ` · ${e.clienteNombre}` : ""}
                    {" · "}
                    {ESTATUS_LABEL[e.estatus as EstatusExpediente] ?? e.estatus}
                  </p>
                </div>
                <Link
                  href={expedienteHref(e.id, e.estatus)}
                  className="text-xs font-medium text-[var(--accent)]"
                >
                  Abrir
                </Link>
              </li>
            ))}
          </ul>
        </Glass>
      </div>
    </AppShell>
  );
}
