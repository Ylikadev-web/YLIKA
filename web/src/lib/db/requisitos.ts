import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";

/** Checklist Laura — gobierno (licitación) */
export const REQUISITOS_GOBIERNO = [
  "Acta constitutiva / poder vigente",
  "RFC y constancia de situación fiscal",
  "Opinion de cumplimiento SAT / IMSS / INFONAVIT",
  "Estados financieros / capital contable mínimo",
  "Experiencia / contratos similares",
  "Manifestación de integridad",
  "Cumplimiento de normas técnicas de las partidas",
  "Plazo de entrega compatible",
  "Garantía de seriedad de la propuesta (si aplica)",
  "Documentación de marca / fichas técnicas",
  "Junta de aclaraciones / aclaraciones respondidas",
];

/** Checklist — privado (más corto, comercial) */
export const REQUISITOS_PRIVADO = [
  "Datos del cliente / contacto confirmados",
  "Alcance y partidas acordados",
  "Plazo de entrega compatible",
  "Condiciones comerciales / forma de pago",
  "Documentación de marca / fichas técnicas (si aplica)",
  "Cotización / presupuesto aceptado por cliente",
];

/** @deprecated use REQUISITOS_GOBIERNO */
export const REQUISITOS_DEFAULT = REQUISITOS_GOBIERNO;

export async function listRequisitosExpediente(expedienteId: string) {
  const db = getDb();
  return db
    .select()
    .from(s.requisitosExpediente)
    .where(eq(s.requisitosExpediente.expedienteId, expedienteId))
    .orderBy(asc(s.requisitosExpediente.createdAt));
}

export async function ensureRequisitosBases(
  expedienteId: string,
  sector?: "GOBIERNO" | "PRIVADO" | string,
) {
  const db = getDb();
  const existing = await listRequisitosExpediente(expedienteId);
  if (existing.length) return existing;

  let resolvedSector = sector;
  if (!resolvedSector) {
    const [row] = await db
      .select({ sector: s.solicitudes.sector })
      .from(s.expedientes)
      .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
      .where(eq(s.expedientes.id, expedienteId))
      .limit(1);
    resolvedSector = row?.sector;
  }

  const template =
    resolvedSector === "PRIVADO" ? REQUISITOS_PRIVADO : REQUISITOS_GOBIERNO;
  const fuente =
    resolvedSector === "PRIVADO" ? "PRIVADO_TEMPLATE" : "BASES_TEMPLATE";

  await db.insert(s.requisitosExpediente).values(
    template.map((descripcion) => ({
      expedienteId,
      descripcion,
      obligatorio: true,
      fuente,
      cumple: null as boolean | null,
    })),
  );
  return listRequisitosExpediente(expedienteId);
}

export async function setRequisitoCumple(
  requisitoId: string,
  cumple: boolean | null,
  motivo?: string | null,
) {
  const db = getDb();
  await db
    .update(s.requisitosExpediente)
    .set({
      cumple,
      motivo: motivo ?? null,
    })
    .where(eq(s.requisitosExpediente.id, requisitoId));
}
