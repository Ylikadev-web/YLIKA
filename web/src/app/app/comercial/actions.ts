"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { nextExpedienteCodigo } from "@/lib/db/queries";
import * as s from "@/lib/db/schema";
import {
  buildCotizacionFinal,
  type SelectionMode,
} from "@/lib/quotes/comparativo";
import { precioConIva } from "@/lib/parsing/excel-partidas";
import type { EstatusExpediente } from "@/lib/domain/workflow";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session.user;
}

async function logBitacora(
  expedienteId: string,
  userId: string | undefined,
  accion: string,
  de?: EstatusExpediente,
  a?: EstatusExpediente,
  detalle: Record<string, unknown> = {},
) {
  const db = getDb();
  await db.insert(s.bitacora).values({
    expedienteId,
    userId: userId && userId !== "demo-miguel" ? userId : null,
    accion,
    deEstatus: de,
    aEstatus: a,
    detalle,
  });
}

export async function createExpedienteAction(formData: FormData) {
  const user = await requireUser();
  const db = getDb();

  const empresaId = String(formData.get("empresaId") || "");
  const sector = String(formData.get("sector") || "GOBIERNO") as
    | "GOBIERNO"
    | "PRIVADO";
  const tipoSolicitudId = String(formData.get("tipoSolicitudId") || "");
  const titulo = String(formData.get("titulo") || "").trim();
  const clienteNombre = String(formData.get("clienteNombre") || "").trim();
  const folioExterno = String(formData.get("folioExterno") || "").trim() || null;
  const caracter = String(formData.get("caracter") || "").trim() || null;

  if (!empresaId || !tipoSolicitudId || !titulo) {
    throw new Error("Faltan campos obligatorios");
  }

  let clienteId: string | null = null;
  if (clienteNombre) {
    const [cli] = await db
      .insert(s.clientes)
      .values({
        tipo: sector,
        razonSocial: clienteNombre,
      })
      .returning();
    clienteId = cli.id;
  }

  const userId =
    user.id === "demo-miguel"
      ? (
          await db
            .select({ id: s.users.id })
            .from(s.users)
            .where(eq(s.users.email, "miguel@ylika.local"))
            .limit(1)
        )[0]?.id
      : user.id;

  const [solicitud] = await db
    .insert(s.solicitudes)
    .values({
      empresaId,
      sector,
      tipoSolicitudId,
      clienteId,
      titulo,
      folioExterno,
      caracter,
      createdBy: userId ?? null,
    })
    .returning();

  const codigo = await nextExpedienteCodigo(empresaId);
  const estatusInicial =
    sector === "GOBIERNO" ? "REVISION_REQUISITOS" : "ORDEN_COTIZAR";

  const [expediente] = await db
    .insert(s.expedientes)
    .values({
      codigo,
      solicitudId: solicitud.id,
      empresaId,
      estatus: estatusInicial,
      responsableActualId: userId ?? null,
      markupPct: "12",
    })
    .returning();

  await logBitacora(
    expediente.id,
    userId,
    "Expediente creado",
    undefined,
    estatusInicial,
    { titulo, codigo },
  );

  revalidatePath("/app/comercial");
  revalidatePath("/app");
  return { id: expediente.id, codigo };
}

async function resolveUserIdByEmail(email: string) {
  const db = getDb();
  const [u] = await db
    .select({ id: s.users.id })
    .from(s.users)
    .where(eq(s.users.email, email))
    .limit(1);
  return u?.id ?? null;
}

