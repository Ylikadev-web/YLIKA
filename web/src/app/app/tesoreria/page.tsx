import Link from "next/link";
import { Key, Lock, Plus, Users, Wallet } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import {
  COLORES_BOLSA,
  ensureBolsaGeneral,
  isBolsaAdmin,
  listBolsasForUser,
  listPendientesAprobacion,
  listPrestamosActivos,
} from "@/lib/db/bolsa";
import { listCajaChicaPorComprobar } from "@/lib/db/caja-chica";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { formatMoney } from "@/lib/utils";
import {
  aprobarMovimientoAction,
  asignarBolsaAction,
  bootstrapBolsaGeneralAction,
  comprobarCajaChicaTesoreriaAction,
  crearBolsaPropiaAction,
  rechazarCajaChicaTesoreriaAction,
  rechazarMovimientoAction,
} from "./actions";

export const dynamic = "force-dynamic";

async function resolveUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  let userId = session.user.id;
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  if (userId === "demo-miguel") {
    const db = getDb();
    const [u] = await db
      .select({ id: s.users.id })
      .from(s.users)
      .where(eq(s.users.email, "miguel@ylika.local"))
      .limit(1);
    userId = u?.id ?? userId;
  }
  return { userId, roles, name: session.user.name ?? "Usuario" };
}

