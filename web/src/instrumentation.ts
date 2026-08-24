export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  try {
    const { ensureDriveSchema } = await import("@/lib/db/ensure-drive-schema");
    await ensureDriveSchema();
  } catch {
    // Non-fatal: createExpediente also tries / logs Drive status
  }
}
