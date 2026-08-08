import type { ReactNode } from "react";
import { auth } from "@/lib/auth/config";
import { listPendientesForRoles } from "@/lib/db/pendientes";
import { PendientesProvider } from "@/components/providers/pendientes-provider";
import { YlikaBot } from "@/components/bot/ylika-bot";

export default async function AppAreaLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const roles = (session?.user as { roles?: string[] } | undefined)?.roles ?? [];
  const items = session?.user ? await listPendientesForRoles(roles) : [];

  return (
    <PendientesProvider items={items}>
      {children}
      {session?.user ? (
        <YlikaBot items={items} userName={session.user.name} />
      ) : null}
    </PendientesProvider>
  );
}
