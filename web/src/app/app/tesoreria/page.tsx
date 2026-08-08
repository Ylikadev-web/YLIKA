import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import {
  getModuloBolsa,
  listExpedientesByFilter,
  listRemisiones,
} from "@/lib/db/queries-modules";
import { updateBolsaUrlAction } from "../actions-modules";

export const dynamic = "force-dynamic";

export default async function TesoreriaPage() {
  const [remisiones, cobranza, bolsa] = await Promise.all([
    listRemisiones(),
    listExpedientesByFilter({
      estatusIn: ["COBRANZA", "ENTREGA", "CERRADO"],
    }),
    getModuloBolsa(),
  ]);

  const entregadas = remisiones.filter((r) => r.estatus === "ENTREGADA");
  const pendientes = remisiones.filter(
    (r) => r.estatus === "EMITIDA" || r.estatus === "EN_TRANSITO",
  );

  return (
    <AppShell
      title="Tesorería / Cobranza"
      subtitle="Cobranza desde remisiones entregadas. La Administración de Bolsa se embebe con su URL de despliegue."
    >
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Glass className="p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Remisiones entregadas
          </p>
          <p className="mt-1 text-3xl font-semibold">{entregadas.length}</p>
        </Glass>
        <Glass className="p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            En tránsito / emitidas
          </p>
          <p className="mt-1 text-3xl font-semibold">{pendientes.length}</p>
        </Glass>
        <Glass className="p-5">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
            Expedientes en cobranza
          </p>
          <p className="mt-1 text-3xl font-semibold">
            {cobranza.filter((c) => c.estatus === "COBRANZA").length}
          </p>
        </Glass>
      </div>

      <Glass className="mb-4 overflow-hidden">
        <div className="border-b border-[var(--glass-border)] px-4 py-3 text-sm font-semibold">
          Pipeline financiero
        </div>
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
            {cobranza.map((c) => (
              <tr key={c.id} className="border-t border-[var(--glass-border)]">
                <td className="px-4 py-3">
                  <Link
                    href={`/app/comercial/${c.id}`}
                    className="font-medium text-[var(--accent)]"
                  >
                    {c.codigo}
                  </Link>
                </td>
                <td className="px-4 py-3">{c.titulo}</td>
                <td className="px-4 py-3">{c.empresaCodigo}</td>
                <td className="px-4 py-3">{c.clienteNombre ?? "—"}</td>
                <td className="px-4 py-3">{c.estatus}</td>
              </tr>
            ))}
            {cobranza.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  Sin cobranza aún. Marca una remisión como entregada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Glass>

      <Glass className="p-5">
        <h2 className="display text-lg font-semibold">Administración de Bolsa</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Repo:{" "}
          <a
            href="https://github.com/Ylikadev-web/Administraci-n-de-Bolsa"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent)]"
          >
            Ylikadev-web/Administraci-n-de-Bolsa
          </a>
          . Pega la URL pública para embeberla aquí.
        </p>
        <form action={updateBolsaUrlAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            name="url"
            defaultValue={bolsa?.url ?? ""}
            placeholder="https://tu-bolsa.vercel.app"
            className="w-full flex-1 rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm"
          />
          <Button type="submit">Guardar URL</Button>
        </form>
        {bolsa?.url ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--glass-border)]">
            <iframe
              title="Administración de Bolsa"
              src={bolsa.url}
              className="h-[480px] w-full bg-white"
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Sin URL configurada. Mientras tanto usa cobranza nativa arriba.
          </p>
        )}
      </Glass>
    </AppShell>
  );
}
