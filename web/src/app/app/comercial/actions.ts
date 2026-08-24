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

  // Partidas opcionales en el alta (wizard paso 1)
  let partidasPayload: Array<{
    numero?: number;
    descripcion: string;
    cantidad?: string | number;
    unidad?: string;
    marca?: string;
  }> = [];
  const rawPartidas = String(formData.get("partidasJson") || "").trim();
  if (rawPartidas) {
    try {
      const parsed = JSON.parse(rawPartidas) as unknown;
      if (Array.isArray(parsed)) {
        partidasPayload = parsed.filter(
          (p) => p && typeof p === "object" && String((p as { descripcion?: string }).descripcion || "").trim(),
        ) as typeof partidasPayload;
      }
    } catch {
      /* ignore bad json */
    }
  }

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

  if (partidasPayload.length) {
    await db.insert(s.partidas).values(
      partidasPayload.map((p, i) => ({
        expedienteId: expediente.id,
        numero: Number(p.numero) || i + 1,
        descripcion: String(p.descripcion).trim(),
        cantidad: String(p.cantidad ?? "1"),
        unidad: String(p.unidad || "PZA"),
        marcaSolicitada: p.marca ? String(p.marca) : null,
      })),
    );
  }

  // Google Drive folders (no-op stub if credentials missing)
  try {
    const { ensureDriveSchema } = await import("@/lib/db/ensure-drive-schema");
    await ensureDriveSchema();
    const [emp] = await db
      .select({ codigo: s.empresas.codigo })
      .from(s.empresas)
      .where(eq(s.empresas.id, empresaId))
      .limit(1);
    const { ensureExpedienteDriveFolders } = await import("@/lib/storage/drive");
    const drive = await ensureExpedienteDriveFolders({
      empresaCodigo: emp?.codigo ?? "YLIKA",
      codigo,
      titulo,
    });
    await db
      .update(s.expedientes)
      .set({
        driveFolderId: drive.folderId,
        driveWebViewLink: drive.webViewLink,
        updatedAt: new Date(),
      })
      .where(eq(s.expedientes.id, expediente.id));
    await logBitacora(
      expediente.id,
      userId,
      drive.provider === "google-drive"
        ? "Carpeta Google Drive creada"
        : "Drive stub (sin credenciales GOOGLE_DRIVE_*)",
      undefined,
      undefined,
      { folderId: drive.folderId, provider: drive.provider },
    );
  } catch (e) {
    await logBitacora(
      expediente.id,
      userId,
      "Drive no disponible al crear expediente",
      undefined,
      undefined,
      { error: e instanceof Error ? e.message : "unknown" },
    );
  }

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

