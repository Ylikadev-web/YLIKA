import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { listExpedientesByFilter } from "@/lib/db/queries-modules";
import { ESTATUS_LABEL, type EstatusExpediente } from "@/lib/domain/workflow";
import {
  enviarADirectorAction,
  marcarEnviadaAction,
} from "@/app/app/comercial/actions";

export const dynamic = "force-dynamic";

export default async function PropuestasPage() {
  const [paraItza, paraNesim, enviadas] = await Promise.all([
    listExpedientesByFilter({ estatusIn: ["PROPUESTA_ADMIN"] }),
    listExpedientesByFilter({ estatusIn: ["REVISION_DIRECTOR"] }),
    listExpedientesByFilter({ estatusIn: ["ENVIADA"] }),
  ]);

  return (
    <AppShell
      title="Propuestas"
      actions={
        <span className="text-xs text-[var(--text-muted)]">
          Itza → Nesim
        </span>
      }
    >
      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">Cola Itza · propuesta admin</h2>
          <span className="text-xs text-[var(--text-muted)]">
            {paraItza.length}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {paraItza.map((e) => (
            <Glass key={e.id} className="float-card nav-pending relative p-4">
              <span className="pending-glow-ring absolute inset-0 rounded-[inherit]" />
              <div className="relative z-[1]">
                <p className="text-[11px] text-[var(--text-muted)]">
                  {e.codigo} · {e.empresaCodigo}
                </p>
                <p className="mt-1 text-sm font-semibold">{e.titulo}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {e.clienteNombre ?? "Sin cliente"} ·{" "}
                  {ESTATUS_LABEL[e.estatus as EstatusExpediente] ?? e.estatus}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/app/comercial/${e.id}`}>
                    <Button size="sm" variant="glass">
                      Abrir
                    </Button>
                  </Link>
                  <form action={enviarADirectorAction}>
                    <input type="hidden" name="expedienteId" value={e.id} />
                    <Button type="submit" size="sm">
                      Listo → Nesim
                    </Button>
                  </form>
                </div>
              </div>
            </Glass>
          ))}
          {paraItza.length === 0 && (
            <Glass className="col-span-full p-6 text-center text-sm text-[var(--text-muted)]">
              Vacío. Cuando Ventas pulse “Pasar a Itza”, aparecen aquí.
            </Glass>
          )}
        </div>
      </section>

      <section className="mb-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold">Cola Nesim · director</h2>
          <span className="text-xs text-[var(--text-muted)]">
            {paraNesim.length}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {paraNesim.map((e) => (
            <Glass key={e.id} className="float-card p-4">
              <p className="text-[11px] text-[var(--text-muted)]">
                {e.codigo} · {e.empresaCodigo}
              </p>
              <p className="mt-1 text-sm font-semibold">{e.titulo}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/app/comercial/${e.id}`}>
                  <Button size="sm" variant="glass">
                    Revisar
                  </Button>
                </Link>
                <form action={marcarEnviadaAction}>
                  <input type="hidden" name="expedienteId" value={e.id} />
                  <Button type="submit" size="sm" variant="accent">
                    Enviar propuesta
                  </Button>
                </form>
              </div>
            </Glass>
          ))}
          {paraNesim.length === 0 && (
            <Glass className="col-span-full p-6 text-center text-sm text-[var(--text-muted)]">
              Nada en revisión del director.
            </Glass>
          )}
        </div>
      </section>

      {enviadas.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-semibold">
            Enviadas · esperando fallo
          </h2>
          <ul className="space-y-2">
            {enviadas.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/app/comercial/${e.id}`}
                  className="glass-thin flex items-center justify-between rounded-2xl px-4 py-3 text-sm"
                >
                  <span>
                    {e.codigo} · {e.titulo}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">ENVIADA</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
