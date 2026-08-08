import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { listExpedientes } from "@/lib/db/queries";
import {
  ESTATUS_LABEL,
  PIPELINE_STAGES,
  type EstatusExpediente,
} from "@/lib/domain/workflow";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function stageIndex(estatus: EstatusExpediente) {
  const direct = PIPELINE_STAGES.findIndex((s) => s.key === estatus);
  if (direct >= 0) return direct;
  const map: Partial<Record<EstatusExpediente, number>> = {
    BORRADOR: 0,
    APTO: 0,
    COTIZACION_FINAL: 4,
    GANADA: 8,
    COMPRA: 9,
    COBRANZA: 9,
    CERRADO: 9,
    PERDIDA: 7,
    CANCELADO: 0,
  };
  return map[estatus] ?? 0;
}

export default async function ComercialPage() {
  const expedientes = await listExpedientes();

  return (
    <AppShell
      title="Comercial"
      subtitle="Expedientes reales en Neon — pipeline Laura → Ventas → Itza → Nesim."
      actions={
        <Link href="/app/comercial/nuevo">
          <Button>+ Nueva solicitud</Button>
        </Link>
      }
    >
      <Glass className="mb-4 overflow-x-auto p-4">
        <div className="flex min-w-max gap-2">
          {PIPELINE_STAGES.map((s, idx) => (
            <div
              key={s.key}
              className="glass-thin w-[128px] rounded-2xl px-3 py-3"
            >
              <div
                className="mb-2 h-1 rounded-full"
                style={{ background: s.color }}
              />
              <p className="text-xs font-semibold leading-tight">{s.label}</p>
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                {s.owner}
              </p>
              <p className="mt-2 text-[10px] text-[var(--text-muted)]">
                {
                  expedientes.filter(
                    (e) => stageIndex(e.estatus as EstatusExpediente) === idx,
                  ).length
                }{" "}
                activos
              </p>
            </div>
          ))}
        </div>
      </Glass>

      {expedientes.length === 0 ? (
        <Glass className="p-8">
          <p className="text-sm text-[var(--text-muted)]">
            No hay expedientes. Crea el primero o corre{" "}
            <code className="text-[var(--accent)]">npm run db:seed:flow</code>.
          </p>
          <Link href="/app/comercial/nuevo" className="mt-4 inline-block">
            <Button>Nueva solicitud</Button>
          </Link>
        </Glass>
      ) : (
        <div className="space-y-3">
          {expedientes.map((exp) => {
            const idx = stageIndex(exp.estatus as EstatusExpediente);
            const pct = Math.round(((idx + 1) / PIPELINE_STAGES.length) * 100);
            return (
              <Link key={exp.id} href={`/app/comercial/${exp.id}`}>
                <Glass className="mb-3 block p-5 transition hover:ring-1 hover:ring-[var(--glass-border)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] tracking-wide text-[var(--text-muted)]">
                        {exp.codigo} · {exp.empresaCodigo} · {exp.tipoNombre}
                      </p>
                      <h2 className="display mt-1 text-lg font-semibold">
                        {exp.titulo}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {exp.clienteNombre ?? "Sin cliente"} ·{" "}
                        {exp.responsableNombre ?? "Sin responsable"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="glass-thin inline-flex rounded-full px-3 py-1 text-xs">
                        {ESTATUS_LABEL[exp.estatus as EstatusExpediente] ??
                          exp.estatus}
                      </span>
                      {exp.aptoRequisitos === true ? (
                        <p className="mt-2 text-xs text-[var(--accent)]">
                          Aptitud OK
                        </p>
                      ) : exp.aptoRequisitos === false ? (
                        <p className="mt-2 text-xs text-[var(--danger)]">
                          No apto / cancelado
                        </p>
                      ) : exp.estatus === "REVISION_REQUISITOS" ? (
                        <p className="mt-2 text-xs text-[var(--accent-2)]">
                          Pendiente revisión Laura
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text)_8%,transparent)]">
                    <div
                      className={cn("h-full rounded-full")}
                      style={{
                        width: `${pct}%`,
                        background:
                          "linear-gradient(90deg, var(--accent), var(--accent-2))",
                      }}
                    />
                  </div>
                </Glass>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
