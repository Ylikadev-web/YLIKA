import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { listClientes } from "@/lib/db/queries-modules";
import { createClienteAction } from "../actions-modules";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clientes = await listClientes();

  return (
    <AppShell title="Clientes">
      <Glass className="mb-4 p-5">
        <h2 className="display text-lg font-semibold">Nuevo cliente</h2>
        <form
          action={createClienteAction}
          className="mt-4 grid gap-3 md:grid-cols-2"
        >
          <label className="text-sm md:col-span-2">
            Razón social
            <input
              name="razonSocial"
              required
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Tipo
            <select
              name="tipo"
              defaultValue="PRIVADO"
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            >
              <option value="PRIVADO">PRIVADO</option>
              <option value="GOBIERNO">GOBIERNO</option>
            </select>
          </label>
          <label className="text-sm">
            RFC
            <input
              name="rfc"
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Contacto
            <input
              name="contactoNombre"
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Email
            <input
              name="contactoEmail"
              type="email"
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Teléfono
            <input
              name="contactoTel"
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Dependencia
            <input
              name="dependencia"
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </label>
          <div className="md:col-span-2">
            <Button type="submit">Guardar cliente</Button>
          </div>
        </form>
      </Glass>

      <Glass className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[color-mix(in_srgb,var(--glass)_70%,transparent)] text-xs uppercase tracking-wide text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3">Razón social</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">RFC</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-t border-[var(--glass-border)]">
                <td className="px-4 py-3 font-medium">{c.razonSocial}</td>
                <td className="px-4 py-3">{c.tipo}</td>
                <td className="px-4 py-3">{c.rfc ?? "—"}</td>
                <td className="px-4 py-3">{c.contactoNombre ?? "—"}</td>
                <td className="px-4 py-3">{c.contactoEmail ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/app/clientes/${c.id}`}
                    className="text-xs font-medium text-[var(--accent)]"
                  >
                    Historial →
                  </Link>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[var(--text-muted)]"
                >
                  Sin clientes. Crea el primero arriba.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Glass>
    </AppShell>
  );
}
