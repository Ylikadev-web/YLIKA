/**
 * Seed catálogo clasificado: marcas + proveedores tipados.
 * npm run db:seed:catalogo  (añadir script) o:
 * npx tsx --env-file=.env.local scripts/seed-catalogo.ts
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";

const MARCAS = [
  { nombre: "Honeywell", categoria: "Seguridad" },
  { nombre: "Schneider", categoria: "Eléctrico" },
  { nombre: "Grundfos", categoria: "Bombas" },
  { nombre: "Victaulic", categoria: "Hidráulica" },
  { nombre: "3M", categoria: "General" },
  { nombre: "ABB", categoria: "Eléctrico" },
];

const PROVEEDORES = [
  {
    razonSocial: "Acero Norte SA",
    aliasCorto: "AceroN",
    tipo: "MATERIALES" as const,
    especialidades: ["Acero", "Soldadura"],
    zonaCobertura: "Norte",
    preferido: true,
    calificacion: 4,
    marcas: ["Victaulic", "3M"],
  },
  {
    razonSocial: "Hidráulica MX",
    aliasCorto: "HidroMX",
    tipo: "MATERIALES" as const,
    especialidades: ["Hidráulica", "PVC"],
    zonaCobertura: "Nacional",
    preferido: true,
    calificacion: 5,
    marcas: ["Grundfos", "Victaulic"],
  },
  {
    razonSocial: "ValvePro",
    aliasCorto: "Valve",
    tipo: "EQUIPOS" as const,
    especialidades: ["Válvulas"],
    zonaCobertura: "CDMX / Centro",
    preferido: false,
    calificacion: 3,
    marcas: ["Honeywell"],
  },
  {
    razonSocial: "Electro Bajío",
    aliasCorto: "EBajio",
    tipo: "EQUIPOS" as const,
    especialidades: ["Eléctrico", "Iluminación"],
    zonaCobertura: "Bajío",
    preferido: true,
    calificacion: 4,
    marcas: ["Schneider", "ABB"],
  },
  {
    razonSocial: "Fletes Express YLIKA",
    aliasCorto: "Fletes",
    tipo: "TRANSPORTE" as const,
    especialidades: ["Transporte local"],
    zonaCobertura: "CDMX / EdoMex",
    preferido: false,
    calificacion: 3,
    marcas: [] as string[],
  },
  {
    razonSocial: "Obra Civil Integrada",
    aliasCorto: "OCI",
    tipo: "OBRA" as const,
    especialidades: ["Cemento", "Maquinaria"],
    zonaCobertura: "Nacional",
    preferido: false,
    calificacion: 4,
    marcas: [] as string[],
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL");
    process.exit(1);
  }
  const db = drizzle(neon(url), { schema });

  const marcaIds = new Map<string, string>();
  for (const m of MARCAS) {
    let [row] = await db
      .select()
      .from(schema.marcas)
      .where(eq(schema.marcas.nombre, m.nombre))
      .limit(1);
    if (!row) {
      [row] = await db.insert(schema.marcas).values(m).returning();
    }
    marcaIds.set(m.nombre, row.id);
  }

  for (const p of PROVEEDORES) {
    let [prov] = await db
      .select()
      .from(schema.proveedores)
      .where(eq(schema.proveedores.razonSocial, p.razonSocial))
      .limit(1);
    if (!prov) {
      [prov] = await db
        .insert(schema.proveedores)
        .values({
          razonSocial: p.razonSocial,
          aliasCorto: p.aliasCorto,
          tipo: p.tipo,
          especialidades: p.especialidades,
          zonaCobertura: p.zonaCobertura,
          preferido: p.preferido,
          calificacion: p.calificacion,
        })
        .returning();
    } else {
      await db
        .update(schema.proveedores)
        .set({
          aliasCorto: p.aliasCorto,
          tipo: p.tipo,
          especialidades: p.especialidades,
          zonaCobertura: p.zonaCobertura,
          preferido: p.preferido,
          calificacion: p.calificacion,
        })
        .where(eq(schema.proveedores.id, prov.id));
    }

    for (const nombreMarca of p.marcas) {
      const marcaId = marcaIds.get(nombreMarca);
      if (!marcaId) continue;
      const existing = await db
        .select()
        .from(schema.proveedorMarcas)
        .where(eq(schema.proveedorMarcas.proveedorId, prov.id));
      if (existing.some((l) => l.marcaId === marcaId)) continue;
      await db
        .insert(schema.proveedorMarcas)
        .values({ proveedorId: prov.id, marcaId });
    }
  }

  console.log("Catálogo proveedores/marcas listo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
