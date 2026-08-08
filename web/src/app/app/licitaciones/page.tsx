import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import {
  luzVerdeAction,
  noParticipamosAction,
  upsertDocumentoEmpresaAction,
} from "@/app/app/comercial/actions";
import {
  calcEstadoDoc,
  listDocumentosEmpresa,
  listEmpresas,
  listExpedientes,
} from "@/lib/db/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LicitacionesPage() {
  const [docs, empresas, expedientes] = await Promise.all([
    listDocumentosEmpresa(),
    listEmpresas(),
    listExpedientes(),
  ]);

  const enRevision = expedientes.filter(
    (e) => e.estatus === "REVISION_REQUISITOS",
  );

  async function addDoc(formData: FormData) {
    "use server";
    await upsertDocumentoEmpresaAction(formData);
  }

  return (
    <AppShell
      title="Licitaciones"
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <Glass className="p-5">
          <h2 className="display text-lg font-semibold">
            Documentos por empresa
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Semáforo recalculado por fecha de vencimiento (Neon).
          </p>
          <ul className="mt-4 space-y-2">
            {docs.length === 0 ? (
              <li className="text-sm text-[var(--text-muted)]">
                Sin documentos. Agrega el primero abajo.
              </li>
            ) : (
              docs.map((d) => {
                const estado = calcEstadoDoc(d.fechaVencimiento);
                return (
                  <li
                    key={d.id}
                    className="glass-thin flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{d.nombre}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {d.empresaCodigo} · vence{" "}
                        {d.fechaVencimiento
                          ? new Date(d.fechaVencimiento).toLocaleDateString(
                              "es-MX",
                            )
                          : "—"}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                        estado === "VIGENTE" &&
                          "bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[var(--accent)]",
                        estado === "POR_VENCER" &&
                          "bg-[color-mix(in_srgb,var(--accent-2)_25%,transparent)] text-[var(--accent-2)]",
                        estado === "VENCIDO" &&
                          "bg-[color-mix(in_srgb,var(--danger)_20%,transparent)] text-[var(--danger)]",
                        estado === "NO_APLICA" &&
                          "bg-[color-mix(in_srgb,var(--text)_10%,transparent)] text-[var(--text-muted)]",
                      )}
                    >
                      {estado.replace("_", " ")}
                    </span>
                  </li>
                );
              })
            )}
          </ul>

          <form action={addDoc} className="mt-5 space-y-2 border-t border-[var(--glass-border)] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Alta documento
            </p>
            <select
              name="empresaId"
              required
              className="glass-thin h-10 w-full rounded-2xl px-3 text-sm"
              defaultValue={empresas.find((e) => e.codigo === "MONE")?.id}
            >
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.codigo}
                </option>
              ))}
            </select>
            <input
              name="nombre"
              required
              placeholder="Nombre del documento"
              className="glass-thin h-10 w-full rounded-2xl px-3 text-sm outline-none"
            />
            <input
              name="categoria"
              placeholder="Categoría (FISCAL, LEGAL…)"
              className="glass-thin h-10 w-full rounded-2xl px-3 text-sm outline-none"
            />
            <input
              type="date"
              name="fechaVencimiento"
              className="glass-thin h-10 w-full rounded-2xl px-3 text-sm outline-none"
            />
            <Button type="submit" variant="glass" className="w-full">
              Guardar en Neon
            </Button>
          </form>
        </Glass>

        <Glass className="p-5">
          <h2 className="display text-lg font-semibold">
            En revisión de requisitos
          </h2>
          <ul className="mt-4 space-y-3">
            {enRevision.length === 0 ? (
              <li className="text-sm text-[var(--text-muted)]">
                No hay expedientes en REVISION_REQUISITOS.
              </li>
            ) : (
              enRevision.map((e) => (
                <li key={e.id} className="glass-thin rounded-2xl px-4 py-3">
                  <Link
                    href={`/app/comercial/${e.id}`}
                    className="text-sm font-semibold hover:text-[var(--accent)]"
                  >
                    {e.codigo}
                  </Link>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {e.titulo}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form
                      action={async () => {
                        "use server";
                        await luzVerdeAction(e.id, true);
                      }}
                    >
                      <Button type="submit" size="sm" variant="accent">
                        Luz verde · ordenar cotizar
                      </Button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await noParticipamosAction(e.id);
                      }}
                    >
                      <Button type="submit" size="sm" variant="danger">
                        No participamos
                      </Button>
                    </form>
                  </div>
                </li>
              ))
            )}
          </ul>
        </Glass>
      </div>
    </AppShell>
  );
}
