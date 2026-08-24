import { google } from "googleapis";

let cached:
  | ReturnType<typeof google.drive>
  | null
  | undefined;

export async function getDriveClient() {
  if (cached) return cached;

  const email = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  let key = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  if (!email || !key) {
    throw new Error("Google Drive no configurado");
  }
  key = key.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  cached = google.drive({ version: "v3", auth });
  return cached;
}