export async function transitionExpedienteAction(
  expedienteId: string,
  hacia: EstatusExpediente,
  nota?: string,
) {
  const user = await requireUser();
  const db = getDb();
  const [exp] = await db
    .select()
    .from(s.expedientes)
    .where(eq(s.expedientes.id, expedienteId))
    .limit(1);
  if (!exp) throw new Error("Expediente no encontrado");

  const userId =
    user.id === "demo-miguel"
      ? await resolveUserIdByEmail("miguel@ylika.local")
      : user.id;

  // Asigna responsable según etapa (si existe el usuario seed)
  let responsableId = exp.responsableActualId;
  if (hacia === "PROPUESTA_ADMIN" || hacia === "COBRANZA") {
    responsableId =
      (await resolveUserIdByEmail("itza@ylika.local")) ?? responsableId;
  } else if (hacia === "REVISION_DIRECTOR" || hacia === "ENVIADA") {
    responsableId =
      (await resolveUserIdByEmail("nesim@ylika.local")) ?? responsableId;
  } else if (
    hacia === "REVISION_REQUISITOS" ||
    hacia === "ORDEN_COTIZAR"
  ) {
    responsableId =
      (await resolveUserIdByEmail("laura@ylika.local")) ?? responsableId;
  } else if (
    hacia === "EN_COTIZACION" ||
    hacia === "COMPARATIVO" ||
    hacia === "COTIZACION_FINAL" ||
    hacia === "RECOTIZACION" ||
    hacia === "COMPRA"
  ) {
    responsableId = userId ?? responsableId;
  }

  await db
    .update(s.expedientes)
    .set({
      estatus: hacia,
      updatedAt: new Date(),
      responsableActualId: responsableId,
      aptoRequisitos:
        hacia === "APTO" || hacia === "ORDEN_COTIZAR"
          ? true
          : hacia === "CANCELADO"
            ? false
            : exp.aptoRequisitos,
      aptoNotas: nota ?? exp.aptoNotas,
    })
    .where(eq(s.expedientes.id, expedienteId));

  await logBitacora(
    expedienteId,
    userId,
    nota || `Transición a ${hacia}`,
    exp.estatus,
    hacia,
  );

  // Auto: al llegar a ENTREGA, calendizar remisión borrador (+3 días)
  if (hacia === "ENTREGA") {
    const { ensureRemisionProgramada } = await import(
      "@/app/app/actions-modules"
    );
    await ensureRemisionProgramada(expedienteId);
    revalidatePath("/app/entregas");
  }

  revalidatePath(`/app/comercial/${expedienteId}`);
  revalidatePath("/app/comercial");
  revalidatePath("/app/licitaciones");
  revalidatePath("/app/propuestas");
  revalidatePath("/app");
}

export async function replacePartidasAction(
  expedienteId: string,
  rows: {
    numero: number;
    descripcion: string;
    cantidad: number;
    unidad: string;
    marca?: string;
    especificacion?: string;
  }[],
) {
  await requireUser();
  const db = getDb();
  await db.delete(s.partidas).where(eq(s.partidas.expedienteId, expedienteId));
  if (rows.length) {
    await db.insert(s.partidas).values(
      rows.map((r) => ({
        expedienteId,
        numero: r.numero,
        descripcion: r.descripcion,
        cantidad: String(r.cantidad),
        unidad: r.unidad || "PZA",
        marcaSolicitada: r.marca || null,
        especificacion: r.especificacion || null,
      })),
    );
  }
  await db
    .update(s.expedientes)
    .set({ updatedAt: new Date(), estatus: "EN_COTIZACION" })
    .where(eq(s.expedientes.id, expedienteId));

  revalidatePath(`/app/comercial/${expedienteId}`);
}

