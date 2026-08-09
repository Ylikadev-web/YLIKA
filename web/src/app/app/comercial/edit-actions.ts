"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";

async function resolveUser() {
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
    if (!u) throw new Error("Usuario no encontrado");
    userId = u.id;
  }
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  return { userId, roles, name: session.user.name };
}

function canApprove(roles: string[]) {
  return (
    roles.includes("DIRECTOR") ||
    roles.includes("ADMIN_FINANZAS") ||
    roles.includes("ADMIN_SISTEMAS")
  );
}

function canApplyDirect(roles: string[]) {
  // Itza / Nesim / Sistemas pueden aplicar directo; el resto solicita
  return canApprove(roles);
}

async function applyPayload(
  expedienteId: string,
  tipo: string,
  payload: Record<string, unknown>,
) {
  const db = getDb();
  if (tipo === "CAMBIO_TITULO") {
    const [exp] = await db
      .select({ solicitudId: s.expedientes.solicitudId })
      .from(s.expedientes)
      .where(eq(s.expedientes.id, expedienteId))
      .limit(1);
    if (!exp) throw new Error("Expediente no encontrado");
    await db
      .update(s.solicitudes)
      .set({ titulo: String(payload.titulo || "").trim() })
      .where(eq(s.solicitudes.id, exp.solicitudId));
  } else if (tipo === "AGREGAR_PARTIDA") {
    const nums = await db
      .select({ numero: s.partidas.numero })
      .from(s.partidas)
      .where(eq(s.partidas.expedienteId, expedienteId));
    const next =
      (nums.reduce((m, n) => Math.max(m, n.numero), 0) || 0) + 1;
    await db.insert(s.partidas).values({
      expedienteId,
      numero: Number(payload.numero) || next,
      descripcion: String(payload.descripcion || "").trim(),
      cantidad: String(payload.cantidad ?? "1"),
      unidad: String(payload.unidad || "PZA"),
      marcaSolicitada: payload.marca ? String(payload.marca) : null,
    });
  } else if (tipo === "EDITAR_PARTIDA") {
    const id = String(payload.partidaId || "");
    await db
      .update(s.partidas)
      .set({
        descripcion: String(payload.descripcion || "").trim(),
        cantidad: String(payload.cantidad ?? "1"),
        unidad: String(payload.unidad || "PZA"),
        marcaSolicitada: payload.marca ? String(payload.marca) : null,
      })
      .where(and(eq(s.partidas.id, id), eq(s.partidas.expedienteId, expedienteId)));
  } else if (tipo === "ELIMINAR_PARTIDA") {
    const id = String(payload.partidaId || "");
    await db
      .delete(s.partidas)
      .where(and(eq(s.partidas.id, id), eq(s.partidas.expedienteId, expedienteId)));
  } else if (tipo === "CAMBIO_CLIENTE") {
    const [exp] = await db
      .select({ solicitudId: s.expedientes.solicitudId, sector: s.solicitudes.sector })
      .from(s.expedientes)
      .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
      .where(eq(s.expedientes.id, expedienteId))
      .limit(1);
    if (!exp) throw new Error("Expediente no encontrado");
    const nombre = String(payload.clienteNombre || "").trim();
    if (!nombre) return;
    const [cli] = await db
      .insert(s.clientes)
      .values({ tipo: exp.sector, razonSocial: nombre })
      .returning();
    await db
      .update(s.solicitudes)
      .set({ clienteId: cli.id })
      .where(eq(s.solicitudes.id, exp.solicitudId));
  }
}

