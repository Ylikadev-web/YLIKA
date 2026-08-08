import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Key, Lock, Users } from "lucide-react";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { getDb } from "@/lib/db";
import { getBolsaDetail, isBolsaAdmin, userIsMember } from "@/lib/db/bolsa";
import * as s from "@/lib/db/schema";
import { formatMoney, cn } from "@/lib/utils";
import {
  anularMovimientoAction,
  aprobarMovimientoAction,
  archivarBolsaAction,
  rechazarMovimientoAction,
  registrarMovimientoAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function BolsaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  let userId = session.user.id;
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  if (userId === "demo-miguel") {
    const db = getDb();
    const [u] = await db
      .select({ id: s.users.id })
      .from(s.users)
      .where(eq(s.users.email, "miguel@ylika.local"))
      .limit(1);
    if (u) userId = u.id;
  }

  const bolsa = await getBolsaDetail(id);
  if (!bolsa) notFound();

  const admin = isBolsaAdmin(roles);
  const member = await userIsMember(id, userId);
  if (!admin && !member && !bolsa.esGeneral) notFound();

  const puedeMover = admin || member;

  return (
    <AppShell
      title={bolsa.nombre}
      actions={
        <Link href="/app/tesoreria">
          <Button variant="glass" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Bolsas
          </Button>
        </Link>
      }
    >
      <Glass className="float-card mb-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-white"
              style={{ background: bolsa.color }}
            >
              {bolsa.esGeneral ? (
                <Users className="h-6 w-6" />
              ) : bolsa.assignedByAdminId ? (
                <Key className="h-6 w-6" />
              ) : (
                <Lock className="h-6 w-6" />
              )}
            </span>
            <div>
              <p className="text-xs text-[var(--text-muted)]">
                {bolsa.esGeneral
                  ? "General · requiere aprobación"
                  : bolsa.assignedByAdminId
                    ? "Asignada · solicita y espera"
                    : "Propia · libre"}
              </p>
              <p className="display mt-1 text-3xl font-semibold tracking-tight">
                {formatMoney(bolsa.saldo, bolsa.moneda)}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {bolsa.miembros.length} miembro(s)
              </p>
            </div>
          </div>
          {!bolsa.esGeneral && (bolsa.createdBy === userId || admin) && (
            <form action={archivarBolsaAction}>
              <input type="hidden" name="bolsaId" value={bolsa.id} />
              <Button type="submit" variant="ghost" size="sm">
                Archivar
              </Button>
            </form>
          )}
        </div>
      </Glass>

      {puedeMover && (
        <Glass className="float-card mb-4 p-4">
          <form action={registrarMovimientoAction} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="bolsaId" value={bolsa.id} />
            <select name="tipo" className="glass-thin h-10 rounded-2xl px-3 text-sm">
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
              <option value="aporte_enviado">Aporte enviado</option>
              <option value="aporte_recibido">Aporte recibido</option>
            </select>
            <input
              name="monto"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="Monto"
              className="glass-thin h-10 w-28 rounded-2xl px-3 text-sm"
            />
            <input
              name="descripcion"
              placeholder="Concepto"
              className="glass-thin h-10 min-w-[160px] flex-1 rounded-2xl px-3 text-sm"
            />
            <select name="naturaleza" className="glass-thin h-10 rounded-2xl px-3 text-sm">
              <option value="">—</option>
              <option value="prestamo">Préstamo</option>
              <option value="cooperacion">Cooperación</option>
              <option value="pago_deuda">Pago deuda</option>
              <option value="reembolso">Reembolso</option>
            </select>
            <select name="plazoDias" className="glass-thin h-10 rounded-2xl px-3 text-sm">
              <option value="">Plazo</option>
              <option value="7">7d</option>
              <option value="15">15d</option>
              <option value="30">30d</option>
              <option value="60">60d</option>
            </select>
            <Button type="submit" size="sm">
              Registrar
            </Button>
          </form>
        </Glass>
      )}

      <Glass className="float-card overflow-hidden">
        <div className="border-b border-[var(--glass-border)] px-4 py-3 text-sm font-semibold">
          Movimientos
        </div>
        <ul className="divide-y divide-[var(--glass-border)]">
          {bolsa.movimientos.map((m) => {
            const sign =
              m.tipo === "gasto" || m.tipo === "aporte_enviado" ? -1 : 1;
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    <span
                      className={cn(
                        sign < 0 ? "text-[var(--danger)]" : "text-[var(--accent)]",
                      )}
                    >
                      {sign < 0 ? "−" : "+"}
                      {formatMoney(m.monto, m.moneda)}
                    </span>
                    <span className="ml-2 text-[var(--text-muted)]">{m.tipo}</span>
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {m.autorNombre}
                    {m.descripcion ? ` · ${m.descripcion}` : ""}
                    {" · "}
                    {m.estado}
                  </p>
                </div>
                <div className="flex gap-1">
                  {m.estado === "pendiente_aprobacion" && admin && (
                    <>
                      <form action={aprobarMovimientoAction}>
                        <input type="hidden" name="movimientoId" value={m.id} />
                        <Button type="submit" size="sm" variant="accent">
                          OK
                        </Button>
                      </form>
                      <form action={rechazarMovimientoAction}>
                        <input type="hidden" name="movimientoId" value={m.id} />
                        <input type="hidden" name="motivo" value="Rechazado" />
                        <Button type="submit" size="sm" variant="ghost">
                          No
                        </Button>
                      </form>
                    </>
                  )}
                  {m.estado === "activo" && (admin || member) && (
                    <form action={anularMovimientoAction}>
                      <input type="hidden" name="movimientoId" value={m.id} />
                      <input type="hidden" name="motivo" value="Anulado" />
                      <Button type="submit" size="sm" variant="ghost">
                        Anular
                      </Button>
                    </form>
                  )}
                </div>
              </li>
            );
          })}
          {bolsa.movimientos.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              Sin movimientos
            </li>
          )}
        </ul>
      </Glass>
    </AppShell>
  );
}
