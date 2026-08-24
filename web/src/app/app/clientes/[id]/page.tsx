import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import {
  getClienteById,
  listExpedientesByCliente,
} from "@/lib/db/queries-modules";
import { expedienteHref } from "@/lib/domain/handoff";
import { ESTATUS_LABEL, type EstatusExpediente } from "@/lib/domain/workflow";

export const dynamic = "force-dynamic";

export default async function ClienteDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [cliente, historial] = await Promise.all([
    getClienteById(id),
    listExpedientesByCliente(id),
  ]);
  if (!cliente) notFound();

  const activos = historial.filter(
    (h) => !["CERRADO", "CANCELADO", "PERDIDA"].includes(h.estatus),
  ).length;
  const ganados = historial.filter((h) =>
    ["GANADA", "RECOTIZACION", "COMPRA", "ENTREGA", "COBRANZA", "CERRADO"].includes(
      h.estatus,
    ),
  ).length;

  return (
    <AppShell
      title={cliente.razonSocial}
      subtitle={`${cliente.tipo} · historial de solicitudes`}
      actions={
        <Link href="/app/clientes">
          <Button variant="ghost" size="sm">
            Clientes
          </Button>
        </Link>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Glass className="px-4 py-3">
          <p className="text-[11px] text-[var(--text-muted)]">Solicitudes</p>
          <p className="display text-2xl font-semibold">{historial.length}</p>
        </Glass>
        <Glass className="px-4 py-3">
          <p className="text-[11px] text-[var(--text-muted)]">Activas</p>
          <p className="display text-2xl font-semibold">{activos}</p>
        </Glass>
        <Glass className="px-4 py-3">
          <p className="text-[11px] text-[var(--text-muted)]">Ganadas / ciclo</p>
          <p className="display text-2xl font-semibold">{ganados}</p>
        </Glass>
      </div>

      <Glass className="mb-4 p-4">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-[var(--text-muted)]">RFC · </span>
            {cliente.rfc ?? "—"}
          </p>
          <p>
            <span className="text-[var(--text-muted)]">Contacto · </span>
            {cliente.contactoNombre ?? "—"}
          </p>
          <p>
            <span className="text-[var(--text-muted)]">Email · </span>
            {cliente.contactoEmail ?? "—"}
          </p>
          <p>
            <span className="text-[var(--text-muted)]">Tel · </span>
            {cliente.contactoTel ?? "—"}
          </p>
          <p className="sm:col-span-2">
            <span className="text-[var(--text-muted)]">Dependencia · </span>
            {cliente.dependencia ?? "—"}
          </p>
        </div>
      </Glass>

      <Glass className="overflow-hidden">
        <div className="border-b border-[var(--glass-border)] px-4 py-3 text-sm font-semibold">
          Historial ({historial.length})
        </div>
        <ul className="divide-y divide-[var(--glass-border)]">
          {historial.length === 0 ? (
            <li className="px-4 py-8 text-sm text-[var(--text-muted)]">
              Sin solicitudes vinculadas aún.
            </li>
          ) : (
            historial.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {h.codigo} · {h.titulo}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {h.empresaCodigo} · {h.sector} · {h.tipoNombre}
                    {h.folioExterno ? ` · ${h.folioExterno}` : ""}
                    {" · "}
                    {ESTATUS_LABEL[h.estatus as EstatusExpediente] ?? h.estatus}
                  </p>
                </div>
                <Link
                  href={expedienteHref(h.id, h.estatus)}
                  className="text-xs font-medium text-[var(--accent)]"
                >
                  Abrir →
                </Link>
              </li>
            ))
          )}
        </ul>
      </Glass>
    </AppShell>
  );
}
