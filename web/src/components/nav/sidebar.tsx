"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/nav/nav-items";
import { UserMenu } from "@/components/nav/user-menu";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass sticky top-4 flex h-[calc(100vh-2rem)] w-[248px] shrink-0 flex-col rounded-[28px] p-3">
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-2xl ring-1 ring-[var(--glass-border)]">
          <Image
            src="/brand/ylika-logo.png"
            alt="YLIKA"
            fill
            className="object-cover"
            sizes="40px"
            priority
          />
        </div>
        <div>
          <p className="display text-sm font-semibold tracking-[0.18em]">
            YLIKA
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">Ops Platform</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-1 pb-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.soon && !active ? item.href : item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <Icon className="relative z-[1] h-4 w-4 shrink-0" />
              <span className="relative z-[1] flex-1">{item.label}</span>
              {item.soon ? (
                <span className="relative z-[1] rounded-full bg-[color-mix(in_srgb,var(--text)_8%,transparent)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                  pronto
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 px-1">
        <div className="glass-thin rounded-2xl px-3 py-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Empresa activa
          </p>
          <p className="mt-1 text-sm font-medium">MONE</p>
          <p className="text-xs text-[var(--text-muted)]">
            Distribuidora de Materiales
          </p>
        </div>
        <UserMenu />
      </div>
    </aside>
  );
}