export async function upsertProveedorCotizacionAction(input: {
  expedienteId: string;
  proveedorNombre: string;
  alias: string;
  incluyeIva: boolean;
  lineas: {
    partidaId: string;
    precio: number;
    entregaDias?: number;
    pctNacional?: number;
    marca?: string;
  }[];
}) {
  const user = await requireUser();
  const db = getDb();

  let [prov] = await db
    .select()
    .from(s.proveedores)
    .where(eq(s.proveedores.razonSocial, input.proveedorNombre))
    .limit(1);
  if (!prov) {
    [prov] = await db
      .insert(s.proveedores)
      .values({ razonSocial: input.proveedorNombre })
      .returning();
  }

  const existing = await db
    .select()
    .from(s.cotizacionesProveedor)
    .where(
      and(
        eq(s.cotizacionesProveedor.expedienteId, input.expedienteId),
        eq(s.cotizacionesProveedor.aliasEnExpediente, input.alias),
      ),
    )
    .limit(1);

  let cotId: string;
  if (existing[0]) {
    cotId = existing[0].id;
    await db
      .delete(s.cotizacionPartidas)
      .where(eq(s.cotizacionPartidas.cotizacionId, cotId));
    await db
      .update(s.cotizacionesProveedor)
      .set({
        proveedorId: prov.id,
        incluyeIva: input.incluyeIva,
        parseStatus: "PARSED",
      })
      .where(eq(s.cotizacionesProveedor.id, cotId));
  } else {
    const userId =
      user.id === "demo-miguel"
        ? (
            await db
              .select({ id: s.users.id })
              .from(s.users)
              .where(eq(s.users.email, "miguel@ylika.local"))
              .limit(1)
          )[0]?.id
        : user.id;
    const [cot] = await db
      .insert(s.cotizacionesProveedor)
      .values({
        expedienteId: input.expedienteId,
        proveedorId: prov.id,
        aliasEnExpediente: input.alias,
        incluyeIva: input.incluyeIva,
        parseStatus: "PARSED",
        createdBy: userId ?? null,
      })
      .returning();
    cotId = cot.id;
  }

  if (input.lineas.length) {
    await db.insert(s.cotizacionPartidas).values(
      input.lineas.map((l) => {
        const conIva = precioConIva(l.precio, input.incluyeIva);
        return {
          cotizacionId: cotId,
          partidaId: l.partidaId,
          precioUnitarioConIva: String(conIva),
          precioUnitarioSinIva: String(Number((conIva / 1.16).toFixed(4))),
          tiempoEntregaDias: l.entregaDias ?? null,
          pctContenidoNacional:
            l.pctNacional != null ? String(l.pctNacional) : null,
          marcaOfertada: l.marca ?? null,
          matchConfidence: "1",
          matchManual: true,
        };
      }),
    );
  }

  revalidatePath(`/app/comercial/${input.expedienteId}`);
  return { cotizacionId: cotId };
}

export async function setSeleccionComparativoAction(input: {
  expedienteId: string;
  /** partidaId → alias P1/P2 */
  seleccion: Record<string, string>;
  criterio: SelectionMode;
  markupPct: number;
}) {
  await requireUser();
  const db = getDb();

  const cots = await db
    .select()
    .from(s.cotizacionesProveedor)
    .where(eq(s.cotizacionesProveedor.expedienteId, input.expedienteId));

  const cotIds = cots.map((c) => c.id);
  if (!cotIds.length) return;

  // clear all selected
  for (const id of cotIds) {
    await db
      .update(s.cotizacionPartidas)
      .set({ seleccionado: false })
      .where(eq(s.cotizacionPartidas.cotizacionId, id));
  }

  const lineas = await db
    .select()
    .from(s.cotizacionPartidas)
    .where(inArray(s.cotizacionPartidas.cotizacionId, cotIds));

  const aliasByCot = Object.fromEntries(cots.map((c) => [c.id, c.aliasEnExpediente]));

  for (const linea of lineas) {
    if (!linea.partidaId) continue;
    const wanted = input.seleccion[linea.partidaId];
    if (wanted && aliasByCot[linea.cotizacionId] === wanted) {
      await db
        .update(s.cotizacionPartidas)
        .set({ seleccionado: true })
        .where(eq(s.cotizacionPartidas.id, linea.id));
    }
  }

  await db
    .update(s.expedientes)
    .set({
      criterioSeleccion: input.criterio,
      markupPct: String(input.markupPct),
      estatus: "COMPARATIVO",
      updatedAt: new Date(),
    })
    .where(eq(s.expedientes.id, input.expedienteId));

  // Auto: Relaciones partida ↔ proveedor desde selección P1/P2…
  const { syncRelacionesFromComparativo } = await import(
    "@/app/app/actions-modules"
  );
  await syncRelacionesFromComparativo(input.expedienteId, input.seleccion);

  revalidatePath(`/app/comercial/${input.expedienteId}`);
}

