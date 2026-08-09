import type { ReactNode } from "react";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { listPendientesForRoles } from "@/lib/db/pendientes";
import { PendientesProvider } from "@/components/providers/pendientes-provider";
import { YlikaBot } from "@/components/bot/ylika-bot";

export default async function AppAreaLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];
  let userId = session?.user?.id ?? null;
  if (userId === "demo-miguel") {
    const db = getDb();
    const [u] = await db
      .select({ id: s.users.id })
      .from(s.users)
      .where(eq(s.users.email, "miguel@ylika.local"))
      .limit(1);
    userId = u?.id ?? null;
  }
  const items = session?.user
    ? await listPendientesForRoles(roles, userId)
    : [];

  return (
    <PendientesProvider items={items}>
      {children}
      {session?.user ? (
        <YlikaBot items={items} userName={session.user.name} />
      ) : null}
    </PendientesProvider>
  );
}
