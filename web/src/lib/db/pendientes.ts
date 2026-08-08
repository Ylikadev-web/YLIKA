import { and, desc, eq, inArray } from "drizzle-orm";
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

export async function listPendientesForRoles(roles: string[] = []) {
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
      items.push({
        id: `exp-${r.id}`,
        title: `${r.codigo} · ${ESTATUS_LABEL[r.estatus as EstatusExpediente] ?? r.estatus}`,
        href: `/app/comercial/${r.id}`,
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

  return items;
}
