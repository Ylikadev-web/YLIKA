import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { ComparativoClient } from "@/app/app/comercial/[id]/comparativo-client";
import { ExcelImportPanel } from "@/components/comercial/excel-import";
import { EditPanel } from "@/components/comercial/edit-panel";
import { RelacionesPanel } from "@/components/comercial/relaciones-panel";
import { ChecklistPanel } from "@/components/comercial/checklist-panel";
import { ProcessTree } from "@/components/comercial/process-tree";
import { WorkflowPanel } from "@/components/comercial/workflow-panel";
import { listCambiosPendientesExpediente } from "@/app/app/comercial/edit-actions";
import { getExpedienteById } from "@/lib/db/queries";
import { listTareasExpediente } from "@/lib/db/tareas";
import {
  listMarcas,
  listPartidaRelaciones,
  listProveedores,
} from "@/lib/db/queries-modules";
import { ESTATUS_LABEL, type EstatusExpediente } from "@/lib/domain/workflow";
import type { SelectionMode } from "@/lib/quotes/comparativo";

export const dynamic = "force-dynamic";

export default async function ExpedientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [exp, session, cambios, relaciones, proveedores, marcas, tareas] =
    await Promise.all([
      getExpedienteById(id),
      auth(),
      listCambiosPendientesExpediente(id),
      listPartidaRelaciones(id),
      listProveedores(),
      listMarcas(),
      listTareasExpediente(id),
    ]);
  if (!exp) notFound();

  const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];
  const canApprove =
    roles.includes("DIRECTOR") ||
    roles.includes("ADMIN_FINANZAS") ||
    roles.includes("ADMIN_SISTEMAS");

  const usedAliases = new Set(exp.cotizaciones.map((c) => c.alias));
  const nextAlias =
    ["P1", "P2", "P3", "P4", "P5"].find((a) => !usedAliases.has(a)) ?? "P1";

  return (
    <AppShell
      title={exp.codigo}
      subtitle={ESTATUS_LABEL[exp.estatus as EstatusExpediente] ?? exp.estatus}
      actions={
        <Link href="/app/comercial">
          <Button variant="ghost" size="sm">
            Pipeline
          </Button>
        </Link>
      }
    >
      <ProcessTree
        codigo={exp.codigo}
        estatus={exp.estatus}
        responsableNombre={exp.responsableNombre}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Empresa", exp.empresaCodigo],
          ["Sector", exp.sector],
          ["Tipo", exp.tipoNombre],
          ["Cliente", exp.clienteNombre ?? "—"],
        ].map(([k, v]) => (
          <Glass key={k} className="float-card px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {k}
            </p>
            <p className="mt-1 text-sm font-medium">{v}</p>
          </Glass>
        ))}
      </div>

      <WorkflowPanel expedienteId={exp.id} estatus={exp.estatus} />

      <ChecklistPanel
        expedienteId={exp.id}
        tareas={tareas}
        estatus={exp.estatus}
      />

      <EditPanel
        expedienteId={exp.id}
        titulo={exp.titulo}
        clienteNombre={exp.clienteNombre}
        partidas={exp.partidas}
        cambiosPendientes={cambios}
        canApprove={canApprove}
      />

      <ExcelImportPanel
        expedienteId={exp.id}
        nextAlias={nextAlias}
        proveedores={proveedores}
      />

      <RelacionesPanel
        expedienteId={exp.id}
        partidas={exp.partidas}
        relaciones={relaciones}
        proveedores={proveedores}
        marcas={marcas}
      />

      <ComparativoClient
        expedienteId={exp.id}
        partidas={exp.partidas}
        cotizaciones={exp.cotizaciones}
        lineas={exp.lineas}
        markupInicial={Number(exp.markupPct ?? 12)}
        criterioInicial={(exp.criterioSeleccion as SelectionMode) || "PRECIO"}
        estatus={exp.estatus}
      />

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Glass className="p-5">
          <h3 className="display font-semibold">Bitácora</h3>
          <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
            {exp.bitacora.length === 0 ? (
              <li className="text-[var(--text-muted)]">Sin movimientos</li>
            ) : (
              exp.bitacora.map((b) => (
                <li key={b.id} className="glass-thin rounded-2xl px-3 py-2">
                  <p className="font-medium">{b.accion}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {b.usuarioNombre ?? "sistema"} ·{" "}
                    {b.createdAt
                      ? new Date(b.createdAt).toLocaleString("es-MX")
                      : ""}
                    {b.deEstatus || b.aEstatus
                      ? ` · ${b.deEstatus ?? "—"} → ${b.aEstatus ?? "—"}`
                      : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Glass>
        <Glass className="p-5">
          <h3 className="display font-semibold">Cotizaciones finales</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {exp.finales.length === 0 ? (
              <li className="text-[var(--text-muted)]">
                Aún no se ha generado ninguna versión.
              </li>
            ) : (
              exp.finales.map((f) => (
                <li key={f.id} className="glass-thin rounded-2xl px-3 py-2">
                  v{f.version} · markup interno {f.markupPctAplicado}% ·{" "}
                  {f.criterio}
                  <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                    {f.createdAt
                      ? new Date(f.createdAt).toLocaleString("es-MX")
                      : ""}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Glass>
      </div>
    </AppShell>
  );
}
