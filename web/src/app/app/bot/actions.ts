"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import {
  handleBotMessage,
  listBotMensajes,
  listRecordatoriosUser,
} from "@/lib/bot/engine";
import * as s from "@/lib/db/schema";

async function resolveUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  const db = getDb();
  let userId = session.user.id;
  if (userId === "demo-miguel") {
    const [u] = await db
      .select({ id: s.users.id })
      .from(s.users)
      .where(eq(s.users.email, "miguel@ylika.local"))
      .limit(1);
    if (!u) throw new Error("Usuario no encontrado");
    userId = u.id;
  }
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  return { userId, roles, name: session.user.name, email: session.user.email };
}

export async function chatBotAction(formData: FormData) {
  const { userId, roles, name } = await resolveUser();
  const message = String(formData.get("message") || "").trim();
  if (!message) return { ok: false as const, error: "Escribe un mensaje" };
  const reply = await handleBotMessage({
    userId,
    userName: name,
    roles,
    message,
  });
  revalidatePath("/app");
  return { ok: true as const, reply };
}

export async function getBotInboxAction() {
  const { userId } = await resolveUser();
  const [messages, reminders] = await Promise.all([
    listBotMensajes(userId),
    listRecordatoriosUser(userId),
  ]);
  return { messages, reminders };
}

export async function completarRecordatorioAction(formData: FormData) {
  const { userId } = await resolveUser();
  const id = String(formData.get("id") || "");
  const db = getDb();
  await db
    .update(s.botRecordatorios)
    .set({ estado: "HECHO" })
    .where(
      and(eq(s.botRecordatorios.id, id), eq(s.botRecordatorios.userId, userId)),
    );
  revalidatePath("/app");
}
