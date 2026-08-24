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

  await sql`
    CREATE TABLE IF NOT EXISTS ordenes_compra (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      expediente_id uuid NOT NULL REFERENCES expedientes(id) ON DELETE CASCADE,
      folio text NOT NULL UNIQUE,
      proveedor_id uuid REFERENCES proveedores(id),
      proveedor_nombre text NOT NULL,
      estatus text NOT NULL DEFAULT 'EMITIDA',
      monto_total numeric(18,2),
      notas text,
      documento_id uuid REFERENCES documentos(id),
      creado_por uuid REFERENCES users(id),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cobranzas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      expediente_id uuid NOT NULL UNIQUE REFERENCES expedientes(id) ON DELETE CASCADE,
      remision_id uuid REFERENCES remisiones(id),
      estatus text NOT NULL DEFAULT 'PENDIENTE',
      monto_total numeric(18,2),
      monto_cobrado numeric(18,2),
      fecha_factura timestamptz,
      fecha_vencimiento timestamptz,
      notas text,
      updated_at timestamptz NOT NULL DEFAULT now(),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  done = true;
}
