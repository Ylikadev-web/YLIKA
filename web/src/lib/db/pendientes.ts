import { and, asc, desc, eq, gte, inArray, lte, ne } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { listPendientesAprobacion } from "@/lib/db/bolsa";
import { calcEstadoDoc } from "@/lib/db/queries";
import { listTareasPendientesGlobal } from "@/lib/db/tareas";
import * as s from "@/lib/db/schema";
import { expedienteHref } from "@/lib/domain/handoff";
import { ESTATUS_LABEL, type EstatusExpediente } from "@/lib/domain/workflow";

export type PendienteItem = {
  id: string;
  title: string;
  href: string;
  owner: string;
  tone: "amber" | "cyan" | "rose" | "mint";
  /** Hover preview — entregas / expediente */
  tip?: {
    que?: string;
    donde?: string;
    conQuien?: string;
    cuando?: string;
  };
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

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

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
  const today0 = startOfDay();
  const today1 = endOfDay();
  const tomorrow1 = endOfDay(new Date(Date.now() + 86400_000));

  // ── Entregas de HOY (prioridad) ────────────────────────────────────
  if (
    roles.includes("COMPRAS_VENTAS") ||
    roles.includes("ADMIN_SISTEMAS") ||
    roles.includes("ADMIN_FINANZAS")
  ) {
    const hoy = await db
      .select({
        id: s.remisiones.id,
        folio: s.remisiones.folio,
        estatus: s.remisiones.estatus,
        destinatario: s.remisiones.destinatario,
        direccionEntrega: s.remisiones.direccionEntrega,
        responsableEntrega: s.remisiones.responsableEntrega,
        fechaProgramada: s.remisiones.fechaProgramada,
        expedienteId: s.expedientes.id,
        titulo: s.solicitudes.titulo,
        codigo: s.expedientes.codigo,
      })
      .from(s.remisiones)
      .innerJoin(s.expedientes, eq(s.remisiones.expedienteId, s.expedientes.id))
      .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
      .where(
        and(
          gte(s.remisiones.fechaProgramada, today0),
          lte(s.remisiones.fechaProgramada, today1),
          ne(s.remisiones.estatus, "ENTREGADA"),
          ne(s.remisiones.estatus, "CANCELADA"),
        ),
      )
      .limit(8);

    for (const r of hoy) {
      items.push({
        id: `rem-hoy-${r.id}`,
        title: `🚚 Hoy · ${r.folio} · ${r.codigo}`,
        href: `/app/comercial/${r.expedienteId}?tab=historial`,
        owner: "Operaciones",
        tone: "rose",
        tip: {
          que: r.titulo,
          donde: r.direccionEntrega ?? "Sin dirección",
          conQuien: r.responsableEntrega ?? r.destinatario,
          cuando: "Hoy",
        },
      });
    }

    // Próximas 24–48h
    const manana = await db
      .select({
        id: s.remisiones.id,
        folio: s.remisiones.folio,
        destinatario: s.remisiones.destinatario,
        direccionEntrega: s.remisiones.direccionEntrega,
        responsableEntrega: s.remisiones.responsableEntrega,
        fechaProgramada: s.remisiones.fechaProgramada,
        expedienteId: s.expedientes.id,
        titulo: s.solicitudes.titulo,
        codigo: s.expedientes.codigo,
      })
      .from(s.remisiones)
      .innerJoin(s.expedientes, eq(s.remisiones.expedienteId, s.expedientes.id))
      .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
      .where(
        and(
          gte(s.remisiones.fechaProgramada, new Date(today1.getTime() + 1)),
          lte(s.remisiones.fechaProgramada, tomorrow1),
          ne(s.remisiones.estatus, "ENTREGADA"),
          ne(s.remisiones.estatus, "CANCELADA"),
        ),
      )
      .limit(4);

    for (const r of manana) {
      items.push({
        id: `rem-man-${r.id}`,
        title: `Mañana · ${r.folio} · ${r.codigo}`,
        href: `/app/comercial/${r.expedienteId}?tab=historial`,
        owner: "Operaciones",
        tone: "amber",
        tip: {
          que: r.titulo,
          donde: r.direccionEntrega ?? "Sin dirección",
          conQuien: r.responsableEntrega ?? r.destinatario,
          cuando: "Mañana",
        },
      });
    }
  }

  // ── Docs empresa por vencer / vencidos → Laura ────────────────────
  if (
    roles.includes("LICITACIONES") ||
    roles.includes("ADMIN_SISTEMAS") ||
    roles.includes("DIRECTOR")
  ) {
    const docs = await db
      .select({
        id: s.documentosEmpresa.id,
        nombre: s.documentosEmpresa.nombre,
        fechaVencimiento: s.documentosEmpresa.fechaVencimiento,
        empresaCodigo: s.empresas.codigo,
      })
      .from(s.documentosEmpresa)
      .innerJoin(s.empresas, eq(s.documentosEmpresa.empresaId, s.empresas.id))
      .orderBy(asc(s.documentosEmpresa.fechaVencimiento))
      .limit(40);

    for (const d of docs) {
      const estado = calcEstadoDoc(d.fechaVencimiento);
      if (estado !== "POR_VENCER" && estado !== "VENCIDO") continue;
      const isConstancia = /constancia|opinión|opinion|sat|imss|infonavit|csf/i.test(
        d.nombre,
      );
      items.push({
        id: `doc-${d.id}`,
        title: `${estado === "VENCIDO" ? "Vencido" : "≤30 días"} · ${isConstancia ? "Constancia" : "Doc"} · ${d.empresaCodigo} · ${d.nombre}`,
        href: "/app/licitaciones",
        owner: "Laura",
        tone: estado === "VENCIDO" ? "rose" : "amber",
        tip: {
          que: d.nombre,
          donde: d.empresaCodigo,
          conQuien: "Licitaciones",
          cuando: d.fechaVencimiento
            ? d.fechaVencimiento.toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
              })
            : undefined,
        },
      });
      if (items.filter((i) => i.id.startsWith("doc-")).length >= 12) break;
    }
  }

  // ── Checklist tareas (recotizar / facturar) ────────────────────────
  {
    const seeVentas =
      roles.includes("COMPRAS_VENTAS") ||
      roles.includes("ADMIN_SISTEMAS") ||
      roles.includes("DIRECTOR");
    const seeFinanzas =
      roles.includes("ADMIN_FINANZAS") ||
      roles.includes("ADMIN_SISTEMAS") ||
      roles.includes("DIRECTOR");
    if (seeVentas || seeFinanzas) {
      const tareas = await listTareasPendientesGlobal(10);
      for (const t of tareas) {
        const isFactura = t.tipo === "FACTURAR";
        if (isFactura && !seeFinanzas) continue;
        if (!isFactura && !seeVentas) continue;
        items.push({
          id: `tarea-${t.id}`,
          title: `${t.codigo} · ${t.titulo}`,
          href: `/app/comercial/${t.expedienteId}?tab=checklist`,
          owner: isFactura ? "Itza" : "Ventas",
          tone: isFactura ? "mint" : "cyan",
          tip: {
            que: t.titulo,
            donde: t.empresaCodigo,
            conQuien: isFactura ? "Itza" : "Ventas",
          },
        });
      }
    }
  }

  if (statuses.size) {
    const rows = await db
      .select({
        id: s.expedientes.id,
        codigo: s.expedientes.codigo,
        estatus: s.expedientes.estatus,
        titulo: s.solicitudes.titulo,
        empresa: s.empresas.codigo,
        clienteNombre: s.clientes.razonSocial,
      })
      .from(s.expedientes)
      .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
      .innerJoin(s.empresas, eq(s.expedientes.empresaId, s.empresas.id))
      .leftJoin(s.clientes, eq(s.solicitudes.clienteId, s.clientes.id))
      .where(inArray(s.expedientes.estatus, [...statuses]))
      .orderBy(desc(s.expedientes.updatedAt))
      .limit(12);

    const remOpen = await db
      .select({
        expedienteId: s.remisiones.expedienteId,
        folio: s.remisiones.folio,
        destinatario: s.remisiones.destinatario,
        direccionEntrega: s.remisiones.direccionEntrega,
        responsableEntrega: s.remisiones.responsableEntrega,
        fechaProgramada: s.remisiones.fechaProgramada,
      })
      .from(s.remisiones)
      .where(
        inArray(s.remisiones.estatus, ["BORRADOR", "EMITIDA", "EN_TRANSITO"]),
      );
    const remByExp = new Map(remOpen.map((r) => [r.expedienteId, r]));

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
          : expedienteHref(r.id, r.estatus);

      const rem = remByExp.get(r.id);
      const tip =
        r.estatus === "ENTREGA" || r.estatus === "COMPRA" || rem
          ? {
              que: r.titulo,
              donde: rem?.direccionEntrega ?? "Por confirmar",
              conQuien:
                rem?.responsableEntrega ??
                rem?.destinatario ??
                r.clienteNombre ??
                "—",
              cuando: rem?.fechaProgramada
                ? rem.fechaProgramada.toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                  })
                : undefined,
            }
          : undefined;

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
        tip,
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

  // Remisiones abiertas (no hoy — ya cubiertas arriba)
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
        destinatario: s.remisiones.destinatario,
        direccionEntrega: s.remisiones.direccionEntrega,
        responsableEntrega: s.remisiones.responsableEntrega,
        fechaProgramada: s.remisiones.fechaProgramada,
        expedienteId: s.expedientes.id,
        titulo: s.solicitudes.titulo,
      })
      .from(s.remisiones)
      .innerJoin(s.expedientes, eq(s.remisiones.expedienteId, s.expedientes.id))
      .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
      .where(
        and(
          inArray(s.remisiones.estatus, ["EMITIDA", "EN_TRANSITO", "BORRADOR"]),
        ),
      )
      .limit(6);
    for (const r of rems) {
      // skip if already as hoy/mañana
      if (items.some((i) => i.id === `rem-hoy-${r.id}` || i.id === `rem-man-${r.id}`))
        continue;
      items.push({
        id: `rem-${r.id}`,
        title: `${r.folio} · ${r.estatus}${
          r.fechaProgramada
            ? ` · ${r.fechaProgramada.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`
            : ""
        }`,
        href: `/app/comercial/${r.expedienteId}?tab=historial`,
        owner: "Operaciones",
        tone: "cyan",
        tip: {
          que: r.titulo,
          donde: r.direccionEntrega ?? "Sin dirección",
          conQuien: r.responsableEntrega ?? r.destinatario,
          cuando: r.fechaProgramada
            ? r.fechaProgramada.toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
              })
            : undefined,
        },
      });
    }
  }

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
        href: `/app/comercial/${c.expedienteId}?tab=edicion`,
        owner: "Itza/Nesim",
        tone: "rose",
      });
    }
  }

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
      const meta = (r.meta ?? {}) as { expedienteId?: string };
      items.push({
        id: `remi-${r.id}`,
        title: `⏰ ${r.texto}`,
        href: meta.expedienteId
          ? `/app/comercial/${meta.expedienteId}`
          : "/app",
        owner: "Tu bot",
        tone: "amber",
      });
    }
  }

  // ── Plazos de expediente (junta / apertura / fallo / vigencia) ─────
  try {
    const horizon = endOfDay(new Date(Date.now() + 14 * 86400_000));
    const plazos = await db
      .select({
        id: s.expedientes.id,
        codigo: s.expedientes.codigo,
        titulo: s.solicitudes.titulo,
        fechaJuntaAclaraciones: s.expedientes.fechaJuntaAclaraciones,
        fechaApertura: s.expedientes.fechaApertura,
        fechaFallo: s.expedientes.fechaFallo,
        vigenciaOfertaHasta: s.expedientes.vigenciaOfertaHasta,
        estatus: s.expedientes.estatus,
      })
      .from(s.expedientes)
      .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
      .where(
        and(
          ne(s.expedientes.estatus, "CERRADO"),
          ne(s.expedientes.estatus, "CANCELADO"),
          ne(s.expedientes.estatus, "PERDIDA"),
        ),
      )
      .limit(80);

    for (const p of plazos) {
      const candidates: { label: string; when: Date | null }[] = [
        { label: "Junta aclaraciones", when: p.fechaJuntaAclaraciones },
        { label: "Apertura", when: p.fechaApertura },
        { label: "Fallo", when: p.fechaFallo },
        { label: "Vigencia oferta", when: p.vigenciaOfertaHasta },
      ];
      for (const c of candidates) {
        if (!c.when) continue;
        const when = new Date(c.when);
        if (when > horizon) continue;
        const overdue = when < today0;
        items.push({
          id: `plazo-${p.id}-${c.label}`,
          title: `${overdue ? "Venció" : "Próximo"}: ${c.label} · ${p.codigo}`,
          href: `/app/comercial/${p.id}?tab=resumen`,
          owner: "Plazos",
          tone: overdue ? "rose" : "amber",
          tip: {
            que: p.titulo,
            cuando: when.toLocaleDateString("es-MX"),
          },
        });
      }
    }
  } catch {
    /* columnas de plazos pueden no existir aún en DB fría */
  }

  // ── Cobranza abierta (Itza) ────────────────────────────────────────
  if (
    roles.includes("ADMIN_FINANZAS") ||
    roles.includes("ADMIN_SISTEMAS") ||
    roles.includes("DIRECTOR")
  ) {
    try {
      const cobRows = await db
        .select({
          id: s.cobranzas.id,
          estatus: s.cobranzas.estatus,
          montoTotal: s.cobranzas.montoTotal,
          fechaVencimiento: s.cobranzas.fechaVencimiento,
          codigo: s.expedientes.codigo,
          expedienteId: s.expedientes.id,
        })
        .from(s.cobranzas)
        .innerJoin(
          s.expedientes,
          eq(s.cobranzas.expedienteId, s.expedientes.id),
        )
        .where(
          and(
            ne(s.cobranzas.estatus, "COBRADA"),
            ne(s.expedientes.estatus, "CERRADO"),
          ),
        )
        .limit(8);
      for (const c of cobRows) {
        const vencida =
          c.estatus === "VENCIDA" ||
          (c.fechaVencimiento &&
            new Date(c.fechaVencimiento) < today0);
        items.push({
          id: `cob-${c.id}`,
          title: `Cobranza ${c.estatus}${vencida && c.estatus !== "VENCIDA" ? " · vence" : ""} · ${c.codigo}`,
          href: `/app/comercial/${c.expedienteId}?tab=checklist`,
          owner: "Itza",
          tone: vencida || c.estatus === "VENCIDA" ? "rose" : "mint",
          tip: {
            que: `Monto ${c.montoTotal ?? "—"}`,
            cuando: c.fechaVencimiento
              ? new Date(c.fechaVencimiento).toLocaleDateString("es-MX")
              : undefined,
          },
        });
      }
    } catch {
      /* table may not exist yet */
    }
  }

  return items;
}
