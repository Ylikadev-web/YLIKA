import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/lib/auth/auth.config";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import {
  accounts,
  roles,
  sessions,
  users,
  usuarioRoles,
  verificationTokens,
} from "@/lib/db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: isDatabaseConfigured()
    ? DrizzleAdapter(getDb(), {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      })
    : undefined,
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!isDatabaseConfigured()) {
          if (
            credentials?.email === "miguel@ylika.local" &&
            credentials?.password === "ylika-admin"
          ) {
            return {
              id: "demo-miguel",
              email: "miguel@ylika.local",
              name: "Miguel",
              roles: ["ADMIN_SISTEMAS", "COMPRAS_VENTAS"],
            };
          }
          return null;
        }

        const email = String(credentials?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const db = getDb();
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user?.passwordHash || !user.activo) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        const userRoleRows = await db
          .select({ codigo: roles.codigo })
          .from(usuarioRoles)
          .innerJoin(roles, eq(usuarioRoles.rolId, roles.id))
          .where(eq(usuarioRoles.userId, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: userRoleRows.map((r) => r.codigo),
        };
      },
    }),
  ],
});
