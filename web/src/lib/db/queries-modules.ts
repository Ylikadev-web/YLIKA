import { and, asc, desc, eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";

export async function listClientes() {
  const db = getDb();
  return db.select().from(s.clientes).orderBy(asc(s.clientes.razonSocial));
}

export async function listProveedores() {
  const db = getDb();
  return db
    .select()
    .from(s.proveedores)
    .where(eq(s.proveedores.activo, true))
    .orderBy(asc(s.proveedores.razonSocial));
}

export async function listCotizacionesCompras() {
  const db = getDb();
  return db
    .select({
      id: s.cotizacionesProveedor.id,
      alias: s.cotizacionesProveedor.aliasEnExpediente,
      fecha: s.cotizacionesProveedor.fecha,
      parseStatus: s.cotizacionesProveedor.parseStatus,
      incluyeIva: s.cotizacionesProveedor.incluyeIva,
      proveedorNombre: s.proveedores.razonSocial,
      expedienteId: s.expedientes.id,
      expedienteCodigo: s.expedientes.codigo,
      estatus: s.expedientes.estatus,
      titulo: s.solicitudes.titulo,
      empresaCodigo: s.empresas.codigo,
    })
    .from(s.cotizacionesProveedor)
    .innerJoin(
      s.proveedores,
      eq(s.cotizacionesProveedor.proveedorId, s.proveedores.id),
    )
    .innerJoin(
      s.expedientes,
      eq(s.cotizacionesProveedor.expedienteId, s.expedientes.id),
    )
    .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
    .innerJoin(s.empresas, eq(s.expedientes.empresaId, s.empresas.id))
    .orderBy(desc(s.cotizacionesProveedor.createdAt));
}

export async function listRemisiones() {
  const db = getDb();
  return db
    .select({
      id: s.remisiones.id,
      folio: s.remisiones.folio,
      destinatario: s.remisiones.destinatario,
      direccionEntrega: s.remisiones.direccionEntrega,
      fechaEntrega: s.remisiones.fechaEntrega,
      estatus: s.remisiones.estatus,
      notas: s.remisiones.notas,
      createdAt: s.remisiones.createdAt,
      expedienteId: s.expedientes.id,
      expedienteCodigo: s.expedientes.codigo,
      titulo: s.solicitudes.titulo,
      empresaCodigo: s.empresas.codigo,
    })
    .from(s.remisiones)
    .innerJoin(s.expedientes, eq(s.remisiones.expedienteId, s.expedientes.id))
    .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
    .innerJoin(s.empresas, eq(s.remisiones.empresaId, s.empresas.id))
    .orderBy(desc(s.remisiones.createdAt));
}

export async function getRemisionById(id: string) {
  const db = getDb();
  const [rem] = await db
    .select({
      id: s.remisiones.id,
      folio: s.remisiones.folio,
      destinatario: s.remisiones.destinatario,
      direccionEntrega: s.remisiones.direccionEntrega,
      fechaEntrega: s.remisiones.fechaEntrega,
      estatus: s.remisiones.estatus,
      notas: s.remisiones.notas,
      expedienteId: s.expedientes.id,
      expedienteCodigo: s.expedientes.codigo,
      empresaCodigo: s.empresas.codigo,
      titulo: s.solicitudes.titulo,
    })
    .from(s.remisiones)
    .innerJoin(s.expedientes, eq(s.remisiones.expedienteId, s.expedientes.id))
    .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
    .innerJoin(s.empresas, eq(s.remisiones.empresaId, s.empresas.id))
    .where(eq(s.remisiones.id, id))
    .limit(1);
  if (!rem) return null;
  const partidas = await db
    .select()
    .from(s.remisionPartidas)
    .where(eq(s.remisionPartidas.remisionId, id));
  return { ...rem, partidas };
}

export async function listDocumentosExpediente() {
  const db = getDb();
  return db
    .select({
      id: s.documentos.id,
      nombre: s.documentos.nombre,
      tipo: s.documentos.tipo,
      storagePath: s.documentos.storagePath,
      createdAt: s.documentos.createdAt,
      expedienteId: s.expedientes.id,
      expedienteCodigo: s.expedientes.codigo,
      empresaCodigo: s.empresas.codigo,
      titulo: s.solicitudes.titulo,
    })
    .from(s.documentos)
    .leftJoin(s.expedientes, eq(s.documentos.expedienteId, s.expedientes.id))
    .leftJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
    .leftJoin(s.empresas, eq(s.documentos.empresaId, s.empresas.id))
    .orderBy(desc(s.documentos.createdAt));
}

export async function listExpedientesByFilter(opts: {
  sector?: "GOBIERNO" | "PRIVADO";
  ambito?: "ADQUISICIONES" | "OBRA" | "PRIVADO";
  estatusIn?: string[];
}) {
  const db = getDb();
  const rows = await db
    .select({
      id: s.expedientes.id,
      codigo: s.expedientes.codigo,
      estatus: s.expedientes.estatus,
      titulo: s.solicitudes.titulo,
      sector: s.solicitudes.sector,
      ambito: s.tiposSolicitud.ambito,
      tipoNombre: s.tiposSolicitud.nombre,
      empresaCodigo: s.empresas.codigo,
      clienteNombre: s.clientes.razonSocial,
      responsableNombre: s.users.name,
      updatedAt: s.expedientes.updatedAt,
    })
    .from(s.expedientes)
    .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
    .innerJoin(s.empresas, eq(s.expedientes.empresaId, s.empresas.id))
    .innerJoin(
      s.tiposSolicitud,
      eq(s.solicitudes.tipoSolicitudId, s.tiposSolicitud.id),
    )
    .leftJoin(s.clientes, eq(s.solicitudes.clienteId, s.clientes.id))
    .leftJoin(s.users, eq(s.expedientes.responsableActualId, s.users.id))
    .orderBy(desc(s.expedientes.updatedAt));

  return rows.filter((r) => {
    if (opts.sector && r.sector !== opts.sector) return false;
    if (opts.ambito && r.ambito !== opts.ambito) return false;
    if (opts.estatusIn && !opts.estatusIn.includes(r.estatus)) return false;
    return true;
  });
}

export async function listUsersWithRoles() {
  const db = getDb();
  const users = await db.select().from(s.users).orderBy(asc(s.users.name));
  const ur = await db
    .select({
      userId: s.usuarioRoles.userId,
      rolCodigo: s.roles.codigo,
      rolNombre: s.roles.nombre,
    })
    .from(s.usuarioRoles)
    .innerJoin(s.roles, eq(s.usuarioRoles.rolId, s.roles.id));

  return users.map((u) => ({
    ...u,
    roles: ur.filter((r) => r.userId === u.id).map((r) => r.rolCodigo),
  }));
}

export async function listExpedientesParaRemision() {
  const db = getDb();
  return db
    .select({
      id: s.expedientes.id,
      codigo: s.expedientes.codigo,
      titulo: s.solicitudes.titulo,
      empresaId: s.expedientes.empresaId,
      empresaCodigo: s.empresas.codigo,
      estatus: s.expedientes.estatus,
    })
    .from(s.expedientes)
    .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
    .innerJoin(s.empresas, eq(s.expedientes.empresaId, s.empresas.id))
    .where(
      and(
        ne(s.expedientes.estatus, "CANCELADO"),
        ne(s.expedientes.estatus, "BORRADOR"),
      ),
    )
    .orderBy(desc(s.expedientes.updatedAt));
}

export async function nextRemisionFolio(empresaCodigo: string) {
  const db = getDb();
  const year = new Date().getFullYear();
  const prefix = `REM-${empresaCodigo}-${year}-`;
  const rows = await db.select({ folio: s.remisiones.folio }).from(s.remisiones);
  const seq =
    rows.filter((r) => r.folio.startsWith(prefix)).length + 1;
  return `${prefix}${String(seq).padStart(5, "0")}`;
}

export async function getModuloBolsa() {
  const db = getDb();
  const [m] = await db
    .select()
    .from(s.modulosExternos)
    .where(eq(s.modulosExternos.codigo, "BOLSA"))
    .limit(1);
  return m ?? null;
}