export async function solicitarOAplicarCambioAction(formData: FormData) {
  const { userId, roles } = await resolveUser();
  const expedienteId = String(formData.get("expedienteId") || "");
  const tipo = String(formData.get("tipo") || "") as
    | "CAMBIO_TITULO"
    | "AGREGAR_PARTIDA"
    | "EDITAR_PARTIDA"
    | "ELIMINAR_PARTIDA"
    | "CAMBIO_CLIENTE";
  const forzarAprobacion = formData.get("forzarAprobacion") === "1";
  const motivo = String(formData.get("motivo") || "") || null;

  const payload: Record<string, unknown> = {
    titulo: formData.get("titulo"),
    partidaId: formData.get("partidaId"),
    descripcion: formData.get("descripcion"),
    cantidad: formData.get("cantidad"),
    unidad: formData.get("unidad"),
    marca: formData.get("marca"),
    numero: formData.get("numero"),
    clienteNombre: formData.get("clienteNombre"),
  };

  if (!expedienteId || !tipo) {
    return { ok: false as const, error: "Datos incompletos" };
  }

  const db = getDb();
  const applyNow = canApplyDirect(roles) && !forzarAprobacion;

  if (applyNow) {
    await applyPayload(expedienteId, tipo, payload);
    await db.insert(s.bitacora).values({
      expedienteId,
      userId,
      accion: `Cambio aplicado (${tipo})`,
      detalle: payload,
    });
    revalidatePath(`/app/comercial/${expedienteId}`);
    return { ok: true as const, mode: "applied" as const };
  }

  await db.insert(s.solicitudesCambio).values({
    expedienteId,
    tipo,
    payload,
    motivo,
    solicitadoPor: userId,
  });
  await db.insert(s.bitacora).values({
    expedienteId,
    userId,
    accion: `Solicitud de cambio enviada a Itza/Nesim (${tipo})`,
    detalle: payload,
  });
  revalidatePath(`/app/comercial/${expedienteId}`);
  revalidatePath("/app/propuestas");
  return { ok: true as const, mode: "pending" as const };
}

export async function resolverCambioAction(formData: FormData) {
  const { userId, roles } = await resolveUser();
  if (!canApprove(roles)) {
    throw new Error("Solo Itza / Nesim / Sistemas aprueban");
  }
  const id = String(formData.get("cambioId") || "");
  const decision = String(formData.get("decision") || "") as "APROBADA" | "RECHAZADA";
  const nota = String(formData.get("nota") || "") || null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(s.solicitudesCambio)
    .where(eq(s.solicitudesCambio.id, id))
    .limit(1);
  if (!row || row.estado !== "PENDIENTE") {
    throw new Error("Solicitud no pendiente");
  }

  if (decision === "APROBADA") {
    await applyPayload(
      row.expedienteId,
      row.tipo,
      row.payload as Record<string, unknown>,
    );
  }

  await db
    .update(s.solicitudesCambio)
    .set({
      estado: decision,
      revisadoPor: userId,
      revisadoAt: new Date(),
      notaRevision: nota,
    })
    .where(eq(s.solicitudesCambio.id, id));

  await db.insert(s.bitacora).values({
    expedienteId: row.expedienteId,
    userId,
    accion: `Cambio ${decision.toLowerCase()} (${row.tipo})`,
    detalle: { cambioId: id, nota },
  });

  revalidatePath(`/app/comercial/${row.expedienteId}`);
  revalidatePath("/app/propuestas");
}

export async function listCambiosPendientesExpediente(expedienteId: string) {
  const db = getDb();
  return db
    .select({
      id: s.solicitudesCambio.id,
      tipo: s.solicitudesCambio.tipo,
      payload: s.solicitudesCambio.payload,
      motivo: s.solicitudesCambio.motivo,
      estado: s.solicitudesCambio.estado,
      createdAt: s.solicitudesCambio.createdAt,
      solicitante: s.users.name,
    })
    .from(s.solicitudesCambio)
    .innerJoin(s.users, eq(s.solicitudesCambio.solicitadoPor, s.users.id))
    .where(
      and(
        eq(s.solicitudesCambio.expedienteId, expedienteId),
        eq(s.solicitudesCambio.estado, "PENDIENTE"),
      ),
    )
    .orderBy(asc(s.solicitudesCambio.createdAt));
}

export async function listCambiosPendientesGlobal() {
  const db = getDb();
  return db
    .select({
      id: s.solicitudesCambio.id,
      tipo: s.solicitudesCambio.tipo,
      payload: s.solicitudesCambio.payload,
      motivo: s.solicitudesCambio.motivo,
      createdAt: s.solicitudesCambio.createdAt,
      expedienteId: s.expedientes.id,
      codigo: s.expedientes.codigo,
      titulo: s.solicitudes.titulo,
      solicitante: s.users.name,
    })
    .from(s.solicitudesCambio)
    .innerJoin(s.expedientes, eq(s.solicitudesCambio.expedienteId, s.expedientes.id))
    .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
    .innerJoin(s.users, eq(s.solicitudesCambio.solicitadoPor, s.users.id))
    .where(eq(s.solicitudesCambio.estado, "PENDIENTE"))
    .orderBy(asc(s.solicitudesCambio.createdAt));
}
