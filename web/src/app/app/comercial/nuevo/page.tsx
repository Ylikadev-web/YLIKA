import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { createExpedienteAction } from "@/app/app/comercial/actions";
import { listEmpresas, listTiposSolicitud } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function NuevaSolicitudPage() {
  const [empresas, tiposGob, tiposPriv] = await Promise.all([
    listEmpresas(),
    listTiposSolicitud("GOBIERNO"),
    listTiposSolicitud("PRIVADO"),
  ]);

  async function create(formData: FormData) {
    "use server";
    const result = await createExpedienteAction(formData);
    redirect(`/app/comercial/${result.id}`);
  }

  return (
    <AppShell
      title="Nueva solicitud"
      subtitle="Crea expediente real en Neon con folio YLK-EMPRESA-AÑO-#####."
    >
      <Glass className="max-w-xl p-6">
        <form action={create} className="space-y-4">
          <label className="block">
            <span className="text-xs text-[var(--text-muted)]">Empresa</span>
            <select
              name="empresaId"
              required
              className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm"
              defaultValue={empresas.find((e) => e.codigo === "MONE")?.id}
            >
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.codigo} — {e.razonSocial}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-xs text-[var(--text-muted)]">Sector</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <label className="glass-thin flex items-center gap-2 rounded-2xl px-3 py-3 text-sm">
                <input
                  type="radio"
                  name="sector"
                  value="GOBIERNO"
                  defaultChecked
                />
                Gobierno
              </label>
              <label className="glass-thin flex items-center gap-2 rounded-2xl px-3 py-3 text-sm">
                <input type="radio" name="sector" value="PRIVADO" />
                Privado
              </label>
            </div>
          </fieldset>

          <label className="block">
            <span className="text-xs text-[var(--text-muted)]">
              Tipo de solicitud
            </span>
            <select
              name="tipoSolicitudId"
              required
              className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm"
            >
              <optgroup label="Gobierno">
                {tiposGob.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Privado">
                {tiposPriv.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-[var(--text-muted)]">Título</span>
            <input
              name="titulo"
              required
              className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm outline-none"
              placeholder="Ej. Suministro válvulas IMSS"
            />
          </label>

          <label className="block">
            <span className="text-xs text-[var(--text-muted)]">
              Cliente / convocante
            </span>
            <input
              name="clienteNombre"
              className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm outline-none"
              placeholder="IMSS Delegación…"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-[var(--text-muted)]">
                Folio CompraNet
              </span>
              <input
                name="folioExterno"
                className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[var(--text-muted)]">Carácter</span>
              <select
                name="caracter"
                className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm"
              >
                <option value="Nacional">Nacional</option>
                <option value="Internacional">Internacional</option>
                <option value="">N/A</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link href="/app/comercial">
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </Link>
            <Button type="submit">Crear expediente</Button>
          </div>
        </form>
      </Glass>
    </AppShell>
  );
}
