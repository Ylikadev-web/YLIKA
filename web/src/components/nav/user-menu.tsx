"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import {
  ChevronDown,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

function initials(name?: string | null, email?: string | null) {
  const base = (name || email || "?").trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

type Props = {
  /** avatar = solo ícono (header/dock); full = bloque con nombre (sidebar) */
  variant?: "avatar" | "full";
  className?: string;
  /** Alinea el menú hacia la izquierda del trigger (dock a la derecha) */
  align?: "start" | "end";
};

export function UserMenu({
  variant = "avatar",
  className,
  align = "end",
}: Props) {
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!data?.user) return null;

  const name = data.user.name ?? "Usuario";
  const email = data.user.email ?? "";
  const roles = data.user.roles ?? [];
  const mark = initials(name, email);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex items-center gap-2 rounded-2xl transition-colors",
          variant === "avatar"
            ? "glass-thin h-10 w-10 items-center justify-center hover:bg-[color-mix(in_srgb,var(--accent)_16%,transparent)]"
            : "glass-thin w-full justify-between px-2.5 py-2 hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]",
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[11px] font-semibold text-[var(--accent)] ring-1 ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]",
            variant === "avatar" ? "h-8 w-8" : "h-8 w-8",
          )}
          aria-hidden
        >
          {mark || <UserRound className="h-4 w-4" />}
        </span>
        {variant === "full" ? (
          <>
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-xs font-medium">{name}</span>
              <span className="block truncate text-[10px] text-[var(--text-muted)]">
                {roles.join(" · ") || "sin roles"}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-[var(--text-muted)] transition-transform",
                open && "rotate-180",
              )}
            />
          </>
        ) : (
          <span className="sr-only">Menú de {name}</span>
        )}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "glass-strong absolute z-50 mt-2 w-64 overflow-hidden rounded-2xl p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.4)]",
            align === "end" ? "right-0" : "left-0",
            variant === "full" && "left-0 right-0 w-auto",
          )}
        >
          <div className="border-b border-[var(--glass-border)] px-3 py-2.5">
            <p className="truncate text-sm font-medium">{name}</p>
            {email ? (
              <p className="truncate text-[11px] text-[var(--text-muted)]">
                {email}
              </p>
            ) : null}
            {roles.length > 0 ? (
              <p className="mt-1 truncate text-[10px] uppercase tracking-wide text-[var(--accent)]">
                {roles.join(" · ")}
              </p>
            ) : null}
          </div>

          <Link
            href="/app/configuracion"
            role="menuitem"
            className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[var(--text)] transition-colors hover:bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4 text-[var(--text-muted)]" />
            Configuración
          </Link>

          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[var(--danger)] transition-colors hover:bg-[color-mix(in_srgb,var(--danger)_12%,transparent)]"
            onClick={() => {
              setOpen(false);
              void signOut({ callbackUrl: "/login" });
            }}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
