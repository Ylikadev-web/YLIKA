/**
 * Carga un flujo real de licitación en Neon (no UI fake).
 * Idempotente: si ya existe YLK-MONE-*-FLOW1, lo refresca.
 */
import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

import { and, eq, like } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { precioConIva } from "../src/lib/parsing/excel-partidas";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const db = drizzle(neon(url), { schema });

  const [mone] = await db
    .select()
    .from(schema.empresas)
    .where(eq(schema.empresas.codigo, "MONE"))
    .limit(1);
  const [naramo] = await db
    .select()
    .from(schema.empresas)
    .where(eq(schema.empresas.codigo, "NARAMO"))
    .limit(1);
  const [tipoLic] = await db
    .select()
    .from(schema.tiposSolicitud)
    .where(eq(schema.tiposSolicitud.codigo, "LICITACION_PUBLICA"))
    .limit(1);
  const [tipoInv] = await db
    .select()
    .from(schema.tiposSolicitud)
    .where(eq(schema.tiposSolicitud.codigo, "INVITACION_3"))
    .limit(1);
  const [tipoProy] = await db
    .select()
    .from(schema.tiposSolicitud)
    .where(eq(schema.tiposSolicitud.codigo, "PROYECTO"))
    .limit(1);
  const [miguel] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "miguel@ylika.local"))
    .limit(1);

  if (!mone || !tipoLic || !miguel) {
    throw new Error("Corre primero npm run db:seed");
  }

  // Docs empresa MONE
  const docs = [
    {
      nombre: "Opinión de cumplimiento SAT",
      categoria: "FISCAL",
      fechaVencimiento: new Date("2026-12-15"),
      estado: "VIGENTE" as const,
    },
    {
      nombre: "Registro CompraNet / RUPC",
      categoria: "LICITACION",
      fechaVencimiento: new Date("2026-08-25"),
      estado: "POR_VENCER" as const,
    },
    {
      nombre: "Acta constitutiva (copia certificada)",
      categoria: "LEGAL",
      fechaVencimiento: null,
      estado: "NO_APLICA" as const,
    },
  ];
  for (const d of docs) {
    const exists = await db
      .select()
      .from(schema.documentosEmpresa)
      .where(
        and(
          eq(schema.documentosEmpresa.empresaId, mone.id),
          eq(schema.documentosEmpresa.nombre, d.nombre),
        ),
      )
      .limit(1);
    if (!exists.length) {
      await db.insert(schema.documentosEmpresa).values({
        empresaId: mone.id,
        ...d,
        updatedBy: miguel.id,
      });
    }
  }

  async function wipeExpediente(codigoLike: string) {
    const rows = await db
      .select()
      .from(schema.expedientes)
      .where(like(schema.expedientes.codigo, codigoLike));
    for (const e of rows) {
      await db
        .delete(schema.solicitudes)
        .where(eq(schema.solicitudes.id, e.solicitudId));
    }
  }

  await wipeExpediente("YLK-MONE-%-00001");
  await wipeExpediente("YLK-MONE-%-00002");
  if (naramo) await wipeExpediente("YLK-NARAMO-%-00001");

  // Cliente
  const [cliente] = await db
    .insert(schema.clientes)
    .values({
      tipo: "GOBIERNO",
      razonSocial: "IMSS Delegación",
      dependencia: "IMSS",
    })
    .returning();

  // Expediente 1 — en comparativo con partidas y 3 proveedores
  const [sol1] = await db
    .insert(schema.solicitudes)
    .values({
      empresaId: mone.id,
      sector: "GOBIERNO",
      tipoSolicitudId: tipoLic.id,
      clienteId: cliente.id,
      titulo: "Suministro válvulas e hidráulica · IMSS",
      folioExterno: "LA-019GYR001-E85-2026",
      caracter: "Nacional",
      createdBy: miguel.id,
    })
    .returning();

  const year = new Date().getFullYear();
  const [exp1] = await db
    .insert(schema.expedientes)
    .values({
      codigo: `YLK-MONE-${year}-00001`,
      solicitudId: sol1.id,
      empresaId: mone.id,
      estatus: "COMPARATIVO",
      aptoRequisitos: true,
      aptoNotas: "Luz verde Laura — docs vigentes",
      markupPct: "12",
      criterioSeleccion: "PRECIO",
      responsableActualId: miguel.id,
    })
    .returning();

  const partidasDef = [
    {
      numero: 1,
      descripcion: 'Válvula mariposa 6" clase 150',
      cantidad: "12",
      unidad: "PZA",
    },
    {
      numero: 2,
      descripcion: 'Tubo acero al carbón 6" Sch40',
      cantidad: "240",
      unidad: "M",
    },
    {
      numero: 3,
      descripcion: 'Codo 90° Sch40 6"',
      cantidad: "48",
      unidad: "PZA",
    },
    {
      numero: 4,
      descripcion: 'Empaque EPDM 6"',
      cantidad: "60",
      unidad: "PZA",
    },
  ];
  const partidas = await db
    .insert(schema.partidas)
    .values(partidasDef.map((p) => ({ ...p, expedienteId: exp1.id })))
    .returning();

  const proveedores = [
    { nombre: "Acero Norte SA", alias: "P1" },
    { nombre: "Hidráulica MX", alias: "P2" },
    { nombre: "ValvePro", alias: "P3" },
  ];
  const precios: Record<
    string,
    Record<number, { precio: number; entrega: number; pct?: number }>
  > = {
    P1: {
      1: { precio: 4200, entrega: 15, pct: 70 },
      2: { precio: 890, entrega: 10, pct: 85 },
      3: { precio: 120, entrega: 7, pct: 60 },
      4: { precio: 35, entrega: 5 },
    },
    P2: {
      1: { precio: 4050, entrega: 21, pct: 55 },
      2: { precio: 910, entrega: 12, pct: 80 },
      3: { precio: 115, entrega: 9, pct: 65 },
      4: { precio: 32, entrega: 5 },
    },
    P3: {
      1: { precio: 4300, entrega: 12, pct: 65 },
      2: { precio: 905, entrega: 14, pct: 75 },
      3: { precio: 118, entrega: 8, pct: 62 },
      4: { precio: 34, entrega: 6 },
    },
  };

  for (const p of proveedores) {
    let [prov] = await db
      .select()
      .from(schema.proveedores)
      .where(eq(schema.proveedores.razonSocial, p.nombre))
      .limit(1);
    if (!prov) {
      [prov] = await db
        .insert(schema.proveedores)
        .values({ razonSocial: p.nombre })
        .returning();
    }
    const [cot] = await db
      .insert(schema.cotizacionesProveedor)
      .values({
        expedienteId: exp1.id,
        proveedorId: prov.id,
        aliasEnExpediente: p.alias,
        incluyeIva: true,
        parseStatus: "PARSED",
        createdBy: miguel.id,
      })
      .returning();

    await db.insert(schema.cotizacionPartidas).values(
      partidas.map((partida) => {
        const cell = precios[p.alias][partida.numero];
        const conIva = precioConIva(cell.precio, true);
        const best =
          (p.alias === "P2" && [1, 3, 4].includes(partida.numero)) ||
          (p.alias === "P1" && partida.numero === 2);
        return {
          cotizacionId: cot.id,
          partidaId: partida.id,
          precioUnitarioConIva: String(conIva),
          precioUnitarioSinIva: String(Number((conIva / 1.16).toFixed(4))),
          tiempoEntregaDias: cell.entrega,
          pctContenidoNacional: cell.pct != null ? String(cell.pct) : null,
          seleccionado: best,
          matchConfidence: "1",
          matchManual: true,
        };
      }),
    );
  }

  await db.insert(schema.bitacora).values([
    {
      expedienteId: exp1.id,
      userId: miguel.id,
      accion: "Expediente creado",
      aEstatus: "REVISION_REQUISITOS",
    },
    {
      expedienteId: exp1.id,
      userId: miguel.id,
      accion: "Luz verde Laura",
      deEstatus: "REVISION_REQUISITOS",
      aEstatus: "APTO",
    },
    {
      expedienteId: exp1.id,
      userId: miguel.id,
      accion: "Orden de cotizar",
      deEstatus: "APTO",
      aEstatus: "ORDEN_COTIZAR",
    },
    {
      expedienteId: exp1.id,
      userId: miguel.id,
      accion: "3 cotizaciones cargadas",
      deEstatus: "EN_COTIZACION",
      aEstatus: "COMPARATIVO",
    },
  ]);

  // Expediente 2 — Laura revisión
  if (tipoInv) {
    const [sol2] = await db
      .insert(schema.solicitudes)
      .values({
        empresaId: mone.id,
        sector: "GOBIERNO",
        tipoSolicitudId: tipoInv.id,
        titulo: "Adquisición materiales · convocatoria estatal",
        folioExterno: "IA-026EZA001-N19-2026",
        createdBy: miguel.id,
      })
      .returning();
    const [exp2] = await db
      .insert(schema.expedientes)
      .values({
        codigo: `YLK-MONE-${year}-00002`,
        solicitudId: sol2.id,
        empresaId: mone.id,
        estatus: "REVISION_REQUISITOS",
        responsableActualId: miguel.id,
      })
      .returning();
    await db.insert(schema.requisitosExpediente).values([
      {
        expedienteId: exp2.id,
        descripcion: "Opinión de cumplimiento vigente",
        cumple: true,
        motivo: "OK",
        fuente: "MANUAL",
      },
      {
        expedienteId: exp2.id,
        descripcion: "Experiencia en suministros similares (3 contratos)",
        cumple: true,
        fuente: "MANUAL",
      },
      {
        expedienteId: exp2.id,
        descripcion: "Manifestación contenido nacional",
        cumple: null,
        motivo: "Pendiente",
        fuente: "MANUAL",
      },
      {
        expedienteId: exp2.id,
        descripcion: "Capital contable mínimo",
        cumple: false,
        motivo: "Revisar estados financieros",
        fuente: "MANUAL",
      },
    ]);
  }

  // Expediente 3 — Naramo propuesta
  if (naramo && tipoProy) {
    const [cliP] = await db
      .insert(schema.clientes)
      .values({
        tipo: "PRIVADO",
        razonSocial: "Plaza Norte SA",
      })
      .returning();
    const [sol3] = await db
      .insert(schema.solicitudes)
      .values({
        empresaId: naramo.id,
        sector: "PRIVADO",
        tipoSolicitudId: tipoProy.id,
        clienteId: cliP.id,
        titulo: "Estacionamiento Plaza Norte",
        createdBy: miguel.id,
      })
      .returning();
    await db.insert(schema.expedientes).values({
      codigo: `YLK-NARAMO-${year}-00001`,
      solicitudId: sol3.id,
      empresaId: naramo.id,
      estatus: "PROPUESTA_ADMIN",
      aptoRequisitos: true,
      markupPct: "15",
      responsableActualId: miguel.id,
    });
  }

  console.log("✅ Flujo real sembrado en Neon");
  console.log(`   ${exp1.codigo} → COMPARATIVO con partidas + P1/P2/P3`);
  console.log(`   YLK-MONE-${year}-00002 → REVISION_REQUISITOS (Laura)`);
  if (naramo) console.log(`   YLK-NARAMO-${year}-00001 → PROPUESTA_ADMIN`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
