import { and, asc, desc, eq, gte, ilike } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { calcEstadoDoc } from "@/lib/db/queries";
import { listPendientesForRoles } from "@/lib/db/pendientes";

export type BotReply = {
  text: string;
  links?: { label: string; href: string }[];
};

function tomorrowMorning(base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d;
}

function parseCuando(text: string, now = new Date()): Date {
  const t = text.toLowerCase();
  if (t.includes("mañana") && (t.includes("primera") || t.includes("hora") || t.includes("mañana"))) {
    return tomorrowMorning(now);
  }
  if (t.includes("mañana")) {
    const d = tomorrowMorning(now);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  if (t.includes("hoy") && t.includes("tarde")) {
    const d = new Date(now);
    d.setHours(16, 0, 0, 0);
    return d;
  }
  if (t.includes("hoy")) {
    const d = new Date(now);
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  }
  // default: tomorrow 9am
  const d = tomorrowMorning(now);
  d.setHours(9, 0, 0, 0);
  return d;
}

function extractReminderText(raw: string) {
  return raw
    .replace(/^(bot[,:]?\s*)/i, "")
    .replace(/recu[eé]rdame\s+/i, "")
    .replace(/recuerdame\s+/i, "")
    .replace(/\s+(mañana|hoy).*$/i, "")
    .trim();
}

export async function handleBotMessage(input: {
  userId: string;
  userName?: string | null;
  roles: string[];
  message: string;
}): Promise<BotReply> {
  const msg = input.message.trim();
  const lower = msg.toLowerCase();
  const db = getDb();

  // Persist user message
  await db.insert(s.botMensajes).values({
    userId: input.userId,
    rol: "user",
    contenido: msg,
  });

  let reply: BotReply;

  // Reminder intent
  if (
    /recuerd/i.test(lower) ||
    /av[ií]same/i.test(lower) ||
    /no olvides/i.test(lower)
  ) {
    const cuando = parseCuando(msg);
    const texto =
      extractReminderText(msg) ||
      msg.replace(/^(bot[,:]?\s*)/i, "").trim();
    await db.insert(s.botRecordatorios).values({
      userId: input.userId,
      texto,
      cuando,
      meta: { source: "chat" },
    });
    reply = {
      text: `Listo, ${input.userName?.split(" ")[0] ?? "ok"}. Te recuerdo: “${texto}” el ${cuando.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}.`,
    };
  }
  // Docs / CV empresa
  else if (
    /\b(cv|curr[ií]culum|constancia|documento|opini[oó]n|acta)\b/i.test(lower) ||
    /\b(mone|dakam|naramo)\b/i.test(lower)
  ) {
    const empresas = await db.select().from(s.empresas);
    const code =
      empresas.find((e) => lower.includes(e.codigo.toLowerCase()))?.codigo ??
      (lower.includes("mone")
        ? "MONE"
        : lower.includes("dakam")
          ? "DAKAM"
          : lower.includes("naramo")
            ? "NARAMO"
            : null);

    const emp = code
      ? empresas.find((e) => e.codigo === code)
      : null;

    if (!emp) {
      reply = {
        text: "¿De qué empresa? Puedo buscar docs de MONE, DAKAM o NARAMO. Ej: “Bot, dame el CV actualizado de MONE”.",
        links: [{ label: "Licitaciones · docs", href: "/app/licitaciones" }],
      };
    } else {
      const docs = await db
        .select()
        .from(s.documentosEmpresa)
        .where(eq(s.documentosEmpresa.empresaId, emp.id))
        .orderBy(asc(s.documentosEmpresa.nombre));

      const keyword =
        lower.includes("cv") || lower.includes("curr")
          ? /cv|curr/i
          : lower.includes("opini")
            ? /opini/i
            : lower.includes("acta")
              ? /acta/i
              : null;

      const filtered = keyword
        ? docs.filter((d) => keyword.test(d.nombre) || keyword.test(d.categoria))
        : docs;

      if (!filtered.length && !docs.length) {
        reply = {
          text: `No hay documentos cargados para ${emp.codigo} aún. Súbelos en Licitaciones.`,
          links: [{ label: "Ir a Licitaciones", href: "/app/licitaciones" }],
        };
      } else {
        const list = (filtered.length ? filtered : docs).slice(0, 8);
        const lines = list.map((d) => {
          const estado = calcEstadoDoc(d.fechaVencimiento);
          const vence = d.fechaVencimiento
            ? d.fechaVencimiento.toLocaleDateString("es-MX")
            : "s/v";
          return `• ${d.nombre} — ${estado} (vence ${vence})`;
        });
        reply = {
          text: `${emp.codigo} · documentos:\n${lines.join("\n")}`,
          links: [{ label: "Ver en Licitaciones", href: "/app/licitaciones" }],
        };
      }
    }
  }
  // Entregas hoy / mañana
  else if (/entrega(s)?\s*(de\s*)?(hoy|ma[nñ]ana)|qu[eé] se entrega/i.test(lower)) {
    const items = await listPendientesForRoles(input.roles, input.userId);
    const entregas = items.filter(
      (i) =>
        i.id.startsWith("rem-hoy-") ||
        i.id.startsWith("rem-man-") ||
        i.id.startsWith("rem-"),
    );
    if (!entregas.length) {
      reply = {
        text: "No hay entregas programadas en tu cola ahora.",
        links: [{ label: "Calendario", href: "/app/entregas" }],
      };
    } else {
      reply = {
        text: entregas
          .slice(0, 8)
          .map((i) => {
            const tip = i.tip
              ? `\n  → ${i.tip.donde ?? ""} · ${i.tip.conQuien ?? ""}`
              : "";
            return `• ${i.title}${tip}`;
          })
          .join("\n"),
        links: [
          { label: "Calendario", href: "/app/entregas" },
          ...entregas.slice(0, 3).map((i) => ({ label: i.title, href: i.href })),
        ],
      };
    }
  }
  // Docs por vencer
  else if (/doc(umento)?s?\s*(por\s*)?venc|vencid|constancia/i.test(lower)) {
    const items = await listPendientesForRoles(
      ["LICITACIONES", "ADMIN_SISTEMAS"],
      input.userId,
    );
    const docs = items.filter((i) => i.id.startsWith("doc-"));
    if (!docs.length) {
      reply = {
        text: "Ningún documento de empresa por vencer o vencido. Todo vigente.",
        links: [{ label: "Licitaciones", href: "/app/licitaciones" }],
      };
    } else {
      reply = {
        text: docs.map((d) => `• ${d.title}`).join("\n"),
        links: [{ label: "Actualizar docs", href: "/app/licitaciones" }],
      };
    }
  }
  // Pendientes
  else if (/pendiente|qu[eé] tengo|mi cola|responsabilidad/i.test(lower)) {
    const items = await listPendientesForRoles(input.roles);
    const reminders = await db
      .select()
      .from(s.botRecordatorios)
      .where(
        and(
          eq(s.botRecordatorios.userId, input.userId),
          eq(s.botRecordatorios.estado, "PENDIENTE"),
          gte(s.botRecordatorios.cuando, new Date(Date.now() - 3600_000)),
        ),
      )
      .orderBy(asc(s.botRecordatorios.cuando))
      .limit(5);

    if (!items.length && !reminders.length) {
      reply = { text: "No tienes pendientes ni recordatorios activos. Buen ritmo." };
    } else {
      const lines = [
        ...items.slice(0, 6).map((i) => `• ${i.title} (${i.owner})`),
        ...reminders.map(
          (r) =>
            `• ⏰ ${r.texto} · ${r.cuando.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}`,
        ),
      ];
      reply = {
        text: `Tus pendientes, ${input.userName?.split(" ")[0] ?? ""}:\n${lines.join("\n")}`,
        links: items.slice(0, 3).map((i) => ({ label: i.title, href: i.href })),
      };
    }
  }
  // Expediente search
  else if (/expediente|folio|ylk-/i.test(lower)) {
    const codeMatch = msg.match(/YLK-[A-Z]+-\d{4}-\d+/i);
    const rows = await db
      .select({
        id: s.expedientes.id,
        codigo: s.expedientes.codigo,
        estatus: s.expedientes.estatus,
        titulo: s.solicitudes.titulo,
      })
      .from(s.expedientes)
      .innerJoin(s.solicitudes, eq(s.expedientes.solicitudId, s.solicitudes.id))
      .where(
        codeMatch
          ? ilike(s.expedientes.codigo, codeMatch[0])
          : ilike(s.solicitudes.titulo, `%${msg.slice(0, 40)}%`),
      )
      .orderBy(desc(s.expedientes.updatedAt))
      .limit(5);

    if (!rows.length) {
      reply = { text: "No encontré expedientes con eso. Prueba un folio YLK-…." };
    } else {
      reply = {
        text: rows
          .map((r) => `• ${r.codigo} · ${r.estatus} — ${r.titulo}`)
          .join("\n"),
        links: rows.map((r) => ({
          label: r.codigo,
          href: `/app/comercial/${r.id}`,
        })),
      };
    }
  }
  // Help / default
  else {
    reply = {
      text:
        `Hola${input.userName ? `, ${input.userName.split(" ")[0]}` : ""}. Puedo:\n` +
        `• Recordarte cosas (“recuérdame cotizar con MEXIACEROS mañana a primera hora”)\n` +
        `• Buscar docs de empresa (“CV actualizado de MONE” / “docs por vencer”)\n` +
        `• Entregas de hoy (“qué se entrega hoy”)\n` +
        `• Listar tus pendientes\n` +
        `• Ubicar un expediente por folio`,
    };
  }

  await db.insert(s.botMensajes).values({
    userId: input.userId,
    rol: "bot",
    contenido: reply.text,
  });

  return reply;
}

export async function listRecordatoriosUser(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(s.botRecordatorios)
    .where(
      and(
        eq(s.botRecordatorios.userId, userId),
        eq(s.botRecordatorios.estado, "PENDIENTE"),
      ),
    )
    .orderBy(asc(s.botRecordatorios.cuando))
    .limit(20);
}

export async function listBotMensajes(userId: string, limit = 30) {
  const db = getDb();
  const rows = await db
    .select()
    .from(s.botMensajes)
    .where(eq(s.botMensajes.userId, userId))
    .orderBy(desc(s.botMensajes.createdAt))
    .limit(limit);
  return rows.reverse();
}
