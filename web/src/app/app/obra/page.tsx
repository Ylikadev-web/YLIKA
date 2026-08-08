import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Glass } from "@/components/ui/glass";
import { listExpedientesByFilter } from "@/lib/db/queries-modules";
import { ESTATUS_LABEL, type EstatusExpediente } from "@/lib/domain/workflow";

export const dynamic = "force-dynamic";

export default async function ObraPage() {
  const obras = await listExpedientesByFilter({ sector: "GOBIERNO" });

  return (
    <AppShell
      title="Obra Pública"
      subtitle="Expedientes de sector GOBIERNO. La revisión documental vive en Licitaciones."
    >
      <Glass className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[color-mix(in_srgb,var(--glass)_70%,transparent)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {obras.map((o) => (
              <tr key={o.id} className="border-t border-[var(--glass-border)]">
                <td className="px-4 py-3">
                  <Link
                    href={`/app/comercial/${o.id}`}
                    className="font-medium text-[var(--accent)]"
                  >
                    {o.codigo}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.titulo}</td>
                <td className="px-4 py-3">{o.empresaCodigo}</td>
                <td className="px-4 py-3">{o.clienteNombre ?? "—"}</td>
                <td className="px-4 py-3">{o.tipoNombre}</td>
                <td className="px-4 py-3">
                  {ESTATUS_LABEL[o.estatus as EstatusExpediente] ?? o.estatus}
                </td>
              </tr>
            ))}
            {obras.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  No hay obra / gobierno. Crea un expediente GOBIERNO en Comercial.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Glass>
    </AppShell>
  );
}
