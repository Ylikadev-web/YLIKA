import { Glass } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { upsertPartidaRelacionAction } from "@/app/app/actions-modules";
import { TIPO_PROVEEDOR_LABEL, type TipoProveedor } from "@/lib/domain/proveedores";

type Partida = {
  id: string;
  numero: number;
  descripcion: string;
  marcaSolicitada: string | null;
};

type Relacion = {
  id: string;
  partidaId: string;
  proveedorId: string | null;
  marcaId: string | null;
  marcaTexto: string | null;
  origen: string;
  notas: string | null;
  proveedorNombre: string | null;
  proveedorTipo: string | null;
  marcaNombre: string | null;
};

type Proveedor = {
  id: string;
  razonSocial: string;
  tipo: string;
  preferido: boolean;
};

type Marca = {
  id: string;
  nombre: string;
};

export function RelacionesPanel({
  expedienteId,
  partidas,
  relaciones,
  proveedores,
  marcas,
}: {
  expedienteId: string;
  partidas: Partida[];
  relaciones: Relacion[];
  proveedores: Proveedor[];
  marcas: Marca[];
}) {
  const byPartida = new Map(relaciones.map((r) => [r.partidaId, r]));

  return (
    <Glass className="mb-4 overflow-hidden">
      <div className="border-b border-[var(--glass-border)] px-5 py-4">
        <h3 className="display text-lg font-semibold">Relaciones</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Proveedor y marca asignados a cada partida. Se llenan solos al elegir
          en Comparativo; aquí puedes ajustar a mano.
        </p>
      </div>

      {partidas.length === 0 ? (
        <p className="px-5 py-6 text-sm text-[var(--text-muted)]">
          Sin partidas todavía.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--glass-border)]">
          {partidas.map((p) => {
            const rel = byPartida.get(p.id);
            return (
              <li key={p.id} className="px-5 py-4">
                <div className="mb-3 flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-semibold text-[var(--accent)]">
                    #{p.numero}
                  </span>
                  <span className="text-sm font-medium">{p.descripcion}</span>
                  {rel?.origen === "COMPARATIVO" && (
                    <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                      auto · comparativo
                    </span>
                  )}
                </div>

                {rel?.proveedorNombre && (
                  <p className="mb-2 text-xs text-[var(--text-muted)]">
                    Actual:{" "}
                    <span className="text-[var(--text)]">
                      {rel.proveedorNombre}
                    </span>
                    {rel.proveedorTipo
                      ? ` · ${TIPO_PROVEEDOR_LABEL[rel.proveedorTipo as TipoProveedor] ?? rel.proveedorTipo}`
                      : ""}
                    {rel.marcaNombre || rel.marcaTexto
                      ? ` · marca ${rel.marcaNombre ?? rel.marcaTexto}`
                      : p.marcaSolicitada
                        ? ` · solicita ${p.marcaSolicitada}`
                        : ""}
                  </p>
                )}

                <form
                  action={upsertPartidaRelacionAction}
                  className="grid gap-2 md:grid-cols-4"
                >
                  <input type="hidden" name="expedienteId" value={expedienteId} />
                  <input type="hidden" name="partidaId" value={p.id} />
                  <label className="text-xs md:col-span-2">
                    Proveedor
                    <select
                      name="proveedorId"
                      defaultValue={rel?.proveedorId ?? ""}
                      className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm"
                    >
                      <option value="">— Sin asignar —</option>
                      {proveedores.map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {pr.preferido ? "★ " : ""}
                          {pr.razonSocial} (
                          {TIPO_PROVEEDOR_LABEL[pr.tipo as TipoProveedor] ??
                            pr.tipo}
                          )
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs">
                    Marca catálogo
                    <select
                      name="marcaId"
                      defaultValue={rel?.marcaId ?? ""}
                      className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {marcas.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs">
                    Marca texto
                    <input
                      name="marcaTexto"
                      defaultValue={
                        rel?.marcaTexto ?? p.marcaSolicitada ?? ""
                      }
                      placeholder="ej. Honeywell"
                      className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="md:col-span-4">
                    <Button type="submit" size="sm" variant="glass">
                      Guardar relación
                    </Button>
                  </div>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </Glass>
  );
}
