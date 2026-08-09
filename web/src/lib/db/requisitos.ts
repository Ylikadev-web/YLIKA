import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";

/** Checklist base Laura — análisis de bases (cumplimos / no) */
export const REQUISITOS_DEFAULT = [
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
];

export async function listRequisitosExpediente(expedienteId: string) {
  const db = getDb();
  return db
    .select()
    .from(s.requisitosExpediente)
    .where(eq(s.requisitosExpediente.expedienteId, expedienteId))
    .orderBy(asc(s.requisitosExpediente.createdAt));
}

export async function ensureRequisitosBases(expedienteId: string) {
  const db = getDb();
  const existing = await listRequisitosExpediente(expedienteId);
  if (existing.length) return existing;

  await db.insert(s.requisitosExpediente).values(
    REQUISITOS_DEFAULT.map((descripcion) => ({
      expedienteId,
      descripcion,
      obligatorio: true,
      fuente: "BASES_TEMPLATE",
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