async function resolveUserIdByRole(roleCodigo: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: s.users.id })
    .from(s.users)
    .innerJoin(s.usuarioRoles, eq(s.usuarioRoles.userId, s.users.id))
    .innerJoin(s.roles, eq(s.usuarioRoles.rolId, s.roles.id))
    .where(and(eq(s.roles.codigo, roleCodigo), eq(s.users.activo, true)))
    .limit(1);
  return row?.id ?? null;
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

  // Asigna responsable según etapa (si existe el usuario seed / rol)
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
  } else if (hacia === "RECOTIZACION" || hacia === "COMPRA") {
    responsableId =
      (await resolveUserIdByRole("COMPRAS")) ??
      (await resolveUserIdByEmail("fernando@ylika.local")) ??
      userId ??
      responsableId;
  } else if (
    hacia === "EN_COTIZACION" ||
    hacia === "COMPARATIVO" ||
    hacia === "COTIZACION_FINAL"
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

  const db = getDb();
  const [row] = await db
    .select({
      clienteId: s.solicitudes.clienteId,
      clienteNombre: s.clientes.razonSocial,
      contactoEmail: s.clientes.contactoEmail,
      contactoTel: s.clientes.contactoTel,
    })
    .from(s.expedientes)
    .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
    .leftJoin(s.clientes, eq(s.solicitudes.clienteId, s.clientes.id))
    .where(eq(s.expedientes.id, expedienteId))
    .limit(1);

  if (!row?.clienteId || !row.clienteNombre?.trim()) {
    throw new Error(
      "Asigna un cliente al expediente (Edición) antes de marcar enviada",
    );
  }
  if (!row.contactoEmail?.trim() && !row.contactoTel?.trim()) {
    throw new Error(
      "El cliente necesita al menos email o teléfono de contacto antes de enviar",
    );
  }

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
  try {
    await requireUser();
    const db = getDb();
    const expedienteId = String(formData.get("expedienteId") || "");
    const confirmCodigo = String(formData.get("confirmCodigo") || "").trim();
    if (!expedienteId) {
      return { ok: false as const, error: "Expediente requerido" };
    }

    const [exp] = await db
      .select({
        id: s.expedientes.id,
        codigo: s.expedientes.codigo,
        solicitudId: s.expedientes.solicitudId,
      })
      .from(s.expedientes)
      .where(eq(s.expedientes.id, expedienteId))
      .limit(1);

    if (!exp) {
      return { ok: false as const, error: "Expediente no encontrado" };
    }
    if (confirmCodigo.toUpperCase() !== exp.codigo.toUpperCase()) {
      return { ok: false as const, error: "El folio no coincide" };
    }

    // Borrar solicitud → cascada a expediente y dependencias
    await db.delete(s.solicitudes).where(eq(s.solicitudes.id, exp.solicitudId));

    revalidatePath("/app/comercial");
    revalidatePath("/app/licitaciones");
    revalidatePath("/app/propuestas");
    revalidatePath("/app/entregas");
    revalidatePath("/app/documentos");
    revalidatePath("/app");
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "No se pudo eliminar",
    };
  }
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
    const [docRow] = await db
      .insert(s.documentos)
      .values({
        expedienteId,
        empresaId: exp?.empresaId ?? null,
        tipo: "LISTA_LIMPIA",
        nombre: file.name,
        storagePath: stored.path,
        mimeType: file.type || null,
        uploadedBy: userId ?? null,
      })
      .returning({ id: s.documentos.id });
    if (docRow) {
      try {
        const { syncDocumentoToDrive } = await import(
          "@/lib/storage/sync-documento-drive"
        );
        await syncDocumentoToDrive({
          documentoId: docRow.id,
          expedienteId,
          tipo: "LISTA_LIMPIA",
          nombre: file.name,
          bytes: Buffer.from(buffer),
          mimeType: file.type || null,
        });
      } catch {
        /* Drive sync best-effort */
      }
    }
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
      const stored = await storeFile(file, {
        folder: `expedientes/${expedienteId}/cotizaciones`,
        filename: `${alias}-${file.name}`,
        contentType: file.type || undefined,
      });
      await db
        .update(s.cotizacionesProveedor)
        .set({
          archivoPath: stored.path,
          parseStatus: "PARSED",
          parseMeta: {
            matched: lineas.length,
            totalRows: rows.length,
            needsReview: matched.filter((m) => m.confidence < 0.55).length,
          },
        })
        .where(eq(s.cotizacionesProveedor.id, cot.id));

      const [expMeta] = await db
        .select({ empresaId: s.expedientes.empresaId })
        .from(s.expedientes)
        .where(eq(s.expedientes.id, expedienteId))
        .limit(1);
      const [docRow] = await db
        .insert(s.documentos)
        .values({
          expedienteId,
          empresaId: expMeta?.empresaId ?? null,
          tipo: "COTIZACION_PROVEEDOR",
          nombre: `${alias}-${file.name}`,
          storagePath: stored.path,
          mimeType: file.type || null,
          uploadedBy: userId ?? null,
        })
        .returning({ id: s.documentos.id });
      if (docRow) {
        try {
          const { syncDocumentoToDrive } = await import(
            "@/lib/storage/sync-documento-drive"
          );
          await syncDocumentoToDrive({
            documentoId: docRow.id,
            expedienteId,
            tipo: "COTIZACION_PROVEEDOR",
            nombre: `${alias}-${file.name}`,
            bytes: Buffer.from(buffer),
            mimeType: file.type || null,
          });
        } catch {
          /* Drive sync best-effort */
        }
      }
    }

    await db
      .update(s.expedientes)
      .set({ estatus: "COMPARATIVO", updatedAt: new Date() })
      .where(eq(s.expedientes.id, expedienteId));

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

const ALLOWED_DOC_TIPOS = new Set([
  "BASE_LICITACION",
  "LISTA_LIMPIA",
  "COTIZACION_PROVEEDOR",
  "COTIZACION_FINAL",
  "PROPUESTA_ECONOMICA",
  "PROPUESTA_TECNICA",
  "CONSTANCIA_EMPRESA",
  "FALLO",
  "CONTRATO",
  "OC",
  "REMISION",
  "FACTURA",
  "OTRO",
]);

