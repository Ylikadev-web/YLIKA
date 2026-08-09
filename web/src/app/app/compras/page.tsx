import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { CatalogoProveedores } from "@/components/compras/catalogo-proveedores";
import {
  listCotizacionesCompras,
  listMarcas,
  listProveedoresCatalogo,
} from "@/lib/db/queries-modules";
import {
  ESPECIALIDADES_SUGERIDAS,
  TIPOS_PROVEEDOR,
  TIPO_PROVEEDOR_LABEL,
} from "@/lib/domain/proveedores";
import {
  createMarcaAction,
  createProveedorAction,
} from "../actions-modules";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  const [proveedores, cotizaciones, marcas] = await Promise.all([
    listProveedoresCatalogo(),
    listCotizacionesCompras(),
    listMarcas(),
  ]);

  return (
    <AppShell title="Compras · Catálogo">
      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Glass className="p-5">
          <h2 className="display text-lg font-semibold">Alta de proveedor</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Clasifica por tipo, especialidad, zona, marcas y preferencia.
          </p>
          <form
            action={createProveedorAction}
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
              Alias corto
              <input
                name="aliasCorto"
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
              Tipo
              <select
                name="tipo"
                defaultValue="MATERIALES"
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
              >
                {TIPOS_PROVEEDOR.map((t) => (
                  <option key={t} value={t}>
                    {TIPO_PROVEEDOR_LABEL[t]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Zona cobertura
              <input
                name="zonaCobertura"
                placeholder="CDMX / Bajío / Nacional"
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </label>
            <label className="text-sm md:col-span-2">
              Especialidades (coma)
              <input
                name="especialidades"
                list="esp-sugeridas"
                placeholder={ESPECIALIDADES_SUGERIDAS.slice(0, 4).join(", ")}
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
              <datalist id="esp-sugeridas">
                {ESPECIALIDADES_SUGERIDAS.map((e) => (
                  <option key={e} value={e} />
                ))}
              </datalist>
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
              Calificación (1–5)
              <input
                name="calificacion"
                type="number"
                min={1}
                max={5}
                defaultValue={3}
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </label>
            {marcas.length > 0 && (
              <fieldset className="md:col-span-2">
                <legend className="text-sm">Marcas que maneja</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {marcas.map((m) => (
                    <label
                      key={m.id}
                      className="glass-thin flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 text-xs"
                    >
                      <input type="checkbox" name="marcaIds" value={m.id} />
                      {m.nombre}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input type="checkbox" name="preferido" />
              Proveedor preferido
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Guardar proveedor</Button>
            </div>
          </form>
        </Glass>

        <Glass className="p-5">
          <h2 className="display text-lg font-semibold">Marcas</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Catálogo transversal para Relaciones y filtros.
          </p>
          <form action={createMarcaAction} className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm sm:col-span-2">
              Nombre
              <input
                name="nombre"
                required
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </label>
            <label className="text-sm">
              Categoría
              <input
                name="categoria"
                defaultValue="GENERAL"
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </label>
            <div className="sm:col-span-3">
              <Button type="submit" variant="glass">
                Agregar marca
              </Button>
            </div>
          </form>
          <ul className="mt-4 flex flex-wrap gap-2">
            {marcas.map((m) => (
              <li
                key={m.id}
                className="glass-thin rounded-2xl px-2.5 py-1 text-xs"
              >
                {m.nombre}
                <span className="ml-1 text-[var(--text-muted)]">
                  · {m.categoria}
                </span>
              </li>
            ))}
            {marcas.length === 0 && (
              <li className="text-sm text-[var(--text-muted)]">
                Aún no hay marcas. Agrega Honeywell, Schneider, etc.
              </li>
            )}
          </ul>
        </Glass>
      </div>

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
