import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import {
  listCotizacionesCompras,
  listProveedores,
} from "@/lib/db/queries-modules";
import { createProveedorAction } from "../actions-modules";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const [proveedores, cotizaciones] = await Promise.all([
    listProveedores(),
    listCotizacionesCompras(),
  ]);

  return (
    <AppShell
      title="Compras"
    >
      <Glass className="mb-4 p-5">
        <h2 className="display text-lg font-semibold">Alta de proveedor</h2>
        <form action={createProveedorAction} className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="text-sm md:col-span-2">
            Razón social
            <input
              name="razonSocial"
              required
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
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
          <div className="md:col-span-3">
            <Button type="submit">Guardar proveedor</Button>
          </div>
        </form>
      </Glass>

      <div className="grid gap-4 lg:grid-cols-2">
        <Glass className="overflow-hidden">
          <div className="border-b border-[var(--glass-border)] px-4 py-3 text-sm font-semibold">
            Proveedores ({proveedores.length})
          </div>
          <ul className="divide-y divide-[var(--glass-border)] text-sm">
            {proveedores.map((p) => (
              <li key={p.id} className="px-4 py-3">
                <p className="font-medium">{p.razonSocial}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {p.rfc ?? "Sin RFC"} · {p.contactoEmail ?? "Sin email"}
                </p>
              </li>
            ))}
            {proveedores.length === 0 && (
              <li className="px-4 py-6 text-[var(--text-muted)]">Sin proveedores.</li>
            )}
          </ul>
        </Glass>

        <Glass className="overflow-hidden">
          <div className="border-b border-[var(--glass-border)] px-4 py-3 text-sm font-semibold">
            Cotizaciones de compra ({cotizaciones.length})
          </div>
          <ul className="divide-y divide-[var(--glass-border)] text-sm">
            {cotizaciones.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {c.alias} · {c.proveedorNombre}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {c.expedienteCodigo} · {c.empresaCodigo} · {c.estatus}
                      {c.fecha
                        ? ` · ${c.fecha.toLocaleDateString("es-MX")}`
                        : ""}
                    </p>
                  </div>
                  <Link
                    href={`/app/comercial/${c.expedienteId}`}
                    className="text-xs font-medium text-[var(--accent)]"
                  >
                    Ver
                  </Link>
                </div>
              </li>
            ))}
            {cotizaciones.length === 0 && (
              <li className="px-4 py-6 text-[var(--text-muted)]">
                Aún no hay cotizaciones. Créalas desde un expediente en Comparativo.
              </li>
            )}
          </ul>
        </Glass>
      </div>
    </AppShell>
  );
}
