"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { nextRemisionFolio } from "@/lib/db/queries-modules";
import * as s from "@/lib/db/schema";
import type { TipoProveedor } from "@/lib/domain/proveedores";
import { TIPOS_PROVEEDOR } from "@/lib/domain/proveedores";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  const db = getDb();
  if (session.user.id === "demo-miguel") {
    const [u] = await db
      .select({ id: s.users.id })
      .from(s.users)
      .where(eq(s.users.email, "miguel@ylika.local"))
      .limit(1);
    return u?.id ?? null;
  }
  return session.user.id;
}

export async function createClienteAction(formData: FormData) {
  await requireUserId();
  const db = getDb();
  const tipo = String(formData.get("tipo") || "PRIVADO") as
    | "GOBIERNO"
    | "PRIVADO";
  const razonSocial = String(formData.get("razonSocial") || "").trim();
  if (!razonSocial) throw new Error("Razón social requerida");
  await db.insert(s.clientes).values({
    tipo,
    razonSocial,
    rfc: String(formData.get("rfc") || "") || null,
    dependencia: String(formData.get("dependencia") || "") || null,
    contactoNombre: String(formData.get("contactoNombre") || "") || null,
    contactoEmail: String(formData.get("contactoEmail") || "") || null,
    contactoTel: String(formData.get("contactoTel") || "") || null,
    direccion: String(formData.get("direccion") || "") || null,
  });
  revalidatePath("/app/clientes");
}