export default async function TesoreriaPage() {
  const user = await resolveUser();
  if (!user) {
    return (
      <AppShell title="Bolsa">
        <Glass className="p-6 text-sm text-[var(--text-muted)]">Inicia sesión.</Glass>
      </AppShell>
    );
  }

  if (isBolsaAdmin(user.roles)) {
    await ensureBolsaGeneral(user.userId);
  }

  const canFinance =
    user.roles.includes("ADMIN_FINANZAS") ||
    user.roles.includes("DIRECTOR") ||
    user.roles.includes("ADMIN_SISTEMAS");

  const [bolsas, pendientes, prestamos, team, cajaPorComprobar] =
    await Promise.all([
      listBolsasForUser(user.userId, user.roles),
      isBolsaAdmin(user.roles) ? listPendientesAprobacion() : Promise.resolve([]),
      listPrestamosActivos(user.userId),
      getDb()
        .select({ id: s.users.id, name: s.users.name, email: s.users.email })
        .from(s.users),
      canFinance ? listCajaChicaPorComprobar(20) : Promise.resolve([]),
    ]);

  const admin = isBolsaAdmin(user.roles);

  return (
    <AppShell
      title="Bolsa"
      actions={
        <form action={crearBolsaPropiaAction} className="flex flex-wrap items-end gap-2">
          <input
            name="nombre"
            required
            placeholder="Nueva bolsa"
            className="glass-thin h-10 w-40 rounded-2xl px-3 text-sm sm:w-48"
          />
          <input type="hidden" name="color" value={COLORES_BOLSA[1]} />
          <input
            name="saldoInicial"
            type="number"
            min="0"
            step="0.01"
            placeholder="Saldo"
            className="glass-thin h-10 w-24 rounded-2xl px-3 text-sm"
          />
          <Button type="submit" size="sm">
            <Plus className="h-4 w-4" />
            Crear
          </Button>
        </form>
      }
    >
      {cajaPorComprobar.length > 0 && (
        <Glass className="mb-4 float-card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">
                Caja chica · por comprobar · {cajaPorComprobar.length}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Gastos de expediente · adjuntar comprobante en el expediente
              </p>
            </div>
          </div>
          <ul className="space-y-2">
            {cajaPorComprobar.map((m) => (
              <li
                key={m.id}
                className="glass-thin flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {formatMoney(Number(m.monto), m.moneda)} · {m.concepto}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    <Link
                      href={`/app/comercial/${m.expedienteId}?tab=checklist`}
                      className="underline-offset-2 hover:underline"
                    >
                      {m.expedienteCodigo}
                    </Link>
                    {" · "}
                    {m.solicitadoNombre ?? "—"}
                    {m.documentoNombre
                      ? ` · ${m.documentoNombre}`
                      : " · sin comprobante"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={comprobarCajaChicaTesoreriaAction}>
                    <input type="hidden" name="movimientoId" value={m.id} />
                    <input
                      type="hidden"
                      name="expedienteId"
                      value={m.expedienteId}
                    />
                    <Button type="submit" size="sm" variant="accent">
                      Comprobar
                    </Button>
                  </form>
                  <form
                    action={rechazarCajaChicaTesoreriaAction}
                    className="flex gap-1"
                  >
                    <input type="hidden" name="movimientoId" value={m.id} />
                    <input
                      type="hidden"
                      name="expedienteId"
                      value={m.expedienteId}
                    />
                    <input type="hidden" name="motivo" value="Rechazado" />
                    <Button type="submit" size="sm" variant="ghost">
                      Rechazar
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Glass>
      )}

      {pendientes.length > 0 && (
        <Glass className="mb-4 float-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">Por aprobar · {pendientes.length}</p>
          </div>
          <ul className="space-y-2">
            {pendientes.map((p) => (
              <li
                key={p.id}
                className="glass-thin flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {formatMoney(p.monto, p.moneda)} · {p.tipo}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {p.bolsaNombre} · {p.autorNombre}
                    {p.descripcion ? ` · ${p.descripcion}` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <form action={aprobarMovimientoAction}>
                    <input type="hidden" name="movimientoId" value={p.id} />
                    <Button type="submit" size="sm" variant="accent">
                      Aprobar
                    </Button>
                  </form>
                  <form action={rechazarMovimientoAction} className="flex gap-1">
                    <input type="hidden" name="movimientoId" value={p.id} />
                    <input type="hidden" name="motivo" value="Rechazado" />
                    <Button type="submit" size="sm" variant="ghost">
                      Rechazar
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Glass>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {bolsas.map((b, i) => (
          <Link
            key={b.id}
            href={`/app/tesoreria/bolsa/${b.id}`}
            className="float-card glass group relative overflow-hidden rounded-[28px] p-5 transition hover:-translate-y-0.5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: b.color }}
              aria-hidden
            />
            <div className="flex items-start gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-sm"
                style={{ background: b.color }}
              >
                {b.esGeneral ? (
                  <Users className="h-5 w-5" />
                ) : b.assignedByAdminId ? (
                  <Key className="h-5 w-5" />
                ) : (
                  <Wallet className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="truncate font-semibold">{b.nombre}</h2>
                  {b.esGeneral ? (
                    <Users className="h-3.5 w-3.5 text-[var(--accent-2)]" />
                  ) : b.assignedByAdminId ? (
                    <Key className="h-3.5 w-3.5 text-[var(--accent)]" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  )}
                </div>
                <p className="mt-2 display text-2xl font-semibold tracking-tight">
                  {formatMoney(b.saldo, b.moneda)}
                </p>
                {b.metaHabilitada && b.metaMonto ? (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text)_10%,transparent)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (b.saldo / Number(b.metaMonto)) * 100)}%`,
                        background: b.color,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
        {bolsas.length === 0 && (
          <Glass className="col-span-full p-8 text-center">
            <p className="text-sm text-[var(--text-muted)]">Sin bolsas aún</p>
            {admin && (
              <form action={bootstrapBolsaGeneralAction} className="mt-3">
                <Button type="submit" variant="glass">
                  Crear Bolsa General
                </Button>
              </form>
            )}
          </Glass>
        )}
      </div>

      {admin && (
        <Glass className="mt-4 float-card p-4">
          <p className="mb-3 text-sm font-semibold">Asignar bolsa</p>
          <form action={asignarBolsaAction} className="flex flex-wrap items-end gap-2">
            <input
              name="nombre"
              required
              placeholder="Nombre"
              className="glass-thin h-10 w-40 rounded-2xl px-3 text-sm"
            />
            <select
              name="asignadoId"
              required
              className="glass-thin h-10 rounded-2xl px-3 text-sm"
            >
              <option value="">Usuario</option>
              {team.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
            <input
              name="saldoInicial"
              type="number"
              min="0"
              step="0.01"
              placeholder="Saldo"
              className="glass-thin h-10 w-24 rounded-2xl px-3 text-sm"
            />
            <input type="hidden" name="color" value="#a855f7" />
            <Button type="submit" size="sm" variant="glass">
              Asignar
            </Button>
          </form>
        </Glass>
      )}

      {prestamos.length > 0 && (
        <Glass className="mt-4 float-card overflow-hidden">
          <div className="border-b border-[var(--glass-border)] px-4 py-3 text-sm font-semibold">
            Préstamos
          </div>
          <ul className="divide-y divide-[var(--glass-border)] text-sm">
            {prestamos.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="font-medium">{formatMoney(p.monto, p.moneda)}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {p.bolsaNombre}
                    {p.fechaVencimiento
                      ? ` · vence ${p.fechaVencimiento.toLocaleDateString("es-MX")}`
                      : ""}
                  </p>
                </div>
                <span className="text-xs text-[var(--text-muted)]">
                  {p.autorId === user.userId ? "Presté" : "Debo"}
                </span>
              </li>
            ))}
          </ul>
        </Glass>
      )}
    </AppShell>
  );
}
