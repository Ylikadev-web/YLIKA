import { neon } from "@neondatabase/serverless";

let done = false;

/** Idempotent DDL so production can self-heal when agent can't decrypt secrets. */
export async function ensureDriveSchema() {
  if (done) return;
  const url = process.env.DATABASE_URL;
  if (!url || url.length < 20 || url.includes("SENSITIVE")) return;

  const sql = neon(url);
  await sql`ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS drive_folder_id text`;
  await sql`ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS drive_web_view_link text`;
  await sql`ALTER TABLE documentos ADD COLUMN IF NOT EXISTS drive_file_id text`;
  await sql`ALTER TABLE documentos ADD COLUMN IF NOT EXISTS drive_web_view_link text`;
  await sql`ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS fecha_junta_aclaraciones timestamptz`;
  await sql`ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS fecha_apertura timestamptz`;
  await sql`ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS fecha_fallo timestamptz`;
  await sql`ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS vigencia_oferta_hasta timestamptz`;
  done = true;
}
