"use server";

import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";

async function requireAdminSistemas() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes("ADMIN_SISTEMAS")) {
    throw new Error("Solo Sistemas puede administrar usuarios");
  }
  return session.user;
}

export async function createUserAction(formData: FormData) {
  await requireAdminSistemas();
  const db = getDb();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const roleCodes = formData.getAll("roles").map(String).filter(Boolean);

  if (!name || !email || !password) {
    return { ok: false as const, error: "Nombre, email y password requeridos" };
  }
  if (password.length < 6) {
    return { ok: false as const, error: "Password mínimo 6 caracteres" };
  }
  if (!roleCodes.length) {
    return { ok: false as const, error: "Asigna al menos un área/rol" };
  }

  const existing = await db
    .select({ id: s.users.id })
    .from(s.users)
    .where(eq(s.users.email, email))
    .limit(1);
  if (existing.length) {
    return { ok: false as const, error: "Ese email ya existe" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(s.users)
    .values({ name, email, passwordHash, activo: true })
    .returning();

  const roles = await db
    .select()
    .from(s.roles)
    .where(inArray(s.roles.codigo, roleCodes));

  if (roles.length) {
    await db.insert(s.usuarioRoles).values(
      roles.map((r) => ({ userId: user.id, rolId: r.id })),
    );
  }

  revalidatePath("/app/configuracion/usuarios");
  revalidatePath("/app");
  return { ok: true as const, userId: user.id };
}

export async function updateUserRolesAction(formData: FormData) {
  await requireAdminSistemas();
  const db = getDb();
  const userId = String(formData.get("userId") || "");
  const roleCodes = formData.getAll("roles").map(String).filter(Boolean);
  const activo = formData.get("activo") === "on";

  if (!userId) return { ok: false as const, error: "Usuario requerido" };

  await db
    .update(s.users)
    .set({ activo, updatedAt: new Date() })
    .where(eq(s.users.id, userId));

  await db.delete(s.usuarioRoles).where(eq(s.usuarioRoles.userId, userId));

  if (roleCodes.length) {
    const roles = await db
      .select()
      .from(s.roles)
      .where(inArray(s.roles.codigo, roleCodes));
    if (roles.length) {
      await db.insert(s.usuarioRoles).values(
        roles.map((r) => ({ userId, rolId: r.id })),
      );
    }
  }

  revalidatePath("/app/configuracion/usuarios");
  revalidatePath("/app");
  return { ok: true as const };
}

export async function resetUserPasswordAction(formData: FormData) {
  await requireAdminSistemas();
  const db = getDb();
  const userId = String(formData.get("userId") || "");
  const password = String(formData.get("password") || "").trim();
  if (!userId || password.length < 6) {
    return { ok: false as const, error: "Password mínimo 6 caracteres" };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await db
    .update(s.users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(s.users.id, userId));
  revalidatePath("/app/configuracion/usuarios");
  return { ok: true as const };
}