export async function generarCotizacionFinalAction(input: {
  expedienteId: string;
  markupPct: number;
  criterio: SelectionMode;
  seleccion: Record<string, string>; // partidaId -> alias
}) {
  const user = await requireUser();
  const db = getDb();

  await setSeleccionComparativoAction({
    expedienteId: input.expedienteId,
    seleccion: input.seleccion,
    criterio: input.criterio,
    markupPct: input.markupPct,
  });

  const partidas = await db
    .select()
    .from(s.partidas)
    .where(eq(s.partidas.expedienteId, input.expedienteId))
    .orderBy(asc(s.partidas.numero));

  const cots = await db
    .select()
    .from(s.cotizacionesProveedor)
    .where(eq(s.cotizacionesProveedor.expedienteId, input.expedienteId));

  const aliasToCot = Object.fromEntries(
    cots.map((c) => [c.aliasEnExpediente, c.id]),
  );

  const selected: Record<number, { alias: string; precio: number }> = {};
  for (const p of partidas) {
    const alias = input.seleccion[p.id];
    if (!alias) continue;
    const cotId = aliasToCot[alias];
    if (!cotId) continue;
    const [linea] = await db
      .select()
      .from(s.cotizacionPartidas)
      .where(
        and(
          eq(s.cotizacionPartidas.cotizacionId, cotId),
          eq(s.cotizacionPartidas.partidaId, p.id),
        ),
      )
      .limit(1);
    if (!linea?.precioUnitarioConIva) continue;
    selected[p.numero] = {
      alias,
      precio: Number(linea.precioUnitarioConIva),
    };
  }

  const lines = buildCotizacionFinal({
    partidas: partidas.map((p) => ({
      numero: p.numero,
      descripcion: p.descripcion,
      cantidad: Number(p.cantidad),
      unidad: p.unidad,
    })),
    selected,
    markupPct: input.markupPct,
  });

  const versions = await db
    .select({ version: s.cotizacionesFinales.version })
    .from(s.cotizacionesFinales)
    .where(eq(s.cotizacionesFinales.expedienteId, input.expedienteId));
  const nextVersion =
    (versions.reduce((m, v) => Math.max(m, v.version), 0) || 0) + 1;

  const userId =
    user.id === "demo-miguel"
      ? (
          await db
            .select({ id: s.users.id })
            .from(s.users)
            .where(eq(s.users.email, "miguel@ylika.local"))
            .limit(1)
        )[0]?.id
      : user.id;

  const archivoPath = `/app/comercial/${input.expedienteId}/cotizacion/${nextVersion}`;

  const [final] = await db
    .insert(s.cotizacionesFinales)
    .values({
      expedienteId: input.expedienteId,
      version: nextVersion,
      markupPctAplicado: String(input.markupPct),
      criterio: input.criterio,
      generadoPor: userId ?? null,
      archivoPath,
      payload: { lineas: lines },
    })
    .returning();

  await db
    .update(s.expedientes)
    .set({
      estatus: "COTIZACION_FINAL",
      markupPct: String(input.markupPct),
      criterioSeleccion: input.criterio,
      updatedAt: new Date(),
    })
    .where(eq(s.expedientes.id, input.expedienteId));

  const [expMeta] = await db
    .select({
      empresaId: s.expedientes.empresaId,
      codigo: s.expedientes.codigo,
    })
    .from(s.expedientes)
    .where(eq(s.expedientes.id, input.expedienteId))
    .limit(1);

  if (expMeta) {
    await db.insert(s.documentos).values({
      expedienteId: input.expedienteId,
      empresaId: expMeta.empresaId,
      tipo: "COTIZACION_FINAL",
      nombre: `${expMeta.codigo}-cotizacion-v${nextVersion}.pdf`,
      storagePath: archivoPath,
      uploadedBy: userId ?? null,
    });
  }

  await logBitacora(
    input.expedienteId,
    userId,
    `Cotización final v${nextVersion} generada`,
    "COMPARATIVO",
    "COTIZACION_FINAL",
    { version: nextVersion, markupPct: input.markupPct, archivoPath },
  );

  revalidatePath(`/app/comercial/${input.expedienteId}`);
  revalidatePath(`/app/comercial/${input.expedienteId}/cotizacion/${nextVersion}`);
  revalidatePath("/app/comercial");
  revalidatePath("/app/documentos");
  return {
    id: final.id,
    version: nextVersion,
    lineas: lines,
    printUrl: archivoPath,
  };
}

