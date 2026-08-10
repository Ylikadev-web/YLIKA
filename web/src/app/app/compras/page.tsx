import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Glass } from "@/components/ui/glass";
import { CatalogoProveedores } from "@/components/compras/catalogo-proveedores";
import { ComprasAltaToolbar } from "@/components/compras/compras-alta-toolbar";
import {
  listCotizacionesCompras,
  listMarcas,
  listProveedoresCatalogo,
} from "@/lib/db/queries-modules";
import { TIPO_PROVEEDOR_LABEL } from "@/lib/domain/proveedores";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const [proveedores, cotizaciones, marcas] = await Promise.all([
    listProveedoresCatalogo(),
    listCotizacionesCompras(),
    listMarcas(),
  ]);

  return (
    <AppShell title="Compras · Catálogo">
      <ComprasAltaToolbar marcas={marcas} />

      <div className="grid gap-4 lg:grid-cols-2">
        <CatalogoProveedores proveedores={proveedores} />

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
                      {c.proveedorTipo
                        ? ` · ${TIPO_PROVEEDOR_LABEL[c.proveedorTipo as keyof typeof TIPO_PROVEEDOR_LABEL] ?? c.proveedorTipo}`
                        : ""}
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
                Aún no hay cotizaciones. Créalas desde un expediente en
                Comparativo.
              </li>
            )}
          </ul>
        </Glass>
      </div>
    </AppShell>
  );
}
