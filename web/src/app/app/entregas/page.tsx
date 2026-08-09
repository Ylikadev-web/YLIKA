import Link from "next/link";
import { endOfMonth, startOfMonth, subMonths, addMonths } from "date-fns";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { EntregasCalendar } from "@/components/entregas/entregas-calendar";
import {
  listEntregasCalendario,
  listExpedientesParaRemision,
  listRemisiones,
} from "@/lib/db/queries-modules";
import {
  createRemisionAction,
  marcarRemisionEntregadaAction,
  updateRemisionProgramacionAction,
} from "../actions-modules";

export const dynamic = "force-dynamic";

export default async function EntregasPage() {
  const from = startOfMonth(subMonths(new Date(), 1));
  const to = endOfMonth(addMonths(new Date(), 2));
  const [remisiones, expedientes, calendarItems] = await Promise.all([
    listRemisiones(),
    listExpedientesParaRemision(),
    listEntregasCalendario(from, to),
  ]);

  return (
    <AppShell title="Entregas / Remisiones">
      <EntregasCalendar items={calendarItems} />

      <Glass className="mb-4 p-5">
        <h2 className="display text-lg font-semibold">Programar remisión</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Al crear, el expediente pasa a fase Entrega y aparece en el
          calendario.
        </p>
        {expedientes.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            No hay expedientes elegibles. Avanza un expediente ganado primero.
          </p>
        ) : (
          <form
            action={createRemisionAction}
            className="mt-4 grid gap-3 md:grid-cols-2"
          >
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
              Responsable entrega
              <input
                name="responsableEntrega"
                placeholder="Operaciones / transportista"
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
            <label className="text-sm">
              Fecha programada
              <input
                name="fechaProgramada"
                type="date"
                required
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
              <Button type="submit">Crear y calendizar</Button>
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
              <th className="px-4 py-3">Programada</th>
              <th className="px-4 py-3">Dónde / Con</th>
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
                  <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">
                    {r.titulo}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form
                    action={updateRemisionProgramacionAction}
                    className="flex flex-col gap-1"
                  >
                    <input type="hidden" name="remisionId" value={r.id} />
                    <input
                      type="date"
                      name="fechaProgramada"
                      defaultValue={
                        r.fechaProgramada
                          ? r.fechaProgramada.toISOString().slice(0, 10)
                          : ""
                      }
                      className="rounded-xl border border-[var(--glass-border)] bg-transparent px-2 py-1 text-xs"
                    />
                    <input
                      name="responsableEntrega"
                      defaultValue={r.responsableEntrega ?? ""}
                      placeholder="Responsable"
                      className="rounded-xl border border-[var(--glass-border)] bg-transparent px-2 py-1 text-xs"
                    />
                    <input
                      name="direccionEntrega"
                      defaultValue={r.direccionEntrega ?? ""}
                      placeholder="Dirección"
                      className="rounded-xl border border-[var(--glass-border)] bg-transparent px-2 py-1 text-xs"
                    />
                    <Button type="submit" size="sm" variant="ghost">
                      Actualizar
                    </Button>
                  </form>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                  {r.direccionEntrega ?? "—"}
                  <br />
                  {r.responsableEntrega ?? r.destinatario}
                </td>
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
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[var(--text-muted)]"
                >
                  Sin remisiones. Al pasar un expediente a Entrega se
                  calendiza automáticamente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Glass>
    </AppShell>
  );
}