export async function upsertDocumentoEmpresaAction(formData: FormData) {
  const user = await requireUser();
  const db = getDb();
  const empresaId = String(formData.get("empresaId") || "");
  const nombre = String(formData.get("nombre") || "").trim();
  const categoria = String(formData.get("categoria") || "GENERAL");
  const venceStr = String(formData.get("fechaVencimiento") || "");
  const notas = String(formData.get("notas") || "") || null;
  if (!empresaId || !nombre) throw new Error("Faltan datos");

  const fechaVencimiento = venceStr ? new Date(venceStr) : null;
  const { calcEstadoDoc } = await import("@/lib/db/queries");
  const estado = calcEstadoDoc(fechaVencimiento);

  const userId =
    user.id === "demo-miguel"
      ? (
          await db
            .select({ id: s.users.id })
            .from(s.users)
            .where(eq(s.users.email, "miguel@ylika.local"))
            .limit(1)
        )[0]?.id
      : user.id;

  await db.insert(s.documentosEmpresa).values({
    empresaId,
    nombre,
    categoria,
    fechaVencimiento,
    estado,
    notas,
    updatedBy: userId ?? null,
  });

  revalidatePath("/app/licitaciones");
}

export async function luzVerdeAction(expedienteId: string, ordenCotizar: boolean) {
  if (ordenCotizar) {
    await transitionExpedienteAction(expedienteId, "APTO", "Luz verde Laura");
    await transitionExpedienteAction(
      expedienteId,
      "ORDEN_COTIZAR",
      "Orden de cotizar → Compras/Ventas",
    );
  } else {
    await transitionExpedienteAction(expedienteId, "APTO", "Luz verde Laura");
  }
}

export async function noParticipamosAction(expedienteId: string) {
  await transitionExpedienteAction(
    expedienteId,
    "CANCELADO",
    "No participamos — requisitos / decisión Laura",
  );
}

/** Itza: propuesta lista → revisión director */
export async function enviarADirectorAction(formData: FormData) {
  const expedienteId = String(formData.get("expedienteId") || "");
  if (!expedienteId) throw new Error("Expediente requerido");
  await transitionExpedienteAction(
    expedienteId,
    "REVISION_DIRECTOR",
    "Propuesta económica/técnica lista → Nesim",
  );
  revalidatePath("/app/propuestas");
  revalidatePath("/app");
}

/** Nesim: envía al cliente */
export async function marcarEnviadaAction(formData: FormData) {
  const expedienteId = String(formData.get("expedienteId") || "");
  if (!expedienteId) throw new Error("Expediente requerido");
  await transitionExpedienteAction(
    expedienteId,
    "ENVIADA",
    "Propuesta enviada por Director",
  );
  revalidatePath("/app/propuestas");
  revalidatePath("/app");
}

export async function marcarGanadaAction(formData: FormData) {
  const user = await requireUser();
  const expedienteId = String(formData.get("expedienteId") || "");
  if (!expedienteId) throw new Error("Expediente requerido");
  await transitionExpedienteAction(expedienteId, "GANADA", "Fallo: ganada");
  await transitionExpedienteAction(
    expedienteId,
    "RECOTIZACION",
    "Ganada → recotizar mejores precios",
  );

  // Auto checklist: recotizar por proveedor en Relaciones
  const userId =
    user.id === "demo-miguel"
      ? await resolveUserIdByEmail("miguel@ylika.local")
      : user.id;
  const { seedChecklistRecotizacion } = await import("@/lib/db/tareas");
  await seedChecklistRecotizacion(expedienteId, userId);

  // Recordatorio bot a Miguel/Ventas (mañana 9:00)
  if (userId) {
    const db = getDb();
    const cuando = new Date();
    cuando.setDate(cuando.getDate() + 1);
    cuando.setHours(9, 0, 0, 0);
    await db.insert(s.botRecordatorios).values({
      userId,
      texto: "Recotizar expediente ganado — revisa el checklist",
      cuando,
      meta: { expedienteId, tipo: "RECOTIZACION" },
    });
  }

  revalidatePath(`/app/comercial/${expedienteId}`);
  revalidatePath("/app/propuestas");
  revalidatePath("/app");
}

export async function completarTareaExpedienteAction(formData: FormData) {
  await requireUser();
  const tareaId = String(formData.get("tareaId") || "");
  const expedienteId = String(formData.get("expedienteId") || "");
  if (!tareaId) throw new Error("Tarea requerida");
  const { completarTarea } = await import("@/lib/db/tareas");
  await completarTarea(tareaId);
  revalidatePath(`/app/comercial/${expedienteId}`);
  revalidatePath("/app");
}

