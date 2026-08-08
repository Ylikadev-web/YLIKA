import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL en web/.env.local");
    process.exit(1);
  }

  const db = drizzle(neon(url), { schema });

  const empresaRows = [
    {
      codigo: "MONE",
      razonSocial: "Distribuidora de Materiales y Construcción Mone",
    },
    { codigo: "DAKAM", razonSocial: "Dakam Developers" },
    {
      codigo: "NARAMO",
      razonSocial: "Soluciones de Estacionamiento Naramo",
    },
  ];

  for (const e of empresaRows) {
    const existing = await db
      .select()
      .from(schema.empresas)
      .where(eq(schema.empresas.codigo, e.codigo))
      .limit(1);
    if (!existing.length) {
      await db.insert(schema.empresas).values(e);
    }
  }

  const roleDefs = [
    {
      codigo: "ADMIN_SISTEMAS",
      nombre: "Sistemas / Developer",
      esAdmin: true,
      permisos: { all: true },
    },
    {
      codigo: "LICITACIONES",
      nombre: "Licitaciones",
      esAdmin: false,
      permisos: { licitaciones: true },
    },
    {
      codigo: "COMPRAS_VENTAS",
      nombre: "Compras / Ventas",
      esAdmin: false,
      permisos: { comercial: true, compras: true },
    },
    {
      codigo: "ADMIN_FINANZAS",
      nombre: "Administración y Finanzas",
      esAdmin: false,
      permisos: { tesoreria: true, bolsa: true },
    },
    {
      codigo: "DIRECTOR",
      nombre: "Director",
      esAdmin: false,
      permisos: { aprobar_propuesta: true },
    },
  ];

  for (const r of roleDefs) {
    const existing = await db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.codigo, r.codigo))
      .limit(1);
    if (!existing.length) {
      await db.insert(schema.roles).values(r);
    }
  }

  const tipos = [
    {
      sector: "GOBIERNO" as const,
      ambito: "ADQUISICIONES" as const,
      codigo: "LICITACION_PUBLICA",
      nombre: "Licitación pública",
      orden: 10,
    },
    {
      sector: "GOBIERNO" as const,
      ambito: "ADQUISICIONES" as const,
      codigo: "INVITACION_3",
      nombre: "Invitación a cuando menos tres personas",
      orden: 20,
    },
    {
      sector: "GOBIERNO" as const,
      ambito: "ADQUISICIONES" as const,
      codigo: "ADJUDICACION_DIRECTA",
      nombre: "Adjudicación directa",
      orden: 30,
    },
    {
      sector: "GOBIERNO" as const,
      ambito: "OBRA" as const,
      codigo: "OBRA_PUBLICA",
      nombre: "Obra pública",
      orden: 40,
    },
    {
      sector: "PRIVADO" as const,
      ambito: "PRIVADO" as const,
      codigo: "PROYECTO",
      nombre: "Proyecto privado",
      orden: 110,
    },
    {
      sector: "PRIVADO" as const,
      ambito: "PRIVADO" as const,
      codigo: "VENTA_DIRECTA",
      nombre: "Venta directa",
      orden: 120,
    },
  ];

  for (const t of tipos) {
    const existing = await db
      .select()
      .from(schema.tiposSolicitud)
      .where(eq(schema.tiposSolicitud.codigo, t.codigo))
      .limit(1);
    if (!existing.length) {
      await db.insert(schema.tiposSolicitud).values(t);
    }
  }

  const password = process.env.SEED_ADMIN_PASSWORD || "ylika-admin";
  const hash = await bcrypt.hash(password, 10);
  const email = (process.env.SEED_ADMIN_EMAIL || "miguel@ylika.local").toLowerCase();

  let [admin] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!admin) {
    const inserted = await db
      .insert(schema.users)
      .values({
        name: "Miguel",
        email,
        passwordHash: hash,
      })
      .returning();
    admin = inserted[0];
  } else if (!admin.passwordHash) {
    await db
      .update(schema.users)
      .set({ passwordHash: hash })
      .where(eq(schema.users.id, admin.id));
  }

  const allRoles = await db.select().from(schema.roles);
  const allEmpresas = await db.select().from(schema.empresas);

  for (const codigo of ["ADMIN_SISTEMAS", "COMPRAS_VENTAS"]) {
    const rol = allRoles.find((r) => r.codigo === codigo);
    if (!rol) continue;
    const existing = await db
      .select()
      .from(schema.usuarioRoles)
      .where(eq(schema.usuarioRoles.userId, admin.id));
    if (!existing.some((x) => x.rolId === rol.id)) {
      await db.insert(schema.usuarioRoles).values({
        userId: admin.id,
        rolId: rol.id,
      });
    }
  }

  for (const emp of allEmpresas) {
    await db
      .insert(schema.usuarioEmpresas)
      .values({ userId: admin.id, empresaId: emp.id })
      .onConflictDoNothing();
  }

  const bolsa = await db
    .select()
    .from(schema.modulosExternos)
    .where(eq(schema.modulosExternos.codigo, "BOLSA"))
    .limit(1);
  if (!bolsa.length) {
    await db.insert(schema.modulosExternos).values({
      codigo: "BOLSA",
      nombre: "Administración de Bolsa",
      url: process.env.NEXT_PUBLIC_BOLSA_URL || null,
      embed: true,
    });
  }

  const team = [
    {
      name: "Laura",
      email: "laura@ylika.local",
      roles: ["LICITACIONES", "COMPRAS_VENTAS"],
    },
    {
      name: "Fernando",
      email: "fernando@ylika.local",
      roles: ["COMPRAS_VENTAS"],
    },
    {
      name: "Itza",
      email: "itza@ylika.local",
      roles: ["ADMIN_FINANZAS"],
    },
    {
      name: "Nesim",
      email: "nesim@ylika.local",
      roles: ["DIRECTOR"],
    },
  ];

  for (const member of team) {
    let [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, member.email))
      .limit(1);
    if (!user) {
      const inserted = await db
        .insert(schema.users)
        .values({
          name: member.name,
          email: member.email,
          passwordHash: hash,
        })
        .returning();
      user = inserted[0];
    } else if (!user.passwordHash) {
      await db
        .update(schema.users)
        .set({ passwordHash: hash })
        .where(eq(schema.users.id, user.id));
    }

    const existingRoles = await db
      .select()
      .from(schema.usuarioRoles)
      .where(eq(schema.usuarioRoles.userId, user.id));

    for (const rolCodigo of member.roles) {
      const rol = allRoles.find((r) => r.codigo === rolCodigo);
      if (!rol) continue;
      if (!existingRoles.some((x) => x.rolId === rol.id)) {
        await db.insert(schema.usuarioRoles).values({
          userId: user.id,
          rolId: rol.id,
        });
      }
    }

    for (const emp of allEmpresas) {
      await db
        .insert(schema.usuarioEmpresas)
        .values({ userId: user.id, empresaId: emp.id })
        .onConflictDoNothing();
    }
  }

  console.log("✅ Seed OK");
  console.log(`   Admin: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Equipo: Laura, Fernando, Itza, Nesim (misma password)`);
  console.log(`   Empresas: ${allEmpresas.map((e) => e.codigo).join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
