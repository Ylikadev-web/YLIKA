"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import {
  calcSaldoBolsa,
  ensureBolsaGeneral,
  isBolsaAdmin,
  userIsMember,
} from "@/lib/db/bolsa";
import * as s from "@/lib/db/schema";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  const db = getDb();
  let userId = session.user.id;
  if (userId === "demo-miguel") {
    const [u] = await db
      .select({ id: s.users.id })
      .from(s.users)
      .where(eq(s.users.email, "miguel@ylika.local"))
      .limit(1);
    if (!u) throw new Error("Usuario demo no encontrado");
    userId = u.id;
  }
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  return { userId, roles, name: session.user.name };
}

function revalidateBolsa(id?: string) {
  revalidatePath("/app/tesoreria");
  if (id) revalidatePath(`/app/tesoreria/bolsa/${id}`);
}

export async function bootstrapBolsaGeneralAction() {
  const { userId, roles } = await requireSession();
  if (!isBolsaAdmin(roles)) throw new Error("Solo admin/finanzas/director");
  await ensureBolsaGeneral(userId);
  revalidateBolsa();
}

export async function crearBolsaPropiaAction(formData: FormData) {
  const { userId } = await requireSession();
  const db = getDb();
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) throw new Error("Nombre requerido");
  const color = String(formData.get("color") || "#0ea5e9");
  const descripcion = String(formData.get("descripcion") || "") || null;
  const saldoInicial = Number(formData.get("saldoInicial") || 0);
  const metaMonto = Number(formData.get("metaMonto") || 0);

  const [bolsa] = await db
    .insert(s.bolsas)
    .values({
      nombre,
      descripcion,
      color,
      icono: "wallet",
      createdBy: userId,
      metaHabilitada: metaMonto > 0,
      metaMonto: metaMonto > 0 ? String(metaMonto) : null,
    })
    .returning();

  await db.insert(s.bolsaMiembros).values({
    bolsaId: bolsa.id,
    userId,
    addedBy: userId,
  });

  if (saldoInicial > 0) {
    await db.insert(s.bolsaMovimientos).values({
      bolsaId: bolsa.id,
      tipo: "saldo_apertura",
      monto: String(saldoInicial),
      descripcion: "Saldo inicial",
      autorId: userId,
      estado: "activo",
      fechaEjecucion: new Date(),
    });
  }

  revalidateBolsa(bolsa.id);
}

export async function asignarBolsaAction(formData: FormData) {
  const { userId, roles } = await requireSession();
  if (!isBolsaAdmin(roles)) throw new Error("Solo el administrador asigna bolsas");
  const db = getDb();
  const nombre = String(formData.get("nombre") || "").trim();
  const asignadoId = String(formData.get("asignadoId") || "");
  if (!nombre || !asignadoId) throw new Error("Faltan datos");
  const saldoInicial = Number(formData.get("saldoInicial") || 0);

  const [bolsa] = await db
    .insert(s.bolsas)
    .values({
      nombre,
      color: String(formData.get("color") || "#a855f7"),
      icono: "key",
      assignedByAdminId: userId,
      createdBy: userId,
    })
    .returning();

  await db.insert(s.bolsaMiembros).values({
    bolsaId: bolsa.id,
    userId: asignadoId,
    addedBy: userId,
  });

  if (saldoInicial > 0) {
    await db.insert(s.bolsaMovimientos).values({
      bolsaId: bolsa.id,
      tipo: "saldo_apertura",
      monto: String(saldoInicial),
      descripcion: "Saldo inicial asignado",
      autorId: userId,
      estado: "activo",
      fechaEjecucion: new Date(),
      aprobadoPor: userId,
      aprobadoAt: new Date(),
    });
  }

  revalidateBolsa(bolsa.id);
}

export async function registrarMovimientoAction(formData: FormData) {
  const { userId, roles } = await requireSession();
  const db = getDb();
  const bolsaId = String(formData.get("bolsaId") || "");
  const tipo = String(formData.get("tipo") || "") as
    | "ingreso"
    | "gasto"
    | "aporte_enviado"
    | "aporte_recibido";
  const monto = Number(formData.get("monto") || 0);
  const descripcion = String(formData.get("descripcion") || "") || null;
  const naturaleza = String(formData.get("naturaleza") || "") || null;
  const plazoDias = Number(formData.get("plazoDias") || 0) || null;

  if (!bolsaId || !["ingreso", "gasto", "aporte_enviado", "aporte_recibido"].includes(tipo)) {
    throw new Error("Datos inválidos");
  }
  if (!(monto > 0)) throw new Error("Monto inválido");

  const [bolsa] = await db
    .select()
    .from(s.bolsas)
    .where(eq(s.bolsas.id, bolsaId))
    .limit(1);
  if (!bolsa || bolsa.archivada) throw new Error("Bolsa no encontrada");

  const member = await userIsMember(bolsaId, userId);
  const admin = isBolsaAdmin(roles);
  if (!member && !admin) throw new Error("Sin acceso a esta bolsa");

  const requiereAprobacion =
    bolsa.esGeneral || Boolean(bolsa.assignedByAdminId);
  const libre = !requiereAprobacion && member && !bolsa.assignedByAdminId;

  // Propia: libre. General/asignada: pendiente salvo que admin registre directo.
  const estado =
    libre || (admin && !bolsa.assignedByAdminId && !bolsa.esGeneral) || (admin && bolsa.esGeneral && formData.get("forzarActivo") === "1")
      ? ("activo" as const)
      : requiereAprobacion && !admin
        ? ("pendiente_aprobacion" as const)
        : admin
          ? ("activo" as const)
          : ("pendiente_aprobacion" as const);

  if (tipo === "gasto" && estado === "activo" && !bolsa.permiteSaldoNegativo) {
    const saldo = await calcSaldoBolsa(bolsaId);
    if (saldo - monto < 0) throw new Error("Saldo insuficiente");
  }

  let fechaVencimiento: Date | null = null;
  if (naturaleza === "prestamo" && plazoDias) {
    fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + plazoDias);
  }

  await db.insert(s.bolsaMovimientos).values({
    bolsaId,
    tipo,
    monto: String(monto),
    descripcion,
    autorId: userId,
    estado,
    fechaEjecucion: estado === "activo" ? new Date() : null,
    aprobadoPor: estado === "activo" && admin ? userId : null,
    aprobadoAt: estado === "activo" && admin ? new Date() : null,
    naturalezaAporte:
      tipo === "aporte_enviado" || tipo === "aporte_recibido"
        ? ((naturaleza || "prestamo") as
            | "prestamo"
            | "pago_deuda"
            | "reembolso"
            | "cooperacion")
        : null,
    plazoDias: naturaleza === "prestamo" ? plazoDias : null,
    fechaVencimiento,
  });

  revalidateBolsa(bolsaId);
}