export async function marcarPerdidaAction(formData: FormData) {
  const expedienteId = String(formData.get("expedienteId") || "");
  if (!expedienteId) throw new Error("Expediente requerido");
  await transitionExpedienteAction(expedienteId, "PERDIDA", "Fallo: perdida");
  revalidatePath("/app/propuestas");
  revalidatePath("/app");
}

/** Elimina la solicitud (y el expediente en cascada). Requiere confirmar el folio. */
export async function eliminarSolicitudAction(formData: FormData) {
  await requireUser();
  const db = getDb();
  const expedienteId = String(formData.get("expedienteId") || "");
  const confirmCodigo = String(formData.get("confirmCodigo") || "").trim();
  if (!expedienteId) throw new Error("Expediente requerido");

  const [exp] = await db
    .select({
      id: s.expedientes.id,
      codigo: s.expedientes.codigo,
      solicitudId: s.expedientes.solicitudId,
    })
    .from(s.expedientes)
    .where(eq(s.expedientes.id, expedienteId))
    .limit(1);

  if (!exp) throw new Error("Expediente no encontrado");
  if (confirmCodigo.toUpperCase() !== exp.codigo.toUpperCase()) {
    throw new Error("El folio no coincide");
  }

  // Borrar solicitud → cascada a expediente y dependencias
  await db.delete(s.solicitudes).where(eq(s.solicitudes.id, exp.solicitudId));

  revalidatePath("/app/comercial");
  revalidatePath("/app/licitaciones");
  revalidatePath("/app/propuestas");
  revalidatePath("/app/entregas");
  revalidatePath("/app/documentos");
  revalidatePath("/app");
}

export async function importListaLimpiaExcelAction(formData: FormData) {
  try {
    const expedienteId = String(formData.get("expedienteId") || "");
    const file = formData.get("file");
    if (!expedienteId || !(file instanceof File) || file.size === 0) {
      return { ok: false as const, error: "Archivo o expediente faltante" };
    }
    const { parseExcelPartidas } = await import("@/lib/parsing/excel-partidas");
    const { storeFile } = await import("@/lib/storage");
    const buffer = await file.arrayBuffer();
    const { rows } = parseExcelPartidas(buffer);
    if (!rows.length) {
      return { ok: false as const, error: "No se detectaron partidas en el Excel" };
    }

    await replacePartidasAction(
      expedienteId,
      rows.map((r, i) => ({
        numero: r.numero ?? i + 1,
        descripcion: r.descripcion,
        cantidad: r.cantidad,
        unidad: r.unidad,
        marca: r.marca,
      })),
    );

    const stored = await storeFile(file, {
      folder: `expedientes/${expedienteId}`,
      filename: file.name,
      contentType: file.type || undefined,
    });
    const user = await requireUser();
    const db = getDb();
    const userId =
      user.id === "demo-miguel"
        ? (
            await db
              .select({ id: s.users.id })
              .from(s.users)
              .where(eq(s.users.email, "miguel@ylika.local"))
              .limit(1)
          )[0]?.id
        : user.id;
    const [exp] = await db
      .select({ empresaId: s.expedientes.empresaId })
      .from(s.expedientes)
      .where(eq(s.expedientes.id, expedienteId))
      .limit(1);
    await db.insert(s.documentos).values({
      expedienteId,
      empresaId: exp?.empresaId ?? null,
      tipo: "LISTA_LIMPIA",
      nombre: file.name,
      storagePath: stored.path,
      mimeType: file.type || null,
      uploadedBy: userId ?? null,
    });
    await logBitacora(
      expedienteId,
      userId,
      `Lista limpia importada (${rows.length} partidas)`,
      undefined,
      "EN_COTIZACION",
      { file: stored.path, rows: rows.length },
    );

    revalidatePath(`/app/comercial/${expedienteId}`);
    revalidatePath("/app/documentos");
    return {
      ok: true as const,
      message: `${rows.length} partidas cargadas desde Excel`,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Error al importar",
    };
  }
}