/** Upload unificado → documentos + sync Drive (best-effort) */
export async function uploadDocumentoExpedienteAction(formData: FormData) {
  try {
    const user = await requireUser();
    const expedienteId = String(formData.get("expedienteId") || "");
    const tipoRaw = String(formData.get("tipo") || "OTRO");
    const tipo = ALLOWED_DOC_TIPOS.has(tipoRaw) ? tipoRaw : "OTRO";
    const file = formData.get("file");
    if (!expedienteId || !(file instanceof File) || file.size === 0) {
      return { ok: false as const, error: "Archivo o expediente faltante" };
    }

    const { ensureDriveSchema } = await import("@/lib/db/ensure-drive-schema");
    await ensureDriveSchema();

    const { storeFile } = await import("@/lib/storage");
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeFile(file, {
      folder: `expedientes/${expedienteId}`,
      filename: file.name,
      contentType: file.type || undefined,
    });

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

    const [docRow] = await db
      .insert(s.documentos)
      .values({
        expedienteId,
        empresaId: exp?.empresaId ?? null,
        tipo: tipo as
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
          | "OTRO",
        nombre: file.name,
        storagePath: stored.path,
        mimeType: file.type || null,
        uploadedBy: userId ?? null,
      })
      .returning({ id: s.documentos.id });

    let driveSynced = false;
    let driveReason: string | undefined;
    if (docRow) {
      try {
        const { syncDocumentoToDrive } = await import(
          "@/lib/storage/sync-documento-drive"
        );
        const sync = await syncDocumentoToDrive({
          documentoId: docRow.id,
          expedienteId,
          tipo,
          nombre: file.name,
          bytes: buffer,
          mimeType: file.type || null,
        });
        driveSynced = sync.synced === true;
        if (!sync.synced) driveReason = sync.reason;
      } catch {
        driveReason = "sync_error";
      }
    }

    await logBitacora(
      expedienteId,
      userId,
      `Documento subido: ${file.name} (${tipo})`,
      undefined,
      undefined,
      { tipo, path: stored.path, driveSynced },
    );

    revalidatePath(`/app/comercial/${expedienteId}`);
    revalidatePath("/app/documentos");
    return {
      ok: true as const,
      driveSynced,
      driveReason,
    };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "No se pudo subir",
    };
  }
}

