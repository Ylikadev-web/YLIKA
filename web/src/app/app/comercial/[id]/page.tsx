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
import { ExpedienteExplorer } from "@/components/comercial/expediente-explorer";
import { defaultTabForEstatus } from "@/lib/domain/expediente-utils";
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

  const tareasPend = tareas.filter((t) => t.estado === "PENDIENTE").length;
  const relAsignadas = new Set(
    relaciones.filter((r) => r.proveedorId).map((r) => r.partidaId),
  ).size;

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
      {/* Siempre visible: mapa del proceso */}
      <ProcessTree
        codigo={exp.codigo}
        estatus={exp.estatus}
        responsableNombre={exp.responsableNombre}
      />

      <ExpedienteExplorer
          defaultTab={defaultTabForEstatus(exp.estatus)}
          tabs={[
            { id: "resumen", label: "Resumen", short: "Res" },
            {
              id: "checklist",
              label: "Checklist",
              short: "Chk",
              badge: tareasPend || null,
              hidden:
                tareas.length === 0 &&
                ![
                  "GANADA",
                  "RECOTIZACION",
                  "COMPRA",
                  "ENTREGA",
                  "COBRANZA",
                ].includes(exp.estatus),
            },
            {
              id: "edicion",
              label: "Edición",
              short: "Edit",
              badge: cambios.length || null,
            },
            { id: "importar", label: "Importar", short: "XLS" },
            {
              id: "relaciones",
              label: "Relaciones",
              short: "Rel",
              badge:
                exp.partidas.length > 0
                  ? `${relAsignadas}/${exp.partidas.length}`
                  : null,
            },
            {
              id: "comparativo",
              label: "Comparativo",
              short: "Cmp",
              badge: exp.cotizaciones.length || null,
            },
            {
              id: "historial",
              label: "Historial",
              short: "Hist",
              badge: exp.bitacora.length || null,
            },
          ]}
          panels={{
            resumen: (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                <Glass className="float-card p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Título
                  </p>
                  <p className="mt-1 text-sm font-medium">{exp.titulo}</p>
                </Glass>
                <WorkflowPanel expedienteId={exp.id} estatus={exp.estatus} />
              </div>
            ),
            checklist: (
              <ChecklistPanel
                expedienteId={exp.id}
                tareas={tareas}
                estatus={exp.estatus}
              />
            ),
            edicion: (
              <EditPanel
                expedienteId={exp.id}
                titulo={exp.titulo}
                clienteNombre={exp.clienteNombre}
                partidas={exp.partidas}
                cambiosPendientes={cambios}
                canApprove={canApprove}
              />
            ),
            importar: (
              <ExcelImportPanel
                expedienteId={exp.id}
                nextAlias={nextAlias}
                proveedores={proveedores}
              />
            ),
            relaciones: (
              <RelacionesPanel
                expedienteId={exp.id}
                partidas={exp.partidas}
                relaciones={relaciones}
                proveedores={proveedores}
                marcas={marcas}
              />
            ),
            comparativo: (
              <ComparativoClient
                expedienteId={exp.id}
                partidas={exp.partidas}
                cotizaciones={exp.cotizaciones}
                lineas={exp.lineas}
                markupInicial={Number(exp.markupPct ?? 12)}
                criterioInicial={
                  (exp.criterioSeleccion as SelectionMode) || "PRECIO"
                }
                estatus={exp.estatus}
              />
            ),
            historial: (
              <div className="grid gap-3 lg:grid-cols-2">
                <Glass className="p-5">
                  <h3 className="display font-semibold">Bitácora</h3>
                  <ul className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto text-sm">
                    {exp.bitacora.length === 0 ? (
                      <li className="text-[var(--text-muted)]">
                        Sin movimientos
                      </li>
                    ) : (
                      exp.bitacora.map((b) => (
                        <li
                          key={b.id}
                          className="glass-thin rounded-2xl px-3 py-2"
                        >
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
                  <h3 className="display font-semibold">
                    Cotizaciones finales
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {exp.finales.length === 0 ? (
                      <li className="text-[var(--text-muted)]">
                        Aún no se ha generado ninguna versión.
                      </li>
                    ) : (
                      exp.finales.map((f) => (
                        <li
                          key={f.id}
                          className="glass-thin rounded-2xl px-3 py-2"
                        >
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
            ),
          }}
      />
    </AppShell>
  );
}
