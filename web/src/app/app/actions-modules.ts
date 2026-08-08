"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import { nextRemisionFolio } from "@/lib/db/queries-modules";
import * as s from "@/lib/db/schema";

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

export async function createProveedorAction(formData: FormData) {
  await requireUserId();
  const db = getDb();
  const razonSocial = String(formData.get("razonSocial") || "").trim();
  if (!razonSocial) throw new Error("Razón social requerida");
  await db.insert(s.proveedores).values({
    razonSocial,
    rfc: String(formData.get("rfc") || "") || null,
    contactoNombre: String(formData.get("contactoNombre") || "") || null,
    contactoEmail: String(formData.get("contactoEmail") || "") || null,
    contactoTel: String(formData.get("contactoTel") || "") || null,
    condicionesPago: String(formData.get("condicionesPago") || "") || null,
  });
  revalidatePath("/app/compras");
}

export async function createRemisionAction(formData: FormData) {
  const userId = await requireUserId();
  const db = getDb();
  const expedienteId = String(formData.get("expedienteId") || "");
  const destinatario = String(formData.get("destinatario") || "").trim();
  const direccion = String(formData.get("direccionEntrega") || "").trim();
  const notas = String(formData.get("notas") || "") || null;
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
  const [rem] = await db
    .insert(s.remisiones)
    .values({
      expedienteId,
      empresaId: exp.empresaId,
      folio,
      destinatario,
      direccionEntrega: direccion || null,
      fechaEntrega: new Date(),
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
    accion: `Remisión ${folio} emitida`,
    aEstatus: "ENTREGA",
    detalle: { remisionId: rem.id, folio },
  });

  // Auto doc registro
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
  revalidatePath(`/app/comercial/${expedienteId}`);
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

  await db
    .update(s.remisiones)
    .set({
      estatus: "ENTREGADA",
      recibidoPorFinanzasId: userId,
    })
    .where(eq(s.remisiones.id, remisionId));

  await db
    .update(s.expedientes)
    .set({ estatus: "COBRANZA", updatedAt: new Date() })
    .where(eq(s.expedientes.id, rem.expedienteId));

  await db.insert(s.bitacora).values({
    expedienteId: rem.expedienteId,
    userId,
    accion: `Remisión ${rem.folio} entregada → cobranza Itza`,
    deEstatus: "ENTREGA",
    aEstatus: "COBRANZA",
  });

  revalidatePath("/app/entregas");
  revalidatePath("/app/tesoreria");
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