export async function aprobarMovimientoAction(formData: FormData) {
  const { userId, roles } = await requireSession();
  if (!isBolsaAdmin(roles)) throw new Error("Solo admin aprueba");
  const db = getDb();
  const id = String(formData.get("movimientoId") || "");
  const [mov] = await db
    .select()
    .from(s.bolsaMovimientos)
    .where(eq(s.bolsaMovimientos.id, id))
    .limit(1);
  if (!mov || mov.estado !== "pendiente_aprobacion") {
    throw new Error("Movimiento no pendiente");
  }

  if (mov.tipo === "gasto") {
    const [bolsa] = await db
      .select()
      .from(s.bolsas)
      .where(eq(s.bolsas.id, mov.bolsaId))
      .limit(1);
    if (bolsa && !bolsa.permiteSaldoNegativo) {
      const saldo = await calcSaldoBolsa(mov.bolsaId);
      if (saldo - Number(mov.monto) < 0) {
        throw new Error("Saldo insuficiente para aprobar");
      }
    }
  }

  await db
    .update(s.bolsaMovimientos)
    .set({
      estado: "activo",
      fechaEjecucion: new Date(),
      aprobadoPor: userId,
      aprobadoAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(s.bolsaMovimientos.id, id));

  revalidateBolsa(mov.bolsaId);
}

export async function rechazarMovimientoAction(formData: FormData) {
  const { userId, roles } = await requireSession();
  if (!isBolsaAdmin(roles)) throw new Error("Solo admin rechaza");
  const db = getDb();
  const id = String(formData.get("movimientoId") || "");
  const motivo = String(formData.get("motivo") || "").trim() || "Rechazado";
  const [mov] = await db
    .select()
    .from(s.bolsaMovimientos)
    .where(eq(s.bolsaMovimientos.id, id))
    .limit(1);
  if (!mov) throw new Error("No encontrado");

  await db
    .update(s.bolsaMovimientos)
    .set({
      estado: "rechazado",
      motivoRechazo: motivo,
      aprobadoPor: userId,
      aprobadoAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(s.bolsaMovimientos.id, id));

  revalidateBolsa(mov.bolsaId);
}

export async function anularMovimientoAction(formData: FormData) {
  const { userId, roles } = await requireSession();
  const db = getDb();
  const id = String(formData.get("movimientoId") || "");
  const motivo = String(formData.get("motivo") || "").trim() || "Anulado";
  const [mov] = await db
    .select()
    .from(s.bolsaMovimientos)
    .where(eq(s.bolsaMovimientos.id, id))
    .limit(1);
  if (!mov || mov.estado !== "activo") throw new Error("Solo activos se anulan");

  const admin = isBolsaAdmin(roles);
  const member = await userIsMember(mov.bolsaId, userId);
  const [bolsa] = await db
    .select()
    .from(s.bolsas)
    .where(eq(s.bolsas.id, mov.bolsaId))
    .limit(1);
  if (!bolsa) throw new Error("Bolsa no encontrada");
  if (bolsa.esGeneral && !admin) throw new Error("Solo admin anula en General");
  if (!admin && !member) throw new Error("Sin permiso");

  await db
    .update(s.bolsaMovimientos)
    .set({
      estado: "anulado",
      anuladoAt: new Date(),
      anuladoPor: userId,
      motivoAnulacion: motivo,
      updatedAt: new Date(),
    })
    .where(eq(s.bolsaMovimientos.id, id));

  revalidateBolsa(mov.bolsaId);
}

export async function archivarBolsaAction(formData: FormData) {
  const { userId, roles } = await requireSession();
  const db = getDb();
  const id = String(formData.get("bolsaId") || "");
  const [bolsa] = await db
    .select()
    .from(s.bolsas)
    .where(eq(s.bolsas.id, id))
    .limit(1);
  if (!bolsa || bolsa.esGeneral) throw new Error("No se puede archivar");
  const admin = isBolsaAdmin(roles);
  if (bolsa.createdBy !== userId && !admin) throw new Error("Sin permiso");

  const saldo = await calcSaldoBolsa(id);
  if (Math.abs(saldo) > 0.009) {
    throw new Error("Solo se archiva con saldo 0");
  }

  await db
    .update(s.bolsas)
    .set({
      archivada: true,
      archivadaAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(s.bolsas.id, id)));

  revalidateBolsa();
}
