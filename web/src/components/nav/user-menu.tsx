"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { data } = useSession();
  if (!data?.user) return null;

  return (
    <div className="glass-thin flex items-center justify-between gap-2 rounded-2xl px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium">{data.user.name}</p>
        <p className="truncate text-[10px] text-[var(--text-muted)]">
          {(data.user.roles ?? []).join(" · ") || "sin roles"}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Salir
      </Button>
    </div>
  );
}
