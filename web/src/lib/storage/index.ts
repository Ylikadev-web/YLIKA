import { put } from "@vercel/blob";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type StoredFile = {
  path: string;
  url: string;
  provider: "blob" | "local";
};

/**
 * Sube archivos a Vercel Blob si hay token; si no, disco local `uploads/`.
 * Luego se puede apuntar a Cloudflare R2 con el mismo interface.
 */
export async function storeFile(
  file: File | Buffer,
  opts: { folder: string; filename?: string; contentType?: string },
): Promise<StoredFile> {
  const name =
    opts.filename ??
    `${Date.now()}-${randomUUID().slice(0, 8)}${guessExt(opts.contentType)}`;
  const key = `${opts.folder}/${name}`;

  const bytes =
    file instanceof File
      ? new Uint8Array(await file.arrayBuffer())
      : new Uint8Array(file);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const body = new Blob([bytes], {
      type: opts.contentType ?? "application/octet-stream",
    });
    const blob = await put(key, body, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { path: key, url: blob.url, provider: "blob" };
  }

  const dir = path.join(process.cwd(), "uploads", opts.folder);
  await mkdir(dir, { recursive: true });
  const full = path.join(dir, name);
  await writeFile(full, bytes);
  return {
    path: key,
    url: `/api/files/${key}`,
    provider: "local",
  };
}

function guessExt(mime?: string) {
  if (!mime) return "";
  if (mime.includes("pdf")) return ".pdf";
  if (mime.includes("sheet") || mime.includes("excel")) return ".xlsx";
  if (mime.includes("png")) return ".png";
  if (mime.includes("jpeg")) return ".jpg";
  return "";
}
