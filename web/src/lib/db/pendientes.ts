import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { listPendientesAprobacion } from "@/lib/db/bolsa";
import * as s from "@/lib/db/schema";
import { ESTATUS_LABEL, type EstatusExpediente } from "@/lib/domain/workflow";

export type PendienteItem = {
  id: string;
  title: string;
  href: string;
  owner: string;
  tone: "amber" | "cyan" | "rose" | "mint";
};

const ROLE_STATUSES: Record<string, EstatusExpediente[]> = {
  LICITACIONES: ["REVISION_REQUISITOS", "ORDEN_COTIZAR"],
  COMPRAS_VENTAS: [
    "ORDEN_COTIZAR",
    "EN_COTIZACION",
    "COMPARATIVO",
    "COTIZACION_FINAL",
    "RECOTIZACION",
    "COMPRA",
    "ENTREGA",
  ],
  ADMIN_FINANZAS: ["PROPUESTA_ADMIN", "COBRANZA"],
  DIRECTOR: ["REVISION_DIRECTOR", "ENVIADA"],
  ADMIN_SISTEMAS: [],
};

export async function listPendientesForRoles(
  roles: string[] = [],
  userId?: string | null,
) {
  const db = getDb();
  const statuses = new Set<EstatusExpediente>();
  for (const r of roles) {
    for (const st of ROLE_STATUSES[r] ?? []) statuses.add(st);
  }
  if (roles.includes("ADMIN_SISTEMAS")) {
    for (const arr of Object.values(ROLE_STATUSES)) {
      for (const st of arr) statuses.add(st);
    }
  }

  const items: PendienteItem[] = [];

  if (statuses.size) {
    const rows = await db
      .select({
        id: s.expedientes.id,
        codigo: s.expedientes.codigo,
        estatus: s.expedientes.estatus,
        titulo: s.solicitudes.titulo,
        empresa: s.empresas.codigo,
      })
      .from(s.expedientes)
      .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
      .innerJoin(s.empresas, eq(s.expedientes.empresaId, s.empresas.id))
      .where(inArray(s.expedientes.estatus, [...statuses]))
      .orderBy(desc(s.expedientes.updatedAt))
      .limit(12);

    for (const r of rows) {
      const owner =
        r.estatus === "REVISION_REQUISITOS" || r.estatus === "ORDEN_COTIZAR"
          ? "Laura"
          : r.estatus === "PROPUESTA_ADMIN" || r.estatus === "COBRANZA"
            ? "Itza"
            : r.estatus === "REVISION_DIRECTOR"
              ? "Nesim"
              : "Ventas";
      const href =
        r.estatus === "PROPUESTA_ADMIN" ||
        r.estatus === "REVISION_DIRECTOR" ||
        r.estatus === "ENVIADA"
          ? "/app/propuestas"
          : `/app/comercial/${r.id}`;
      items.push({
        id: `exp-${r.id}`,
        title: `${r.codigo} · ${ESTATUS_LABEL[r.estatus as EstatusExpediente] ?? r.estatus}`,
        href,
        owner,
        tone:
          owner === "Laura"
            ? "amber"
            : owner === "Itza"
              ? "mint"
              : owner === "Nesim"
                ? "rose"
                : "cyan",
      });
    }
  }

  if (
    roles.includes("DIRECTOR") ||
    roles.includes("ADMIN_FINANZAS") ||
    roles.includes("ADMIN_SISTEMAS")
  ) {
    const bolsaPend = await listPendientesAprobacion();
    for (const p of bolsaPend.slice(0, 6)) {
      items.push({
        id: `bolsa-${p.id}`,
        title: `Bolsa · ${p.bolsaNombre} · $${Number(p.monto).toLocaleString("es-MX")}`,
        href: `/app/tesoreria/bolsa/${p.bolsaId}`,
        owner: "Nesim/Itza",
        tone: "rose",
      });
    }
  }

  // Remisiones emitidas → Entregas
  if (
    roles.includes("COMPRAS_VENTAS") ||
    roles.includes("ADMIN_SISTEMAS") ||
    roles.includes("ADMIN_FINANZAS")
  ) {
    const rems = await db
      .select({
        id: s.remisiones.id,
        folio: s.remisiones.folio,
        estatus: s.remisiones.estatus,
      })
      .from(s.remisiones)
      .where(
        and(
          inArray(s.remisiones.estatus, ["EMITIDA", "EN_TRANSITO", "BORRADOR"]),
        ),
      )
      .limit(6);
    for (const r of rems) {
      items.push({
        id: `rem-${r.id}`,
        title: `${r.folio} · ${r.estatus}`,
        href: "/app/entregas",
        owner: "Operaciones",
        tone: "cyan",
      });
    }
  }

  // Solicitudes de cambio → Itza / Nesim / Sistemas
  if (
    roles.includes("DIRECTOR") ||
    roles.includes("ADMIN_FINANZAS") ||
    roles.includes("ADMIN_SISTEMAS")
  ) {
    const cambios = await db
      .select({
        id: s.solicitudesCambio.id,
        tipo: s.solicitudesCambio.tipo,
        codigo: s.expedientes.codigo,
        expedienteId: s.expedientes.id,
      })
      .from(s.solicitudesCambio)
      .innerJoin(
        s.expedientes,
        eq(s.solicitudesCambio.expedienteId, s.expedientes.id),
      )
      .where(eq(s.solicitudesCambio.estado, "PENDIENTE"))
      .limit(8);
    for (const c of cambios) {
      items.push({
        id: `cambio-${c.id}`,
        title: `Autorizar ${c.tipo} · ${c.codigo}`,
        href: `/app/comercial/${c.expedienteId}`,
        owner: "Itza/Nesim",
        tone: "rose",
      });
    }
  }

  // Recordatorios del usuario (próximas 24h o vencidos)
  if (userId) {
    const soon = new Date(Date.now() + 24 * 3600_000);
    const reminders = await db
      .select()
      .from(s.botRecordatorios)
      .where(
        and(
          eq(s.botRecordatorios.userId, userId),
          eq(s.botRecordatorios.estado, "PENDIENTE"),
          lte(s.botRecordatorios.cuando, soon),
        ),
      )
      .orderBy(asc(s.botRecordatorios.cuando))
      .limit(6);
    for (const r of reminders) {
      items.push({
        id: `remi-${r.id}`,
        title: `⏰ ${r.texto}`,
        href: "/app",
        owner: "Tu bot",
        tone: "amber",
      });
    }
  }

  return items;
}