function parseEspecialidades(raw: string): string[] {
  return raw
    .split(/[,;|/]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export async function createProveedorAction(formData: FormData) {
  await requireUserId();
  const db = getDb();
  const razonSocial = String(formData.get("razonSocial") || "").trim();
  if (!razonSocial) throw new Error("Razón social requerida");
  const tipoRaw = String(formData.get("tipo") || "MATERIALES");
  const tipo = (
    TIPOS_PROVEEDOR.includes(tipoRaw as TipoProveedor)
      ? tipoRaw
      : "MATERIALES"
  ) as TipoProveedor;
  const especialidades = parseEspecialidades(
    String(formData.get("especialidades") || ""),
  );
  const calificacion = Math.min(
    5,
    Math.max(1, Number(formData.get("calificacion") || 3) || 3),
  );
  const preferido = formData.get("preferido") === "on";
  const marcaIds = formData.getAll("marcaIds").map(String).filter(Boolean);

  const [prov] = await db
    .insert(s.proveedores)
    .values({
      razonSocial,
      rfc: String(formData.get("rfc") || "") || null,
      aliasCorto: String(formData.get("aliasCorto") || "") || null,
      contactoNombre: String(formData.get("contactoNombre") || "") || null,
      contactoEmail: String(formData.get("contactoEmail") || "") || null,
      contactoTel: String(formData.get("contactoTel") || "") || null,
      condicionesPago: String(formData.get("condicionesPago") || "") || null,
      tipo,
      especialidades,
      zonaCobertura: String(formData.get("zonaCobertura") || "") || null,
      preferido,
      calificacion,
      notas: String(formData.get("notas") || "") || null,
    })
    .returning();

  if (marcaIds.length && prov) {
    await db.insert(s.proveedorMarcas).values(
      marcaIds.map((marcaId) => ({
        proveedorId: prov.id,
        marcaId,
      })),
    );
  }

  revalidatePath("/app/compras");
}

export async function createMarcaAction(formData: FormData) {
  await requireUserId();
  const db = getDb();
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) throw new Error("Nombre de marca requerido");
  const categoria = String(formData.get("categoria") || "GENERAL").trim();
  const existing = await db
    .select()
    .from(s.marcas)
    .where(eq(s.marcas.nombre, nombre))
    .limit(1);
  if (!existing.length) {
    await db.insert(s.marcas).values({ nombre, categoria });
  }
  revalidatePath("/app/compras");
}

export async function upsertPartidaRelacionAction(formData: FormData) {
  await requireUserId();
  const db = getDb();
  const expedienteId = String(formData.get("expedienteId") || "");
  const partidaId = String(formData.get("partidaId") || "");
  const proveedorId = String(formData.get("proveedorId") || "") || null;
  const marcaId = String(formData.get("marcaId") || "") || null;
  const marcaTexto = String(formData.get("marcaTexto") || "").trim() || null;
  const notas = String(formData.get("notas") || "").trim() || null;
  if (!expedienteId || !partidaId) throw new Error("Faltan datos");

  const [existing] = await db
    .select()
    .from(s.partidaRelaciones)
    .where(
      and(
        eq(s.partidaRelaciones.expedienteId, expedienteId),
        eq(s.partidaRelaciones.partidaId, partidaId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(s.partidaRelaciones)
      .set({
        proveedorId,
        marcaId,
        marcaTexto,
        notas,
        origen: "MANUAL",
      })
      .where(eq(s.partidaRelaciones.id, existing.id));
  } else {
    await db.insert(s.partidaRelaciones).values({
      expedienteId,
      partidaId,
      proveedorId,
      marcaId,
      marcaTexto,
      notas,
      origen: "MANUAL",
    });
  }

  revalidatePath(`/app/comercial/${expedienteId}`);
}

/** Sincroniza Relaciones desde la selección del comparativo (P1/P2…) */
export async function syncRelacionesFromComparativo(
  expedienteId: string,
  seleccion: Record<string, string>,
) {
  const db = getDb();
  const cots = await db
    .select({
      id: s.cotizacionesProveedor.id,
      alias: s.cotizacionesProveedor.aliasEnExpediente,
      proveedorId: s.cotizacionesProveedor.proveedorId,
    })
    .from(s.cotizacionesProveedor)
    .where(eq(s.cotizacionesProveedor.expedienteId, expedienteId));

  const aliasToProv = Object.fromEntries(
    cots.map((c) => [c.alias, c.proveedorId]),
  );

  for (const [partidaId, alias] of Object.entries(seleccion)) {
    const proveedorId = aliasToProv[alias];
    if (!proveedorId) continue;

    const [partida] = await db
      .select()
      .from(s.partidas)
      .where(eq(s.partidas.id, partidaId))
      .limit(1);
    if (!partida) continue;

    const [existing] = await db
      .select()
      .from(s.partidaRelaciones)
      .where(
        and(
          eq(s.partidaRelaciones.expedienteId, expedienteId),
          eq(s.partidaRelaciones.partidaId, partidaId),
        ),
      )
      .limit(1);

    const payload = {
      proveedorId,
      marcaTexto: partida.marcaSolicitada,
      origen: "COMPARATIVO",
    };

    if (existing) {
      await db
        .update(s.partidaRelaciones)
        .set(payload)
        .where(eq(s.partidaRelaciones.id, existing.id));
    } else {
      await db.insert(s.partidaRelaciones).values({
        expedienteId,
        partidaId,
        ...payload,
      });
    }
  }
}

/** Al entrar a ENTREGA: crea remisión programada si no existe */
export async function ensureRemisionProgramada(expedienteId: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(s.remisiones)
    .where(eq(s.remisiones.expedienteId, expedienteId))
    .limit(1);
  if (existing.length) return existing[0];

  const [exp] = await db
    .select({
      id: s.expedientes.id,
      empresaId: s.expedientes.empresaId,
      codigo: s.empresas.codigo,
      titulo: s.solicitudes.titulo,
      clienteNombre: s.clientes.razonSocial,
      clienteDir: s.clientes.direccion,
    })
    .from(s.expedientes)
    .innerJoin(s.empresas, eq(s.expedientes.empresaId, s.empresas.id))
    .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
    .leftJoin(s.clientes, eq(s.solicitudes.clienteId, s.clientes.id))
    .where(eq(s.expedientes.id, expedienteId))
    .limit(1);
  if (!exp) return null;

  const folio = await nextRemisionFolio(exp.codigo);
  const programada = new Date();
  programada.setDate(programada.getDate() + 3);
  programada.setHours(10, 0, 0, 0);

  const [rem] = await db
    .insert(s.remisiones)
    .values({
      expedienteId,
      empresaId: exp.empresaId,
      folio,
      destinatario: exp.clienteNombre ?? "Destinatario por confirmar",
      direccionEntrega: exp.clienteDir ?? null,
      fechaProgramada: programada,
      responsableEntrega: "Operaciones",
      estatus: "BORRADOR",
      notas: `Auto-programada al pasar a Entrega · ${exp.titulo}`,
    })
    .returning();

  const partidas = await db
    .select()
    .from(s.partidas)
    .where(eq(s.partidas.expedienteId, expedienteId));
  if (partidas.length && rem) {
    await db.insert(s.remisionPartidas).values(
      partidas.map((p) => ({
        remisionId: rem.id,
        partidaId: p.id,
        descripcion: p.descripcion,
        cantidad: p.cantidad,
        unidad: p.unidad,
      })),
    );
  }

  revalidatePath("/app/entregas");
  revalidatePath("/app");
  return rem;
}

export async function createRemisionAction(formData: FormData) {
  const userId = await requireUserId();
  const db = getDb();
  const expedienteId = String(formData.get("expedienteId") || "");
  const destinatario = String(formData.get("destinatario") || "").trim();
  const direccion = String(formData.get("direccionEntrega") || "").trim();
  const notas = String(formData.get("notas") || "") || null;
  const responsableEntrega =
    String(formData.get("responsableEntrega") || "").trim() || null;
  const fechaProgramadaRaw = String(formData.get("fechaProgramada") || "");
  if (!expedienteId || !destinatario) throw new Error("Faltan datos");

  const [exp] = await db
    .select({
      id: s.expedientes.id,
      empresaId: s.expedientes.empresaId,
      codigo: s.empresas.codigo,
    })
    .from(s.expedientes)
    .innerJoin(s.empresas, eq(s.expedientes.empresaId, s.empresas.id))
    .where(eq(s.expedientes.id, expedienteId))
    .limit(1);
  if (!exp) throw new Error("Expediente no encontrado");

  const folio = await nextRemisionFolio(exp.codigo);
  const fechaProgramada = fechaProgramadaRaw
    ? new Date(`${fechaProgramadaRaw}T10:00:00`)
    : new Date(Date.now() + 3 * 86400_000);

  const [rem] = await db
    .insert(s.remisiones)
    .values({
      expedienteId,
      empresaId: exp.empresaId,
      folio,
      destinatario,
      direccionEntrega: direccion || null,
      fechaEntrega: null,
      fechaProgramada,
      responsableEntrega,
      estatus: "EMITIDA",
      notas,
      creadoPor: userId,
    })
    .returning();

  const partidas = await db
    .select()
    .from(s.partidas)
    .where(eq(s.partidas.expedienteId, expedienteId));

  if (partidas.length) {
    await db.insert(s.remisionPartidas).values(
      partidas.map((p) => ({
        remisionId: rem.id,
        partidaId: p.id,
        descripcion: p.descripcion,
        cantidad: p.cantidad,
        unidad: p.unidad,
      })),
    );
  }

  await db
    .update(s.expedientes)
    .set({ estatus: "ENTREGA", updatedAt: new Date() })
    .where(eq(s.expedientes.id, expedienteId));

  await db.insert(s.bitacora).values({
    expedienteId,
    userId,
    accion: `Remisión ${folio} emitida · programada ${fechaProgramada.toLocaleDateString("es-MX")}`,
    aEstatus: "ENTREGA",
    detalle: { remisionId: rem.id, folio, fechaProgramada },
  });

  await db.insert(s.documentos).values({
    expedienteId,
    empresaId: exp.empresaId,
    tipo: "REMISION",
    nombre: `${folio}.pdf`,
    storagePath: `remisiones/${folio}`,
    uploadedBy: userId,
  });

  revalidatePath("/app/entregas");
  revalidatePath("/app/documentos");
  revalidatePath("/app/tesoreria");
  revalidatePath("/app");
  revalidatePath(`/app/comercial/${expedienteId}`);
}

export async function updateRemisionProgramacionAction(formData: FormData) {
  await requireUserId();
  const db = getDb();
  const remisionId = String(formData.get("remisionId") || "");
  const fechaProgramadaRaw = String(formData.get("fechaProgramada") || "");
  const responsableEntrega =
    String(formData.get("responsableEntrega") || "").trim() || null;
  const direccionEntrega =
    String(formData.get("direccionEntrega") || "").trim() || null;
  if (!remisionId) throw new Error("Remisión requerida");

  await db
    .update(s.remisiones)
    .set({
      fechaProgramada: fechaProgramadaRaw
        ? new Date(`${fechaProgramadaRaw}T10:00:00`)
        : null,
      responsableEntrega,
      direccionEntrega,
    })
    .where(eq(s.remisiones.id, remisionId));

  revalidatePath("/app/entregas");
  revalidatePath("/app");
}

export async function marcarRemisionEntregadaAction(formData: FormData) {
  const userId = await requireUserId();
  const db = getDb();
  const remisionId = String(formData.get("remisionId") || "");
  if (!remisionId) throw new Error("Remisión requerida");
  const [rem] = await db
    .select()
    .from(s.remisiones)
    .where(eq(s.remisiones.id, remisionId))
    .limit(1);
  if (!rem) throw new Error("Remisión no encontrada");

  // Asigna Itza como responsable de cobranza
  const [itza] = await db
    .select({ id: s.users.id })
    .from(s.users)
    .where(eq(s.users.email, "itza@ylika.local"))
    .limit(1);

  await db
    .update(s.remisiones)
    .set({
      estatus: "ENTREGADA",
      fechaEntrega: new Date(),
      recibidoPorFinanzasId: itza?.id ?? userId,
    })
    .where(eq(s.remisiones.id, remisionId));

  await db
    .update(s.expedientes)
    .set({
      estatus: "COBRANZA",
      updatedAt: new Date(),
      responsableActualId: itza?.id ?? rem.recibidoPorFinanzasId,
    })
    .where(eq(s.expedientes.id, rem.expedienteId));

  await db.insert(s.bitacora).values({
    expedienteId: rem.expedienteId,
    userId,
    accion: `Remisión ${rem.folio} entregada → cobranza Itza`,
    deEstatus: "ENTREGA",
    aEstatus: "COBRANZA",
  });

  try {
    const { ensureDriveSchema } = await import("@/lib/db/ensure-drive-schema");
    await ensureDriveSchema();
    const [cob] = await db
      .select({ id: s.cobranzas.id })
      .from(s.cobranzas)
      .where(eq(s.cobranzas.expedienteId, rem.expedienteId))
      .limit(1);
    if (!cob) {
      await db.insert(s.cobranzas).values({
        expedienteId: rem.expedienteId,
        remisionId: rem.id,
        estatus: "PENDIENTE",
      });
    }
  } catch {
    /* cobranzas table may self-heal next request */
  }

  // Draft factura (placeholder) + tarea FACTURAR para Itza
  const draftName = `FACT-${rem.folio}.pdf`;
  const existingDoc = await db
    .select({ id: s.documentos.id })
    .from(s.documentos)
    .where(
      and(
        eq(s.documentos.expedienteId, rem.expedienteId),
        eq(s.documentos.tipo, "FACTURA"),
      ),
    )
    .limit(1);
  if (!existingDoc.length) {
    await db.insert(s.documentos).values({
      expedienteId: rem.expedienteId,
      empresaId: rem.empresaId,
      tipo: "FACTURA",
      nombre: draftName,
      storagePath: `facturas/draft/${draftName}`,
      uploadedBy: itza?.id ?? userId,
    });
  }

  const { seedTareaFacturar } = await import("@/lib/db/tareas");
  await seedTareaFacturar(rem.expedienteId, {
    folioRemision: rem.folio,
    asignadoA: itza?.id ?? null,
  });

  // Recordatorio bot a Itza hoy +2h
  if (itza?.id) {
    const cuando = new Date(Date.now() + 2 * 3600_000);
    await db.insert(s.botRecordatorios).values({
      userId: itza.id,
      texto: `Cobranza lista · remisión ${rem.folio} — revisar draft factura`,
      cuando,
      meta: {
        expedienteId: rem.expedienteId,
        remisionId: rem.id,
        tipo: "COBRANZA",
      },
    });
  }

  // Marca tarea ENTREGA del checklist si existía
  await db
    .update(s.expedienteTareas)
    .set({ estado: "HECHO", completedAt: new Date() })
    .where(
      and(
        eq(s.expedienteTareas.expedienteId, rem.expedienteId),
        eq(s.expedienteTareas.tipo, "ENTREGA"),
        eq(s.expedienteTareas.estado, "PENDIENTE"),
      ),
    );

  revalidatePath("/app/entregas");
  revalidatePath("/app/documentos");
  revalidatePath("/app/tesoreria");
  revalidatePath("/app");
  revalidatePath(`/app/comercial/${rem.expedienteId}`);
}

export async function updateBolsaUrlAction(formData: FormData) {
  await requireUserId();
  const db = getDb();
  const url = String(formData.get("url") || "").trim() || null;
  const [existing] = await db
    .select()
    .from(s.modulosExternos)
    .where(eq(s.modulosExternos.codigo, "BOLSA"))
    .limit(1);
  if (existing) {
    await db
      .update(s.modulosExternos)
      .set({ url, updatedAt: new Date() })
      .where(eq(s.modulosExternos.id, existing.id));
  } else {
    await db.insert(s.modulosExternos).values({
      codigo: "BOLSA",
      nombre: "Administración de Bolsa",
      url,
      embed: true,
    });
  }
  revalidatePath("/app/tesoreria");
  revalidatePath("/app/configuracion");
}

export async function registerDocumentoMetaAction(formData: FormData) {
  const userId = await requireUserId();
  const db = getDb();
  const expedienteId = String(formData.get("expedienteId") || "") || null;
  const nombre = String(formData.get("nombre") || "").trim();
  const tipo = String(formData.get("tipo") || "OTRO") as
    | "BASE_LICITACION"
    | "LISTA_LIMPIA"
    | "COTIZACION_PROVEEDOR"
    | "COTIZACION_FINAL"
    | "PROPUESTA_ECONOMICA"
    | "PROPUESTA_TECNICA"
    | "CONSTANCIA_EMPRESA"
    | "FALLO"
    | "CONTRATO"
    | "OC"
    | "REMISION"
    | "FACTURA"
    | "OTRO";
  if (!nombre) throw new Error("Nombre requerido");

  let empresaId: string | null = null;
  if (expedienteId) {
    const [e] = await db
      .select({ empresaId: s.expedientes.empresaId })
      .from(s.expedientes)
      .where(eq(s.expedientes.id, expedienteId))
      .limit(1);
    empresaId = e?.empresaId ?? null;
  }

  await db.insert(s.documentos).values({
    expedienteId,
    empresaId,
    tipo,
    nombre,
    storagePath: `manual/${Date.now()}-${nombre}`,
    uploadedBy: userId,
  });
  revalidatePath("/app/documentos");
}