function parseOptionalDate(raw: string): Date | null {
  const v = raw.trim();
  if (!v) return null;
  const d = new Date(`${v}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function updateExpedientePlazosAction(formData: FormData) {
  try {
    const user = await requireUser();
    const expedienteId = String(formData.get("expedienteId") || "");
    if (!expedienteId) {
      return { ok: false as const, error: "Expediente requerido" };
    }

    const { ensureDriveSchema } = await import("@/lib/db/ensure-drive-schema");
    await ensureDriveSchema();

    const db = getDb();
    await db
      .update(s.expedientes)
      .set({
        fechaJuntaAclaraciones: parseOptionalDate(
          String(formData.get("fechaJuntaAclaraciones") || ""),
        ),
        fechaApertura: parseOptionalDate(
          String(formData.get("fechaApertura") || ""),
        ),
        fechaFallo: parseOptionalDate(String(formData.get("fechaFallo") || "")),
        vigenciaOfertaHasta: parseOptionalDate(
          String(formData.get("vigenciaOfertaHasta") || ""),
        ),
        updatedAt: new Date(),
      })
      .where(eq(s.expedientes.id, expedienteId));

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

    await logBitacora(expedienteId, userId, "Plazos del expediente actualizados");

    revalidatePath(`/app/comercial/${expedienteId}`);
    revalidatePath("/app");
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "No se pudieron guardar plazos",
    };
  }
}

/** Handoff explícito: transición + nota en bitácora + responsable por etapa */
export async function handoffExpedienteAction(input: {
  expedienteId: string;
  hacia: EstatusExpediente;
  nota?: string;
}) {
  try {
    const { expedienteId, hacia, nota } = input;
    if (!expedienteId || !hacia) {
      return { ok: false as const, error: "Datos incompletos" };
    }

    if (hacia === "ENVIADA") {
      const fd = new FormData();
      fd.set("expedienteId", expedienteId);
      await marcarEnviadaAction(fd);
      return { ok: true as const };
    }

    if (hacia === "GANADA") {
      const fd = new FormData();
      fd.set("expedienteId", expedienteId);
      await marcarGanadaAction(fd);
      return { ok: true as const };
    }

    if (hacia === "PERDIDA") {
      const fd = new FormData();
      fd.set("expedienteId", expedienteId);
      await marcarPerdidaAction(fd);
      return { ok: true as const };
    }

    await transitionExpedienteAction(
      expedienteId,
      hacia,
      nota?.trim() || `Handoff → ${hacia}`,
    );

    if (hacia === "COBRANZA") {
      await ensureCobranzaRow(expedienteId);
    }

    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "Handoff falló",
    };
  }
}

async function ensureCobranzaRow(expedienteId: string) {
  const { ensureDriveSchema } = await import("@/lib/db/ensure-drive-schema");
  await ensureDriveSchema();
  const db = getDb();
  const [existing] = await db
    .select({ id: s.cobranzas.id })
    .from(s.cobranzas)
    .where(eq(s.cobranzas.expedienteId, expedienteId))
    .limit(1);
  if (existing) return existing.id;
  const [row] = await db
    .insert(s.cobranzas)
    .values({ expedienteId, estatus: "PENDIENTE" })
    .returning({ id: s.cobranzas.id });
  return row?.id;
}

export async function emitirOrdenCompraAction(formData: FormData) {
  try {
    const user = await requireUser();
    const expedienteId = String(formData.get("expedienteId") || "");
    const proveedorId = String(formData.get("proveedorId") || "");
    const montoRaw = String(formData.get("montoTotal") || "").trim();
    if (!expedienteId || !proveedorId) {
      return { ok: false as const, error: "Expediente y proveedor requeridos" };
    }

    const { ensureDriveSchema } = await import("@/lib/db/ensure-drive-schema");
    await ensureDriveSchema();

    const db = getDb();
    const userId =
      user.id === "demo-miguel"
        ? await resolveUserIdByEmail("miguel@ylika.local")
        : user.id;

    const [prov] = await db
      .select({
        id: s.proveedores.id,
        razonSocial: s.proveedores.razonSocial,
      })
      .from(s.proveedores)
      .where(eq(s.proveedores.id, proveedorId))
      .limit(1);
    if (!prov) return { ok: false as const, error: "Proveedor no encontrado" };

    const [exp] = await db
      .select({
        codigo: s.expedientes.codigo,
        empresaId: s.expedientes.empresaId,
      })
      .from(s.expedientes)
      .where(eq(s.expedientes.id, expedienteId))
      .limit(1);
    if (!exp) return { ok: false as const, error: "Expediente no encontrado" };

    const seq = String(Date.now()).slice(-4);
    const folio = `OC-${exp.codigo}-${seq}`;

    const selectedIds = formData
      .getAll("partidaIds")
      .map((v) => String(v))
      .filter(Boolean);

    const allPartidas = await db
      .select({
        id: s.partidas.id,
        numero: s.partidas.numero,
        descripcion: s.partidas.descripcion,
        cantidad: s.partidas.cantidad,
        unidad: s.partidas.unidad,
      })
      .from(s.partidas)
      .where(eq(s.partidas.expedienteId, expedienteId))
      .orderBy(asc(s.partidas.numero));

    const lineas =
      selectedIds.length > 0
        ? allPartidas.filter((p) => selectedIds.includes(p.id))
        : allPartidas;

    if (!lineas.length) {
      return {
        ok: false as const,
        error: "No hay partidas para incluir en la OC",
      };
    }

    const [doc] = await db
      .insert(s.documentos)
      .values({
        expedienteId,
        empresaId: exp.empresaId,
        tipo: "OC",
        nombre: `${folio}.pdf`,
        storagePath: `oc/${folio}`,
        uploadedBy: userId ?? null,
      })
      .returning({ id: s.documentos.id });

    const [oc] = await db
      .insert(s.ordenesCompra)
      .values({
        expedienteId,
        folio,
        proveedorId: prov.id,
        proveedorNombre: prov.razonSocial,
        estatus: "EMITIDA",
        montoTotal: montoRaw || null,
        documentoId: doc?.id ?? null,
        creadoPor: userId ?? null,
      })
      .returning({ id: s.ordenesCompra.id, folio: s.ordenesCompra.folio });

    if (oc?.id) {
      await db.insert(s.ordenCompraPartidas).values(
        lineas.map((p) => ({
          ordenCompraId: oc.id,
          partidaId: p.id,
          numero: p.numero,
          descripcion: p.descripcion,
          cantidad: String(p.cantidad ?? "1"),
          unidad: p.unidad || "PZA",
        })),
      );
    }

    await db
      .update(s.expedientes)
      .set({ estatus: "COMPRA", updatedAt: new Date() })
      .where(eq(s.expedientes.id, expedienteId));

    await logBitacora(
      expedienteId,
      userId ?? undefined,
      `OC emitida ${folio} · ${prov.razonSocial} · ${lineas.length} partidas`,
      undefined,
      "COMPRA",
      {
        folio,
        proveedorId: prov.id,
        montoTotal: montoRaw || null,
        partidas: lineas.length,
      },
    );

    // Marca tarea COMPRA del checklist si existe
    await db
      .update(s.expedienteTareas)
      .set({ estado: "HECHO", completedAt: new Date() })
      .where(
        and(
          eq(s.expedienteTareas.expedienteId, expedienteId),
          eq(s.expedienteTareas.tipo, "COMPRA"),
          eq(s.expedienteTareas.estado, "PENDIENTE"),
        ),
      );

    revalidatePath(`/app/comercial/${expedienteId}`);
    revalidatePath("/app/compras");
    revalidatePath("/app/documentos");
    revalidatePath("/app");
    return { ok: true as const, folio: oc?.folio ?? folio };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "No se pudo emitir OC",
    };
  }
}

export async function updateCobranzaAction(formData: FormData) {
  try {
    const user = await requireUser();
    const expedienteId = String(formData.get("expedienteId") || "");
    if (!expedienteId) {
      return { ok: false as const, error: "Expediente requerido" };
    }

    const estatus = String(formData.get("estatus") || "PENDIENTE");
    const allowed = new Set([
      "PENDIENTE",
      "FACTURADA",
      "PARCIAL",
      "COBRADA",
      "VENCIDA",
    ]);
    if (!allowed.has(estatus)) {
      return { ok: false as const, error: "Estado de cobranza inválido" };
    }

    const { ensureDriveSchema } = await import("@/lib/db/ensure-drive-schema");
    await ensureDriveSchema();

    const db = getDb();
    const userId =
      user.id === "demo-miguel"
        ? await resolveUserIdByEmail("miguel@ylika.local")
        : user.id;

    const payload = {
      estatus,
      montoTotal: String(formData.get("montoTotal") || "").trim() || null,
      montoCobrado: String(formData.get("montoCobrado") || "").trim() || null,
      fechaFactura: parseOptionalDate(
        String(formData.get("fechaFactura") || ""),
      ),
      fechaVencimiento: parseOptionalDate(
        String(formData.get("fechaVencimiento") || ""),
      ),
      notas: String(formData.get("notas") || "").trim() || null,
      updatedAt: new Date(),
    };

    const [existing] = await db
      .select({ id: s.cobranzas.id })
      .from(s.cobranzas)
      .where(eq(s.cobranzas.expedienteId, expedienteId))
      .limit(1);

    if (existing) {
      await db
        .update(s.cobranzas)
        .set(payload)
        .where(eq(s.cobranzas.id, existing.id));
    } else {
      await db.insert(s.cobranzas).values({ expedienteId, ...payload });
    }

    if (estatus === "COBRADA") {
      await db
        .update(s.expedientes)
        .set({ estatus: "CERRADO", updatedAt: new Date() })
        .where(eq(s.expedientes.id, expedienteId));
    } else {
      await db
        .update(s.expedientes)
        .set({ estatus: "COBRANZA", updatedAt: new Date() })
        .where(eq(s.expedientes.id, expedienteId));
    }

    await logBitacora(
      expedienteId,
      userId ?? undefined,
      `Cobranza → ${estatus}`,
      undefined,
      estatus === "COBRADA" ? "CERRADO" : "COBRANZA",
      payload as unknown as Record<string, unknown>,
    );

    if (estatus === "FACTURADA" || estatus === "COBRADA") {
      await db
        .update(s.expedienteTareas)
        .set({ estado: "HECHO", completedAt: new Date() })
        .where(
          and(
            eq(s.expedienteTareas.expedienteId, expedienteId),
            eq(s.expedienteTareas.tipo, "FACTURAR"),
            eq(s.expedienteTareas.estado, "PENDIENTE"),
          ),
        );
    }

    revalidatePath(`/app/comercial/${expedienteId}`);
    revalidatePath("/app");
    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "No se pudo actualizar cobranza",
    };
  }
}
