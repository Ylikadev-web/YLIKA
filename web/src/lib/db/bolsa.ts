import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";

export const COLORES_BOLSA = [
  "#eab308",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#64748b",
] as const;

function signo(tipo: string, descripcion?: string | null) {
  if (tipo === "transferencia_interna") {
    if (descripcion === "INTERN_OUT") return -1;
    if (descripcion === "INTERN_IN") return 1;
    return 0;
  }
  if (
    tipo === "saldo_apertura" ||
    tipo === "ingreso" ||
    tipo === "aporte_recibido"
  ) {
    return 1;
  }
  if (tipo === "gasto" || tipo === "aporte_enviado") return -1;
  return 0;
}

export function isBolsaAdmin(roles: string[] = []) {
  return (
    roles.includes("DIRECTOR") ||
    roles.includes("ADMIN_SISTEMAS") ||
    roles.includes("ADMIN_FINANZAS")
  );
}

export async function calcSaldoBolsa(bolsaId: string) {
  const db = getDb();
  const rows = await db
    .select({
      tipo: s.bolsaMovimientos.tipo,
      monto: s.bolsaMovimientos.monto,
      descripcion: s.bolsaMovimientos.descripcion,
    })
    .from(s.bolsaMovimientos)
    .where(
      and(
        eq(s.bolsaMovimientos.bolsaId, bolsaId),
        eq(s.bolsaMovimientos.estado, "activo"),
      ),
    );
  return rows.reduce(
    (acc, r) => acc + Number(r.monto) * signo(r.tipo, r.descripcion),
    0,
  );
}

export async function listBolsasForUser(userId: string, roles: string[] = []) {
  const db = getDb();
  const admin = isBolsaAdmin(roles);

  const memberships = await db
    .select({ bolsaId: s.bolsaMiembros.bolsaId })
    .from(s.bolsaMiembros)
    .where(eq(s.bolsaMiembros.userId, userId));
  const memberIds = memberships.map((m) => m.bolsaId);

  const rows = await db
    .select()
    .from(s.bolsas)
    .where(
      and(eq(s.bolsas.archivada, false), isNull(s.bolsas.parentId)),
    )
    .orderBy(desc(s.bolsas.esGeneral), asc(s.bolsas.createdAt));

  const visible = admin
    ? rows
    : rows.filter((b) => b.esGeneral || memberIds.includes(b.id));

  return Promise.all(
    visible.map(async (b) => ({
      ...b,
      saldo: await calcSaldoBolsa(b.id),
      esMia: memberIds.includes(b.id) || b.createdBy === userId,
    })),
  );
}

export async function getBolsaDetail(bolsaId: string) {
  const db = getDb();
  const [bolsa] = await db
    .select()
    .from(s.bolsas)
    .where(eq(s.bolsas.id, bolsaId))
    .limit(1);
  if (!bolsa) return null;

  const miembros = await db
    .select({
      userId: s.bolsaMiembros.userId,
      name: s.users.name,
      email: s.users.email,
    })
    .from(s.bolsaMiembros)
    .innerJoin(s.users, eq(s.bolsaMiembros.userId, s.users.id))
    .where(eq(s.bolsaMiembros.bolsaId, bolsaId));

  const movimientos = await db
    .select({
      id: s.bolsaMovimientos.id,
      tipo: s.bolsaMovimientos.tipo,
      monto: s.bolsaMovimientos.monto,
      moneda: s.bolsaMovimientos.moneda,
      descripcion: s.bolsaMovimientos.descripcion,
      estado: s.bolsaMovimientos.estado,
      fechaSolicitud: s.bolsaMovimientos.fechaSolicitud,
      fechaEjecucion: s.bolsaMovimientos.fechaEjecucion,
      naturalezaAporte: s.bolsaMovimientos.naturalezaAporte,
      plazoDias: s.bolsaMovimientos.plazoDias,
      fechaVencimiento: s.bolsaMovimientos.fechaVencimiento,
      autorNombre: s.users.name,
      autorId: s.bolsaMovimientos.autorId,
      motivoRechazo: s.bolsaMovimientos.motivoRechazo,
    })
    .from(s.bolsaMovimientos)
    .innerJoin(s.users, eq(s.bolsaMovimientos.autorId, s.users.id))
    .where(eq(s.bolsaMovimientos.bolsaId, bolsaId))
    .orderBy(desc(s.bolsaMovimientos.createdAt));

  return {
    ...bolsa,
    saldo: await calcSaldoBolsa(bolsaId),
    miembros,
    movimientos,
  };
}

export async function listPendientesAprobacion() {
  const db = getDb();
  return db
    .select({
      id: s.bolsaMovimientos.id,
      tipo: s.bolsaMovimientos.tipo,
      monto: s.bolsaMovimientos.monto,
      moneda: s.bolsaMovimientos.moneda,
      descripcion: s.bolsaMovimientos.descripcion,
      fechaSolicitud: s.bolsaMovimientos.fechaSolicitud,
      bolsaId: s.bolsas.id,
      bolsaNombre: s.bolsas.nombre,
      autorNombre: s.users.name,
    })
    .from(s.bolsaMovimientos)
    .innerJoin(s.bolsas, eq(s.bolsaMovimientos.bolsaId, s.bolsas.id))
    .innerJoin(s.users, eq(s.bolsaMovimientos.autorId, s.users.id))
    .where(eq(s.bolsaMovimientos.estado, "pendiente_aprobacion"))
    .orderBy(asc(s.bolsaMovimientos.fechaSolicitud));
}

export async function listPrestamosActivos(userId: string) {
  const db = getDb();
  return db
    .select({
      id: s.bolsaMovimientos.id,
      monto: s.bolsaMovimientos.monto,
      moneda: s.bolsaMovimientos.moneda,
      descripcion: s.bolsaMovimientos.descripcion,
      fechaVencimiento: s.bolsaMovimientos.fechaVencimiento,
      tipo: s.bolsaMovimientos.tipo,
      bolsaNombre: s.bolsas.nombre,
      autorId: s.bolsaMovimientos.autorId,
      contraparteUserId: s.bolsaMovimientos.contraparteUserId,
    })
    .from(s.bolsaMovimientos)
    .innerJoin(s.bolsas, eq(s.bolsaMovimientos.bolsaId, s.bolsas.id))
    .where(
      and(
        eq(s.bolsaMovimientos.naturalezaAporte, "prestamo"),
        eq(s.bolsaMovimientos.estado, "activo"),
        sql`(${s.bolsaMovimientos.autorId} = ${userId} OR ${s.bolsaMovimientos.contraparteUserId} = ${userId})`,
      ),
    )
    .orderBy(asc(s.bolsaMovimientos.fechaVencimiento));
}

export async function ensureBolsaGeneral(adminUserId: string) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(s.bolsas)
    .where(and(eq(s.bolsas.esGeneral, true), eq(s.bolsas.archivada, false)))
    .limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(s.bolsas)
    .values({
      nombre: "Bolsa General",
      descripcion: "Fondo compartido del grupo",
      color: "#eab308",
      icono: "users",
      esGeneral: true,
      createdBy: adminUserId,
    })
    .returning();

  await db.insert(s.bolsaMiembros).values({
    bolsaId: created.id,
    userId: adminUserId,
    addedBy: adminUserId,
  });

  return created;
}

export async function userIsMember(bolsaId: string, userId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(s.bolsaMiembros)
    .where(
      and(
        eq(s.bolsaMiembros.bolsaId, bolsaId),
        eq(s.bolsaMiembros.userId, userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}
