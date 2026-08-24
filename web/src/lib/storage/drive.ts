import {
  DRIVE_EXPEDIENTE_FOLDERS,
  DRIVE_FOLDER_BY_DOC_TYPE,
} from "@/lib/domain/areas";

export type DriveFolderResult = {
  folderId: string;
  webViewLink: string | null;
  subfolders: Record<string, string>;
  provider: "google-drive" | "stub";
};

function driveConfigured() {
  return Boolean(
    process.env.GOOGLE_DRIVE_CLIENT_EMAIL &&
      process.env.GOOGLE_DRIVE_PRIVATE_KEY &&
      process.env.GOOGLE_DRIVE_FOLDER_ID,
  );
}

/**
 * Ensures YLIKA Ops / {EMPRESA} / {AÑO} / {CODIGO} / subfolders exist.
 * Without credentials returns a stub so the app keeps working.
 */
export async function ensureExpedienteDriveFolders(input: {
  empresaCodigo: string;
  codigo: string;
  titulo?: string;
}): Promise<DriveFolderResult> {
  const year = String(new Date().getFullYear());
  const label = input.titulo
    ? `${input.codigo} — ${input.titulo}`.slice(0, 120)
    : input.codigo;

  if (!driveConfigured()) {
    return {
      folderId: `stub:${input.empresaCodigo}/${year}/${input.codigo}`,
      webViewLink: null,
      subfolders: Object.fromEntries(
        DRIVE_EXPEDIENTE_FOLDERS.map((f) => [f, `stub:${f}`]),
      ),
      provider: "stub",
    };
  }

  const { getDriveClient } = await import("./google-drive-client");
  const drive = await getDriveClient();
  const rootId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

  const empresaId = await findOrCreateFolder(drive, rootId, input.empresaCodigo);
  const yearId = await findOrCreateFolder(drive, empresaId, year);
  const expId = await findOrCreateFolder(drive, yearId, label);

  const subfolders: Record<string, string> = {};
  for (const name of DRIVE_EXPEDIENTE_FOLDERS) {
    subfolders[name] = await findOrCreateFolder(drive, expId, name);
  }

  const meta = await drive.files.get({
    fileId: expId,
    fields: "id, webViewLink",
  });

  return {
    folderId: expId,
    webViewLink: meta.data.webViewLink ?? null,
    subfolders,
    provider: "google-drive",
  };
}

export async function uploadToExpedienteDrive(input: {
  parentFolderId: string;
  subfolders?: Record<string, string>;
  docTipo: string;
  filename: string;
  bytes: Buffer | Uint8Array;
  mimeType?: string;
}): Promise<{ fileId: string; webViewLink: string | null; provider: string }> {
  if (!driveConfigured() || input.parentFolderId.startsWith("stub:")) {
    return {
      fileId: `stub-file:${input.filename}`,
      webViewLink: null,
      provider: "stub",
    };
  }

  const { getDriveClient } = await import("./google-drive-client");
  const drive = await getDriveClient();
  const sub =
    input.subfolders?.[
      DRIVE_FOLDER_BY_DOC_TYPE[input.docTipo] ?? "01-Bases"
    ] ?? input.parentFolderId;

  const { Readable } = await import("stream");
  const body = Readable.from(Buffer.from(input.bytes));

  const created = await drive.files.create({
    requestBody: {
      name: input.filename,
      parents: [sub],
    },
    media: {
      mimeType: input.mimeType ?? "application/octet-stream",
      body,
    },
    fields: "id, webViewLink",
  });

  return {
    fileId: created.data.id!,
    webViewLink: created.data.webViewLink ?? null,
    provider: "google-drive",
  };
}

export function isGoogleDriveConfigured() {
  return driveConfigured();
}

async function findOrCreateFolder(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drive: any,
  parentId: string,
  name: string,
): Promise<string> {
  const safe = name.replace(/'/g, "\\'");
  const q = `mimeType='application/vnd.google-apps.folder' and name='${safe}' and '${parentId}' in parents and trashed=false`;
  const found = await drive.files.list({
    q,
    fields: "files(id, name)",
    spaces: "drive",
    pageSize: 1,
  });
  const existing = found.data.files?.[0]?.id;
  if (existing) return existing;

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return created.data.id!;
}
