"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { GlassModal } from "@/components/ui/glass-modal";
import {
  createUserAction,
  resetUserPasswordAction,
  updateUserRolesAction,
} from "@/app/app/configuracion/usuarios/actions";
import { ROLE_OPTIONS } from "@/lib/domain/areas";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  activo: boolean;
  roles: string[];
};

export function UsersAdminClient({ users }: { users: UserRow[] }) {
  const router = useRouter();
  const [openCreate, setOpenCreate] = useState(false);
  const [edit, setEdit] = useState<UserRow | null>(null);
  const [resetPwd, setResetPwd] = useState<UserRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setError(null);
            setOpenCreate(true);
          }}
        >
          + Nuevo usuario
        </Button>
      </div>

      <Glass className="overflow-hidden">
        <ul className="divide-y divide-[var(--glass-border)]">
          {users.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {u.name || "Sin nombre"}
                  {!u.activo ? (
                    <span className="ml-2 text-[10px] text-[var(--danger)]">
                      inactivo
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {u.email}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {u.roles.map((r) => (
                    <span
                      key={r}
                      className="rounded-full bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-2 py-0.5 text-[10px]"
                    >
                      {ROLE_OPTIONS.find((o) => o.codigo === r)?.nombre ?? r}
                    </span>
                  ))}
                  {u.roles.length === 0 ? (
                    <span className="text-[10px] text-[var(--danger)]">
                      sin áreas
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="glass"
                  onClick={() => {
                    setError(null);
                    setEdit(u);
                  }}
                >
                  Áreas
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setError(null);
                    setResetPwd(u);
                  }}
                >
                  Password
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Glass>

      <GlassModal
        open={openCreate}
        onClose={() => !pending && setOpenCreate(false)}
        title="Nuevo usuario"
        description="Asigna áreas (= roles). Verá dashboard y pendientes de esas áreas."
        wide
      >
        <form
          className="grid gap-3 sm:grid-cols-2"
          action={(fd) => {
            startTransition(async () => {
              const res = await createUserAction(fd);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              setOpenCreate(false);
              refresh();
            });
          }}
        >
          <label className="text-sm">
            Nombre
            <input
              name="name"
              required
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm">
            Email
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Password temporal
            <input
              name="password"
              type="text"
              required
              minLength={6}
              defaultValue="ylika-admin"
              className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm">Áreas / roles</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <label
                  key={r.codigo}
                  className="glass-thin flex items-center gap-2 rounded-2xl px-3 py-2 text-xs"
                >
                  <input type="checkbox" name="roles" value={r.codigo} />
                  {r.nombre}
                </label>
              ))}
            </div>
          </fieldset>
          {error ? (
            <p className="text-sm text-[var(--danger)] sm:col-span-2">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setOpenCreate(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Crear"}
            </Button>
          </div>
        </form>
      </GlassModal>

      <GlassModal
        open={!!edit}
        onClose={() => !pending && setEdit(null)}
        title="Editar áreas"
        description={edit?.email}
      >
        {edit ? (
          <form
            className="space-y-3"
            action={(fd) => {
              fd.set("userId", edit.id);
              startTransition(async () => {
                const res = await updateUserRolesAction(fd);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                setEdit(null);
                refresh();
              });
            }}
          >
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <label
                  key={r.codigo}
                  className={cn(
                    "glass-thin flex items-center gap-2 rounded-2xl px-3 py-2 text-xs",
                  )}
                >
                  <input
                    type="checkbox"
                    name="roles"
                    value={r.codigo}
                    defaultChecked={edit.roles.includes(r.codigo)}
                  />
                  {r.nombre}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="activo"
                defaultChecked={edit.activo}
              />
              Usuario activo
            </label>
            {error ? (
              <p className="text-sm text-[var(--danger)]">{error}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => setEdit(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Guardar
              </Button>
            </div>
          </form>
        ) : null}
      </GlassModal>

      <GlassModal
        open={!!resetPwd}
        onClose={() => !pending && setResetPwd(null)}
        title="Reset password"
        description={resetPwd?.email}
      >
        {resetPwd ? (
          <form
            className="space-y-3"
            action={(fd) => {
              fd.set("userId", resetPwd.id);
              startTransition(async () => {
                const res = await resetUserPasswordAction(fd);
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                setResetPwd(null);
                refresh();
              });
            }}
          >
            <label className="block text-sm">
              Nuevo password
              <input
                name="password"
                type="text"
                required
                minLength={6}
                className="mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </label>
            {error ? (
              <p className="text-sm text-[var(--danger)]">{error}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setResetPwd(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                Actualizar
              </Button>
            </div>
          </form>
        ) : null}
      </GlassModal>
    </div>
  );
}
