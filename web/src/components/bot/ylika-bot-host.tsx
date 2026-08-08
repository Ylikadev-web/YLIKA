import { auth } from "@/lib/auth/config";
import { listPendientesForRoles } from "@/lib/db/pendientes";
import { YlikaBot } from "./ylika-bot";

export async function YlikaBotHost() {
  const session = await auth();
  if (!session?.user) return null;
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  const items = await listPendientesForRoles(roles);
  return <YlikaBot items={items} userName={session.user.name} />;
}
