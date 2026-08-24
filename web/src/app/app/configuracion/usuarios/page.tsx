import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { UsersAdminClient } from "@/components/config/users-admin-client";
import { auth } from "@/lib/auth/config";
import { listUsersWithRoles } from "@/lib/db/queries-modules";
import { ROLE_OPTIONS } from "@/lib/domain/areas";
import { isGoogleDriveConfigured } from "@/lib/storage/drive";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const roles = (session.user as { roles?: string[] }).roles ?? [];
  if (!roles.includes("ADMIN_SISTEMAS")) {
    redirect("/app/configuracion");
  }

  const users = await listUsersWithRoles();
  const driveOk = isGoogleDriveConfigured();

  return (
    <AppShell
      title="Usuarios y áreas"
      subtitle="Alta, roles y dashboard por área"
      actions={
        <Link href="/app/configuracion">
          <Button size="sm" variant="ghost">
            Volver
          </Button>
        </Link>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Glass className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Usuarios
          </p>
          <p className="display mt-1 text-2xl font-semibold">{users.length}</p>
        </Glass>
        <Glass className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Activos
          </p>
          <p className="display mt-1 text-2xl font-semibold">
            {users.filter((u) => u.activo).length}
          </p>
        </Glass>
        <Glass className="p-4">
          <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
            Google Drive
          </p>
          <p className="mt-1 text-sm font-medium">
            {driveOk ? (
              <span className="text-[var(--accent)]">Conectado</span>
            ) : (
              <span className="text-[var(--accent-2)]">Pendiente de credenciales</span>
            )}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">
            Env: GOOGLE_DRIVE_*
          </p>
        </Glass>
      </div>

      <Glass className="mb-4 p-5">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--accent)]" />
          <h2 className="text-sm font-semibold">Áreas = roles</h2>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_OPTIONS.map((r) => (
            <li
              key={r.codigo}
              className="glass-thin rounded-2xl px-3 py-2 text-xs"
            >
              <span className="font-medium">{r.nombre}</span>
              <span className="mt-0.5 block text-[10px] text-[var(--text-muted)]">
                {r.codigo}
              </span>
            </li>
          ))}
        </ul>
      </Glass>

      <UsersAdminClient
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          activo: u.activo,
          roles: u.roles,
        }))}
      />
    </AppShell>
  );
}
