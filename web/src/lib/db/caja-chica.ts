import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";

export async function listCajaChicaExpediente(expedienteId: string) {
  const db = getDb();
  try {
    return await db
      .select({
        id: s.cajaChicaMovimientos.id,
        expedienteId: s.cajaChicaMovimientos.expedienteId,
        concepto: s.cajaChicaMovimientos.concepto,
        monto: s.cajaChicaMovimientos.monto,
        moneda: s.cajaChicaMovimientos.moneda,
        estatus: s.cajaChicaMovimientos.estatus,
        fecha: s.cajaChicaMovimientos.fecha,
        solicitadoPor: s.cajaChicaMovimientos.solicitadoPor,
        solicitadoNombre: s.users.name,
        aprobadoPor: s.cajaChicaMovimientos.aprobadoPor,
        aprobadoAt: s.cajaChicaMovimientos.aprobadoAt,
        motivoRechazo: s.cajaChicaMovimientos.motivoRechazo,
        documentoId: s.cajaChicaMovimientos.documentoId,
        documentoNombre: s.documentos.nombre,
        notas: s.cajaChicaMovimientos.notas,
        createdAt: s.cajaChicaMovimientos.createdAt,
      })
      .from(s.cajaChicaMovimientos)
      .leftJoin(s.users, eq(s.cajaChicaMovimientos.solicitadoPor, s.users.id))
      .leftJoin(
        s.documentos,
        eq(s.cajaChicaMovimientos.documentoId, s.documentos.id),
      )
      .where(eq(s.cajaChicaMovimientos.expedienteId, expedienteId))
      .orderBy(desc(s.cajaChicaMovimientos.createdAt));
  } catch {
    return [];
  }
}

export async function listCajaChicaPorComprobar(limit = 12) {
  const db = getDb();
  try {
    return await db
      .select({
        id: s.cajaChicaMovimientos.id,
        expedienteId: s.cajaChicaMovimientos.expedienteId,
        concepto: s.cajaChicaMovimientos.concepto,
        monto: s.cajaChicaMovimientos.monto,
        moneda: s.cajaChicaMovimientos.moneda,
        estatus: s.cajaChicaMovimientos.estatus,
        fecha: s.cajaChicaMovimientos.fecha,
        solicitadoPor: s.cajaChicaMovimientos.solicitadoPor,
        solicitadoNombre: s.users.name,
        aprobadoPor: s.cajaChicaMovimientos.aprobadoPor,
        aprobadoAt: s.cajaChicaMovimientos.aprobadoAt,
        motivoRechazo: s.cajaChicaMovimientos.motivoRechazo,
        documentoId: s.cajaChicaMovimientos.documentoId,
        documentoNombre: s.documentos.nombre,
        notas: s.cajaChicaMovimientos.notas,
        createdAt: s.cajaChicaMovimientos.createdAt,
        expedienteCodigo: s.expedientes.codigo,
      })
      .from(s.cajaChicaMovimientos)
      .innerJoin(
        s.expedientes,
        eq(s.cajaChicaMovimientos.expedienteId, s.expedientes.id),
      )
      .leftJoin(s.users, eq(s.cajaChicaMovimientos.solicitadoPor, s.users.id))
      .leftJoin(
        s.documentos,
        eq(s.cajaChicaMovimientos.documentoId, s.documentos.id),
      )
      .where(eq(s.cajaChicaMovimientos.estatus, "POR_COMPROBAR"))
      .orderBy(asc(s.cajaChicaMovimientos.fecha))
      .limit(limit);
  } catch {
    return [];
  }
}
