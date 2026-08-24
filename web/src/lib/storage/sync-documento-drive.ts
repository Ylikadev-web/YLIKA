import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import {
  uploadToExpedienteDrive,
  isGoogleDriveConfigured,
} from "@/lib/storage/drive";

/**
 * After a documento row exists (Blob/local), mirror it into the expediente Drive folder.
 * No-op if Drive is off or expediente has no folder.
 */
export async function syncDocumentoToDrive(input: {
  documentoId: string;
  expedienteId: string;
  tipo: string;
  nombre: string;
  bytes?: Buffer | Uint8Array;
  mimeType?: string | null;
  localPath?: string;
}) {
  if (!isGoogleDriveConfigured()) return { synced: false as const, reason: "not_configured" };

  const db = getDb();
  const [exp] = await db
    .select({
      driveFolderId: s.expedientes.driveFolderId,
      codigo: s.expedientes.codigo,
    })
    .from(s.expedientes)
    .where(eq(s.expedientes.id, input.expedienteId))
    .limit(1);

  if (!exp?.driveFolderId || exp.driveFolderId.startsWith("stub:")) {
    return { synced: false as const, reason: "no_folder" };
  }

  let bytes = input.bytes;
  if (!bytes && input.localPath) {
    try {
      const { readFile } = await import("fs/promises");
      const path = await import("path");
      const full = path.join(process.cwd(), "uploads", input.localPath);
      bytes = await readFile(full);
    } catch {
      return { synced: false as const, reason: "no_bytes" };
    }
  }
  if (!bytes) return { synced: false as const, reason: "no_bytes" };

  const up = await uploadToExpedienteDrive({
    parentFolderId: exp.driveFolderId,
    docTipo: input.tipo,
    filename: input.nombre,
    bytes,
    mimeType: input.mimeType ?? undefined,
  });

  await db
    .update(s.documentos)
    .set({
      driveFileId: up.fileId,
      driveWebViewLink: up.webViewLink,
    })
    .where(eq(s.documentos.id, input.documentoId));

  return { synced: true as const, fileId: up.fileId, provider: up.provider };
}
