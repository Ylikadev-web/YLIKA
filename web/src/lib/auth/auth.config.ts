import type { NextAuthConfig } from "next-auth";

/**
 * Config edge-safe para middleware (sin bcrypt / DB).
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isApp = request.nextUrl.pathname.startsWith("/app");
      if (isApp) return !!auth;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.roles = (user as { roles?: string[] }).roles ?? [];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.roles = (token.roles as string[]) ?? [];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