export async function importCotizacionExcelAction(formData: FormData) {
  try {
    const expedienteId = String(formData.get("expedienteId") || "");
    const alias = String(formData.get("alias") || "P1").trim() || "P1";
    const proveedorNombre =
      String(formData.get("proveedorNombre") || "").trim() || `Proveedor ${alias}`;
    const incluyeIva = formData.get("incluyeIva") === "1";
    const file = formData.get("file");
    if (!expedienteId || !(file instanceof File) || file.size === 0) {
      return { ok: false as const, error: "Archivo o expediente faltante" };
    }

    const db = getDb();
    const partidas = await db
      .select({
        id: s.partidas.id,
        numero: s.partidas.numero,
        descripcion: s.partidas.descripcion,
      })
      .from(s.partidas)
      .where(eq(s.partidas.expedienteId, expedienteId))
      .orderBy(asc(s.partidas.numero));

    if (!partidas.length) {
      return {
        ok: false as const,
        error: "Primero carga la lista limpia (partidas)",
      };
    }

    const { parseExcelPartidas, matchPartidas } = await import(
      "@/lib/parsing/excel-partidas"
    );
    const { storeFile } = await import("@/lib/storage");
    const buffer = await file.arrayBuffer();
    const { rows } = parseExcelPartidas(buffer);
    if (!rows.length) {
      return { ok: false as const, error: "Excel sin filas útiles" };
    }

    const matched = matchPartidas(partidas, rows);
    const lineas = matched
      .filter((m) => m.partidaId && m.row.precio != null)
      .map((m) => ({
        partidaId: m.partidaId!,
        precio: m.row.precio!,
        entregaDias: m.row.entregaDias,
        marca: m.row.marca,
      }));

    if (!lineas.length) {
      return {
        ok: false as const,
        error: "No hubo matches con precio. Revisa columnas Descripción/Precio.",
      };
    }

    await upsertProveedorCotizacionAction({
      expedienteId,
      proveedorNombre,
      alias,
      incluyeIva,
      lineas,
    });

    // Persist match confidence from parser
    const [cot] = await db
      .select()
      .from(s.cotizacionesProveedor)
      .where(
        and(
          eq(s.cotizacionesProveedor.expedienteId, expedienteId),
          eq(s.cotizacionesProveedor.aliasEnExpediente, alias),
        ),
      )
      .limit(1);
    if (cot) {
      for (const m of matched) {
        if (!m.partidaId || m.row.precio == null) continue;
        await db
          .update(s.cotizacionPartidas)
          .set({
            matchConfidence: String(m.confidence),
            matchManual: m.confidence < 0.55,
            descripcionOfertada: m.row.descripcion,
          })
          .where(
            and(
              eq(s.cotizacionPartidas.cotizacionId, cot.id),
              eq(s.cotizacionPartidas.partidaId, m.partidaId),
            ),
          );
      }
      await db
        .update(s.cotizacionesProveedor)
        .set({
          archivoPath: (
            await storeFile(file, {
              folder: `expedientes/${expedienteId}/cotizaciones`,
              filename: `${alias}-${file.name}`,
              contentType: file.type || undefined,
            })
          ).path,
          parseStatus: "PARSED",
          parseMeta: {
            matched: lineas.length,
            totalRows: rows.length,
            needsReview: matched.filter((m) => m.confidence < 0.55).length,
          },
        })
        .where(eq(s.cotizacionesProveedor.id, cot.id));
    }

    await db
      .update(s.expedientes)
      .set({ estatus: "COMPARATIVO", updatedAt: new Date() })
      .where(eq(s.expedientes.id, expedienteId));

    const user = await requireUser();
    const userId =
      user.id === "demo-miguel"
        ? (
            await db
              .select({ id: s.users.id })
              .from(s.users)
              .where(eq(s.users.email, "miguel@ylika.local"))
              .limit(1)
          )[0]?.id
        : user.id;
    await logBitacora(
      expedienteId,
      userId,
      `Cotización ${alias} importada (${lineas.length} líneas)`,
      "EN_COTIZACION",
      "COMPARATIVO",
    );

    revalidatePath(`/app/comercial/${expedienteId}`);
    revalidatePath("/app/compras");
    return {
      ok: true as const,
      message: `${alias}: ${lineas.length}/${rows.length} líneas emparejadas`,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Error al importar cotización",
    };
  }
}
