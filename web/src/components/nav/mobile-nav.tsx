"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/nav/nav-items";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const primary = NAV_ITEMS.filter((i) =>
    ["/app", "/app/comercial", "/app/proyectos", "/app/configuracion"].includes(
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
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[10px]",
              active ? "text-[var(--accent)]" : "text-[var(--text-muted)]",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label.split(" ")[0]}
          </Link>
        );
      })}
    </nav>
  );
}
