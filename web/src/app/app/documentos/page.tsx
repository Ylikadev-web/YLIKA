import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { listDocumentosExpediente } from "@/lib/db/queries-modules";
import { registerDocumentoMetaAction } from "../actions-modules";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  const docs = await listDocumentosExpediente();

  return (
    <AppShell
      title="Documentos"
    >
      <Glass className="mb-4 p-5">
        <h2 className="display text-lg font-semibold">Registrar documento (metadata)</h2>
        <form action={registerDocumentoMetaAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Nombre
            <input
              name="nombre"
              required
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Tipo
            <select
              name="tipo"
              defaultValue="OTRO"
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            >
              <option value="OTRO">OTRO</option>
              <option value="BASE_LICITACION">BASE_LICITACION</option>
              <option value="COTIZACION_PROVEEDOR">COTIZACION_PROVEEDOR</option>
              <option value="COTIZACION_FINAL">COTIZACION_FINAL</option>
              <option value="PROPUESTA_ECONOMICA">PROPUESTA_ECONOMICA</option>
              <option value="PROPUESTA_TECNICA">PROPUESTA_TECNICA</option>
              <option value="REMISION">REMISION</option>
              <option value="FACTURA">FACTURA</option>
              <option value="CONTRATO">CONTRATO</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <Button type="submit">Registrar</Button>
          </div>
        </form>
      </Glass>

      <Glass className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[color-mix(in_srgb,var(--glass)_70%,transparent)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Expediente</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-t border-[var(--glass-border)]">
                <td className="px-4 py-3 font-medium">
                  {d.storagePath?.startsWith("http") ? (
                    <a
                      href={d.storagePath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--accent)]"
                    >
                      {d.nombre}
                    </a>
                  ) : (
                    d.nombre
                  )}
                </td>
                <td className="px-4 py-3">{d.tipo}</td>
                <td className="px-4 py-3">
                  {d.expedienteId && d.expedienteCodigo ? (
                    <Link
                      href={`/app/comercial/${d.expedienteId}`}
                      className="text-[var(--accent)]"
                    >
                      {d.expedienteCodigo}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                  {d.createdAt.toLocaleDateString("es-MX")}
                </td>
              </tr>
            ))}
            {docs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  Sin documentos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Glass>
    </AppShell>
  );
}
