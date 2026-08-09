"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/nav/nav-items";
import { PendingGlow } from "@/components/nav/pending-glow";
import { usePendientes } from "@/components/providers/pendientes-provider";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { countForHref } = usePendientes();
  const primary = NAV_ITEMS.filter((i) =>
    ["/app", "/app/comercial", "/app/propuestas", "/app/configuracion"].includes(
      i.href,
    ),
  );

  return (
    <nav className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[24px] px-2 py-2 lg:hidden">
      {primary.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(item.href);
        const pending = countForHref(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[10px]",
              active ? "text-[var(--accent)]" : "text-[var(--text-muted)]",
              pending > 0 && "nav-pending",
            )}
          >
            <PendingGlow active={pending > 0} className="rounded-2xl" />
            <Icon className="relative z-[1] h-4 w-4" />
            <span className="relative z-[1]">{item.label.split(" ")[0]}</span>
            {pending > 0 ? (
              <span className="absolute right-1 top-1 z-[2] h-1.5 w-1.5 rounded-full bg-[var(--accent-2)]" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
