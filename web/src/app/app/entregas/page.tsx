import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import {
  listExpedientesParaRemision,
  listRemisiones,
} from "@/lib/db/queries-modules";
import {
  createRemisionAction,
  marcarRemisionEntregadaAction,
} from "../actions-modules";

export const dynamic = "force-dynamic";

export default async function EntregasPage() {
  const [remisiones, expedientes] = await Promise.all([
    listRemisiones(),
    listExpedientesParaRemision(),
  ]);

  return (
    <AppShell
      title="Entregas / Remisiones"
    >
      <Glass className="mb-4 p-5">
        <h2 className="display text-lg font-semibold">Nueva remisión</h2>
        {expedientes.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            No hay expedientes elegibles. Avanza un expediente ganado primero.
          </p>
        ) : (
          <form action={createRemisionAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              Expediente
              <select
                name="expedienteId"
                required
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
              >
                {expedientes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.codigo} — {e.titulo} ({e.estatus})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Destinatario
              <input
                name="destinatario"
                required
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Dirección
              <input
                name="direccionEntrega"
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              Notas
              <textarea
                name="notas"
                rows={2}
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </label>
            <div>
              <Button type="submit">Crear remisión</Button>
            </div>
          </form>
        )}
      </Glass>

      <Glass className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[color-mix(in_srgb,var(--glass)_70%,transparent)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Folio</th>
              <th className="px-4 py-3">Expediente</th>
              <th className="px-4 py-3">Destinatario</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {remisiones.map((r) => (
              <tr key={r.id} className="border-t border-[var(--glass-border)]">
                <td className="px-4 py-3 font-medium">{r.folio}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/app/comercial/${r.expedienteId}`}
                    className="text-[var(--accent)]"
                  >
                    {r.expedienteCodigo}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.destinatario}</td>
                <td className="px-4 py-3">{r.estatus}</td>
                <td className="px-4 py-3 text-right">
                  {r.estatus !== "ENTREGADA" && r.estatus !== "CANCELADA" ? (
                    <form action={marcarRemisionEntregadaAction}>
                      <input type="hidden" name="remisionId" value={r.id} />
                      <Button type="submit" variant="glass" size="sm">
                        Marcar entregada
                      </Button>
                    </form>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">OK</span>
                  )}
                </td>
              </tr>
            ))}
            {remisiones.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  Sin remisiones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Glass>
    </AppShell>
  );
}
