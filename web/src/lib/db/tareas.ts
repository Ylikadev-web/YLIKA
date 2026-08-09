import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";

export async function listTareasExpediente(expedienteId: string) {
  const db = getDb();
  return db
    .select({
      id: s.expedienteTareas.id,
      tipo: s.expedienteTareas.tipo,
      titulo: s.expedienteTareas.titulo,
      estado: s.expedienteTareas.estado,
      orden: s.expedienteTareas.orden,
      meta: s.expedienteTareas.meta,
      completedAt: s.expedienteTareas.completedAt,
      createdAt: s.expedienteTareas.createdAt,
      asignadoNombre: s.users.name,
    })
    .from(s.expedienteTareas)
    .leftJoin(s.users, eq(s.expedienteTareas.asignadoA, s.users.id))
    .where(eq(s.expedienteTareas.expedienteId, expedienteId))
    .orderBy(asc(s.expedienteTareas.orden), asc(s.expedienteTareas.createdAt));
}

export async function listTareasPendientesGlobal(limit = 20) {
  const db = getDb();
  return db
    .select({
      id: s.expedienteTareas.id,
      tipo: s.expedienteTareas.tipo,
      titulo: s.expedienteTareas.titulo,
      expedienteId: s.expedientes.id,
      codigo: s.expedientes.codigo,
      estatus: s.expedientes.estatus,
      empresaCodigo: s.empresas.codigo,
    })
    .from(s.expedienteTareas)
    .innerJoin(
      s.expedientes,
      eq(s.expedienteTareas.expedienteId, s.expedientes.id),
    )
    .innerJoin(s.empresas, eq(s.expedientes.empresaId, s.empresas.id))
    .where(eq(s.expedienteTareas.estado, "PENDIENTE"))
    .orderBy(asc(s.expedienteTareas.orden))
    .limit(limit);
}

/** Tras GANADA: una tarea por proveedor en Relaciones (+ fallback cotizaciones) */
export async function seedChecklistRecotizacion(
  expedienteId: string,
  asignadoA?: string | null,
) {
  const db = getDb();
  const existing = await db
    .select({ id: s.expedienteTareas.id })
    .from(s.expedienteTareas)
    .where(
      and(
        eq(s.expedienteTareas.expedienteId, expedienteId),
        eq(s.expedienteTareas.tipo, "RECOTIZAR_PROVEEDOR"),
      ),
    )
    .limit(1);
  if (existing.length) return;

  const rels = await db
    .select({
      proveedorId: s.partidaRelaciones.proveedorId,
      proveedorNombre: s.proveedores.razonSocial,
    })
    .from(s.partidaRelaciones)
    .leftJoin(
      s.proveedores,
      eq(s.partidaRelaciones.proveedorId, s.proveedores.id),
    )
    .where(eq(s.partidaRelaciones.expedienteId, expedienteId));

  const byProv = new Map<string, string>();
  for (const r of rels) {
    if (r.proveedorId && r.proveedorNombre) {
      byProv.set(r.proveedorId, r.proveedorNombre);
    }
  }

  if (byProv.size === 0) {
    const cots = await db
      .select({
        proveedorId: s.cotizacionesProveedor.proveedorId,
        proveedorNombre: s.proveedores.razonSocial,
        alias: s.cotizacionesProveedor.aliasEnExpediente,
      })
      .from(s.cotizacionesProveedor)
      .innerJoin(
        s.proveedores,
        eq(s.cotizacionesProveedor.proveedorId, s.proveedores.id),
      )
      .where(eq(s.cotizacionesProveedor.expedienteId, expedienteId));
    for (const c of cots) {
      byProv.set(c.proveedorId, `${c.proveedorNombre} (${c.alias})`);
    }
  }

  type Row = {
    expedienteId: string;
    tipo: string;
    titulo: string;
    orden: number;
    asignadoA: string | null;
    meta: Record<string, unknown>;
  };

  const rows: Row[] = [...byProv.entries()].map(([proveedorId, nombre], i) => ({
    expedienteId,
    tipo: "RECOTIZAR_PROVEEDOR",
    titulo: `Recotizar mejores precios · ${nombre}`,
    orden: 10 + i,
    asignadoA: asignadoA ?? null,
    meta: { proveedorId },
  }));

  if (rows.length === 0) {
    rows.push({
      expedienteId,
      tipo: "RECOTIZAR_PROVEEDOR",
      titulo: "Recotizar mejores precios con proveedores seleccionados",
      orden: 10,
      asignadoA: asignadoA ?? null,
      meta: {},
    });
  }

  // Checklist base post-ganada
  rows.push({
    expedienteId,
    tipo: "COMPRA",
    titulo: "Emitir orden de compra / confirmar proveedor ganador",
    orden: 50,
    asignadoA: asignadoA ?? null,
    meta: {},
  });
  rows.push({
    expedienteId,
    tipo: "ENTREGA",
    titulo: "Programar entrega en calendario",
    orden: 60,
    asignadoA: asignadoA ?? null,
    meta: {},
  });

  await db.insert(s.expedienteTareas).values(rows);
}

export async function seedTareaFacturar(
  expedienteId: string,
  opts: { folioRemision?: string; asignadoA?: string | null } = {},
) {
  const db = getDb();
  const existing = await db
    .select({ id: s.expedienteTareas.id })
    .from(s.expedienteTareas)
    .where(
      and(
        eq(s.expedienteTareas.expedienteId, expedienteId),
        eq(s.expedienteTareas.tipo, "FACTURAR"),
        eq(s.expedienteTareas.estado, "PENDIENTE"),
      ),
    )
    .limit(1);
  if (existing.length) return existing[0];

  const [row] = await db
    .insert(s.expedienteTareas)
    .values({
      expedienteId,
      tipo: "FACTURAR",
      titulo: opts.folioRemision
        ? `Facturar cobranza · remisión ${opts.folioRemision}`
        : "Facturar y gestionar cobranza",
      orden: 80,
      asignadoA: opts.asignadoA ?? null,
      meta: { folioRemision: opts.folioRemision ?? null },
    })
    .returning();
  return row;
}

export async function completarTarea(tareaId: string) {
  const db = getDb();
  await db
    .update(s.expedienteTareas)
    .set({ estado: "HECHO", completedAt: new Date() })
    .where(eq(s.expedienteTareas.id, tareaId));
}
