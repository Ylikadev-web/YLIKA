import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";

export async function listEmpresas() {
  const db = getDb();
  return db.select().from(s.empresas).where(eq(s.empresas.activa, true));
}

export async function listTiposSolicitud(sector?: "GOBIERNO" | "PRIVADO") {
  const db = getDb();
  if (sector) {
    return db
      .select()
      .from(s.tiposSolicitud)
      .where(
        and(eq(s.tiposSolicitud.activo, true), eq(s.tiposSolicitud.sector, sector)),
      )
      .orderBy(asc(s.tiposSolicitud.orden));
  }
  return db
    .select()
    .from(s.tiposSolicitud)
    .where(eq(s.tiposSolicitud.activo, true))
    .orderBy(asc(s.tiposSolicitud.orden));
}

export async function listExpedientes() {
  const db = getDb();
  return db
    .select({
      id: s.expedientes.id,
      codigo: s.expedientes.codigo,
      estatus: s.expedientes.estatus,
      aptoRequisitos: s.expedientes.aptoRequisitos,
      markupPct: s.expedientes.markupPct,
      criterioSeleccion: s.expedientes.criterioSeleccion,
      updatedAt: s.expedientes.updatedAt,
      titulo: s.solicitudes.titulo,
      sector: s.solicitudes.sector,
      folioExterno: s.solicitudes.folioExterno,
      empresaCodigo: s.empresas.codigo,
      empresaNombre: s.empresas.razonSocial,
      tipoNombre: s.tiposSolicitud.nombre,
      clienteNombre: s.clientes.razonSocial,
      responsableNombre: s.users.name,
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
}

export async function getExpedienteById(id: string) {
  const db = getDb();
  const [exp] = await db
    .select({
      id: s.expedientes.id,
      codigo: s.expedientes.codigo,
      estatus: s.expedientes.estatus,
      aptoRequisitos: s.expedientes.aptoRequisitos,
      aptoNotas: s.expedientes.aptoNotas,
      markupPct: s.expedientes.markupPct,
      criterioSeleccion: s.expedientes.criterioSeleccion,
      driveFolderId: s.expedientes.driveFolderId,
      driveWebViewLink: s.expedientes.driveWebViewLink,
      fechaJuntaAclaraciones: s.expedientes.fechaJuntaAclaraciones,
      fechaApertura: s.expedientes.fechaApertura,
      fechaFallo: s.expedientes.fechaFallo,
      vigenciaOfertaHasta: s.expedientes.vigenciaOfertaHasta,
      solicitudId: s.expedientes.solicitudId,
      empresaId: s.expedientes.empresaId,
      titulo: s.solicitudes.titulo,
      sector: s.solicitudes.sector,
      folioExterno: s.solicitudes.folioExterno,
      caracter: s.solicitudes.caracter,
      empresaCodigo: s.empresas.codigo,
      empresaRazonSocial: s.empresas.razonSocial,
      empresaRfc: s.empresas.rfc,
      tipoNombre: s.tiposSolicitud.nombre,
      tipoId: s.tiposSolicitud.id,
      clienteId: s.clientes.id,
      clienteNombre: s.clientes.razonSocial,
      clienteRfc: s.clientes.rfc,
      clienteDependencia: s.clientes.dependencia,
      clienteDireccion: s.clientes.direccion,
      clienteContacto: s.clientes.contactoNombre,
      clienteEmail: s.clientes.contactoEmail,
      clienteTel: s.clientes.contactoTel,
      responsableId: s.expedientes.responsableActualId,
      responsableNombre: s.users.name,
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
    .where(eq(s.expedientes.id, id))
    .limit(1);

  if (!exp) return null;

  const partidas = await db
    .select()
    .from(s.partidas)
    .where(eq(s.partidas.expedienteId, id))
    .orderBy(asc(s.partidas.numero));

  const cotizaciones = await db
    .select({
      id: s.cotizacionesProveedor.id,
      alias: s.cotizacionesProveedor.aliasEnExpediente,
      proveedorId: s.cotizacionesProveedor.proveedorId,
      proveedorNombre: s.proveedores.razonSocial,
      incluyeIva: s.cotizacionesProveedor.incluyeIva,
      tiempoEntregaDias: s.cotizacionesProveedor.tiempoEntregaDias,
      parseStatus: s.cotizacionesProveedor.parseStatus,
    })
    .from(s.cotizacionesProveedor)
    .innerJoin(
      s.proveedores,
      eq(s.cotizacionesProveedor.proveedorId, s.proveedores.id),
    )
    .where(eq(s.cotizacionesProveedor.expedienteId, id))
    .orderBy(asc(s.cotizacionesProveedor.aliasEnExpediente));

  const cotIds = cotizaciones.map((c) => c.id);
  const lineas =
    cotIds.length === 0
      ? []
      : await db
          .select()
          .from(s.cotizacionPartidas)
          .where(inArray(s.cotizacionPartidas.cotizacionId, cotIds));

  const bitacora = await db
    .select({
      id: s.bitacora.id,
      accion: s.bitacora.accion,
      deEstatus: s.bitacora.deEstatus,
      aEstatus: s.bitacora.aEstatus,
      createdAt: s.bitacora.createdAt,
      usuarioNombre: s.users.name,
    })
    .from(s.bitacora)
    .leftJoin(s.users, eq(s.bitacora.userId, s.users.id))
    .where(eq(s.bitacora.expedienteId, id))
    .orderBy(desc(s.bitacora.createdAt))
    .limit(40);

  const requisitos = await db
    .select()
    .from(s.requisitosExpediente)
    .where(eq(s.requisitosExpediente.expedienteId, id));

  const finales = await db
    .select()
    .from(s.cotizacionesFinales)
    .where(eq(s.cotizacionesFinales.expedienteId, id))
    .orderBy(desc(s.cotizacionesFinales.version));

  return {
    ...exp,
    partidas,
    cotizaciones,
    lineas,
    bitacora,
    requisitos,
    finales,
  };
}

export async function listDocumentosForExpediente(expedienteId: string) {
  const db = getDb();
  return db
    .select({
      id: s.documentos.id,
      tipo: s.documentos.tipo,
      nombre: s.documentos.nombre,
      mimeType: s.documentos.mimeType,
      storagePath: s.documentos.storagePath,
      driveFileId: s.documentos.driveFileId,
      driveWebViewLink: s.documentos.driveWebViewLink,
      createdAt: s.documentos.createdAt,
    })
    .from(s.documentos)
    .where(eq(s.documentos.expedienteId, expedienteId))
    .orderBy(desc(s.documentos.createdAt));
}

export async function listOrdenesCompraExpediente(expedienteId: string) {
  const db = getDb();
  try {
    const ordenes = await db
      .select({
        id: s.ordenesCompra.id,
        folio: s.ordenesCompra.folio,
        proveedorNombre: s.ordenesCompra.proveedorNombre,
        estatus: s.ordenesCompra.estatus,
        montoTotal: s.ordenesCompra.montoTotal,
        createdAt: s.ordenesCompra.createdAt,
      })
      .from(s.ordenesCompra)
      .where(eq(s.ordenesCompra.expedienteId, expedienteId))
      .orderBy(desc(s.ordenesCompra.createdAt));

    if (!ordenes.length) return [];

    const ocIds = ordenes.map((o) => o.id);
    let lineas: Array<{
      ordenCompraId: string;
      numero: number;
      descripcion: string;
      cantidad: string;
      unidad: string;
    }> = [];
    try {
      lineas = await db
        .select({
          ordenCompraId: s.ordenCompraPartidas.ordenCompraId,
          numero: s.ordenCompraPartidas.numero,
          descripcion: s.ordenCompraPartidas.descripcion,
          cantidad: s.ordenCompraPartidas.cantidad,
          unidad: s.ordenCompraPartidas.unidad,
        })
        .from(s.ordenCompraPartidas)
        .where(inArray(s.ordenCompraPartidas.ordenCompraId, ocIds))
        .orderBy(asc(s.ordenCompraPartidas.numero));
    } catch {
      lineas = [];
    }

    return ordenes.map((o) => ({
      ...o,
      lineas: lineas.filter((l) => l.ordenCompraId === o.id),
    }));
  } catch {
    return [];
  }
}

export async function getCobranzaExpediente(expedienteId: string) {
  const db = getDb();
  try {
    const [row] = await db
      .select()
      .from(s.cobranzas)
      .where(eq(s.cobranzas.expedienteId, expedienteId))
      .limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

export async function listDocumentosEmpresa(empresaId?: string) {
  const db = getDb();
  const base = db
    .select({
      id: s.documentosEmpresa.id,
      nombre: s.documentosEmpresa.nombre,
      categoria: s.documentosEmpresa.categoria,
      fechaVencimiento: s.documentosEmpresa.fechaVencimiento,
      estado: s.documentosEmpresa.estado,
      empresaId: s.documentosEmpresa.empresaId,
      empresaCodigo: s.empresas.codigo,
      storagePath: s.documentosEmpresa.storagePath,
      notas: s.documentosEmpresa.notas,
    })
    .from(s.documentosEmpresa)
    .innerJoin(s.empresas, eq(s.documentosEmpresa.empresaId, s.empresas.id));

  if (empresaId) {
    return base
      .where(eq(s.documentosEmpresa.empresaId, empresaId))
      .orderBy(asc(s.documentosEmpresa.nombre));
  }
  return base.orderBy(asc(s.empresas.codigo), asc(s.documentosEmpresa.nombre));
}

export async function nextExpedienteCodigo(empresaId: string) {
  const db = getDb();
  const [emp] = await db
    .select()
    .from(s.empresas)
    .where(eq(s.empresas.id, empresaId))
    .limit(1);
  if (!emp) throw new Error("Empresa no encontrada");
  const year = new Date().getFullYear();
  const rows = await db
    .select({ codigo: s.expedientes.codigo })
    .from(s.expedientes)
    .where(eq(s.expedientes.empresaId, empresaId));
  const seq = rows.filter((r) => r.codigo.includes(`-${year}-`)).length + 1;
  return `YLK-${emp.codigo}-${year}-${String(seq).padStart(5, "0")}`;
}

export type EstadoDoc = "VIGENTE" | "POR_VENCER" | "VENCIDO" | "NO_APLICA";

export function calcEstadoDoc(fechaVencimiento: Date | null): EstadoDoc {
  if (!fechaVencimiento) return "NO_APLICA";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const v = new Date(fechaVencimiento);
  v.setHours(0, 0, 0, 0);
  const in30 = new Date(today);
  in30.setDate(in30.getDate() + 30);
  if (v < today) return "VENCIDO";
  if (v < in30) return "POR_VENCER";
  return "VIGENTE";
}
