import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Glass } from "@/components/ui/glass";
import { listExpedientesByFilter } from "@/lib/db/queries-modules";
import { ESTATUS_LABEL, type EstatusExpediente } from "@/lib/domain/workflow";

export const dynamic = "force-dynamic";

export default async function ProyectosPage() {
  const proyectos = await listExpedientesByFilter({ sector: "PRIVADO" });

  return (
    <AppShell
      title="Proyectos privados"
      subtitle="Expedientes de sector PRIVADO leídos desde Neon (sin datos inventados)."
    >
      <Glass className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[color-mix(in_srgb,var(--glass)_70%,transparent)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.map((p) => (
              <tr key={p.id} className="border-t border-[var(--glass-border)]">
                <td className="px-4 py-3">
                  <Link
                    href={`/app/comercial/${p.id}`}
                    className="font-medium text-[var(--accent)]"
                  >
                    {p.codigo}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.titulo}</td>
                <td className="px-4 py-3">{p.empresaCodigo}</td>
                <td className="px-4 py-3">{p.clienteNombre ?? "—"}</td>
                <td className="px-4 py-3">
                  {ESTATUS_LABEL[p.estatus as EstatusExpediente] ?? p.estatus}
                </td>
              </tr>
            ))}
            {proyectos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  No hay proyectos privados. Crea un expediente PRIVADO en Comercial.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Glass>
    </AppShell>
  );
}
