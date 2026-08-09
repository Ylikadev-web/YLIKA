import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import type { FinalLine } from "@/lib/quotes/comparativo";

export async function getCotizacionFinalPrint(
  expedienteId: string,
  version: number,
) {
  const db = getDb();
  const [exp] = await db
    .select({
      id: s.expedientes.id,
      codigo: s.expedientes.codigo,
      titulo: s.solicitudes.titulo,
      folioExterno: s.solicitudes.folioExterno,
      sector: s.solicitudes.sector,
      empresaCodigo: s.empresas.codigo,
      empresaRazonSocial: s.empresas.razonSocial,
      empresaRfc: s.empresas.rfc,
      clienteNombre: s.clientes.razonSocial,
      clienteRfc: s.clientes.rfc,
      clienteDependencia: s.clientes.dependencia,
      clienteDireccion: s.clientes.direccion,
      clienteContacto: s.clientes.contactoNombre,
      clienteEmail: s.clientes.contactoEmail,
      clienteTel: s.clientes.contactoTel,
      tipoNombre: s.tiposSolicitud.nombre,
    })
    .from(s.expedientes)
    .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
    .innerJoin(s.empresas, eq(s.expedientes.empresaId, s.empresas.id))
    .innerJoin(
      s.tiposSolicitud,
      eq(s.solicitudes.tipoSolicitudId, s.tiposSolicitud.id),
    )
    .leftJoin(s.clientes, eq(s.solicitudes.clienteId, s.clientes.id))
    .where(eq(s.expedientes.id, expedienteId))
    .limit(1);

  if (!exp) return null;

  const [final] = await db
    .select({
      id: s.cotizacionesFinales.id,
      version: s.cotizacionesFinales.version,
      criterio: s.cotizacionesFinales.criterio,
      createdAt: s.cotizacionesFinales.createdAt,
      payload: s.cotizacionesFinales.payload,
      archivoPath: s.cotizacionesFinales.archivoPath,
    })
    .from(s.cotizacionesFinales)
    .where(
      and(
        eq(s.cotizacionesFinales.expedienteId, expedienteId),
        eq(s.cotizacionesFinales.version, version),
      ),
    )
    .limit(1);

  if (!final) return null;

  const payload = (final.payload ?? {}) as { lineas?: FinalLine[] };
  const lineas = (payload.lineas ?? []).slice().sort((a, b) => a.numero - b.numero);

  return {
    expediente: exp,
    version: final.version,
    criterio: final.criterio,
    createdAt: final.createdAt,
    lineas,
    /** Nunca incluir markupPct aquí — documento cliente */
  };
}

export async function getLatestCotizacionFinalVersion(expedienteId: string) {
  const db = getDb();
  const [row] = await db
    .select({ version: s.cotizacionesFinales.version })
    .from(s.cotizacionesFinales)
    .where(eq(s.cotizacionesFinales.expedienteId, expedienteId))
    .orderBy(desc(s.cotizacionesFinales.version))
    .limit(1);
  return row?.version ?? null;
}

export async function listCotizacionFinalVersions(expedienteId: string) {
  const db = getDb();
  return db
    .select({
      id: s.cotizacionesFinales.id,
      version: s.cotizacionesFinales.version,
      criterio: s.cotizacionesFinales.criterio,
      createdAt: s.cotizacionesFinales.createdAt,
      markupPctAplicado: s.cotizacionesFinales.markupPctAplicado,
      archivoPath: s.cotizacionesFinales.archivoPath,
    })
    .from(s.cotizacionesFinales)
    .where(eq(s.cotizacionesFinales.expedienteId, expedienteId))
    .orderBy(desc(s.cotizacionesFinales.version));
}
