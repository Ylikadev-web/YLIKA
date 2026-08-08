"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/components/nav/nav-items";
import { UserMenu } from "@/components/nav/user-menu";
import { PendingGlow } from "@/components/nav/pending-glow";
import { usePendientes } from "@/components/providers/pendientes-provider";
import { useUiPrefs } from "@/components/providers/ui-prefs-provider";
import { cn } from "@/lib/utils";

function useNavActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3", compact && "justify-center")}>
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl ring-1 ring-[var(--glass-border)]">
        <Image
          src="/brand/ylika-logo.png"
          alt="YLIKA"
          fill
          className="object-cover"
          sizes="40px"
          priority
        />
      </div>
      {!compact ? (
        <div>
          <p className="display text-sm font-semibold tracking-[0.18em]">YLIKA</p>
          <p className="text-[11px] text-[var(--text-muted)]">Ops</p>
        </div>
      ) : null}
    </div>
  );
}

/** Classic sidebar (estilo actual) */
export function ClassicNav() {
  const isActive = useNavActive();
  const { countForHref } = usePendientes();

  return (
    <aside className="glass sticky top-4 flex h-[calc(100vh-2rem)] w-[248px] shrink-0 flex-col rounded-[28px] p-3">
      <div className="px-2 py-3">
        <BrandMark />
      </div>
      <nav className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-1 pb-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const pending = countForHref(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
                active
                  ? "text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]",
                pending > 0 && "nav-pending",
              )}
            >
              {active ? (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              ) : null}
              <PendingGlow active={pending > 0} className="rounded-2xl" />
              <Icon className="relative z-[1] h-4 w-4 shrink-0" />
              <span className="relative z-[1] flex-1">{item.label}</span>
              {pending > 0 ? (
                <span className="relative z-[1] flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent-2)] px-1 text-[10px] font-bold text-[#111]">
                  {pending > 9 ? "9+" : pending}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-2 px-1">
        <div className="glass-thin rounded-2xl px-3 py-2.5">
          <p className="text-sm font-medium">MONE</p>
        </div>
        <UserMenu />
      </div>
    </aside>
  );
}

/** Thin rail — expands on hover */
export function RailNav() {
  const isActive = useNavActive();
  const { countForHref } = usePendientes();

  return (
    <aside className="group/rail glass sticky top-4 flex h-[calc(100vh-2rem)] w-[72px] shrink-0 flex-col overflow-hidden rounded-[28px] p-2 transition-[width] duration-300 hover:w-[220px]">
      <div className="px-1 py-2">
        <BrandMark compact />
      </div>
      <nav className="mt-1 flex-1 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const pending = countForHref(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm",
                active
                  ? "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]",
                pending > 0 && "nav-pending",
              )}
            >
              <PendingGlow active={pending > 0} className="rounded-2xl" />
              <Icon className="relative z-[1] h-4 w-4 shrink-0" />
              <span className="relative z-[1] max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-300 group-hover/rail:max-w-[140px] group-hover/rail:opacity-100">
                {item.label}
              </span>
              {pending > 0 ? (
                <span className="absolute right-1 top-1 z-[1] h-2 w-2 rounded-full bg-[var(--accent-2)] group-hover/rail:hidden" />
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-1 pt-2">
        <UserMenu />
      </div>
    </aside>
  );
}

/** Carousel: expanded on /app, compact icons when inside a module */
export function CarouselNav({ orientation }: { orientation: "h" | "v" }) {
  const pathname = usePathname();
  const isActive = useNavActive();
  const { countForHref } = usePendientes();
  const expanded = pathname === "/app" || pathname.startsWith("/app/configuracion");

  if (orientation === "v") {
    return (
      <aside className="glass sticky top-4 flex h-[calc(100vh-2rem)] w-[88px] shrink-0 flex-col items-center rounded-[28px] p-2">
        <div className="py-2">
          <BrandMark compact />
        </div>
        <nav className="mt-2 flex flex-1 flex-col items-center gap-2 overflow-y-auto py-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const pending = countForHref(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-2xl transition-all",
                  expanded ? "h-16 w-16 gap-1" : "h-11 w-11",
                  active
                    ? "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--text)] ring-1 ring-[color-mix(in_srgb,var(--accent)_40%,transparent)]"
                    : "text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]",
                  pending > 0 && "nav-pending",
                )}
              >
                <PendingGlow active={pending > 0} className="rounded-2xl" />
                <motion.span
                  layout
                  className="relative z-[1]"
                  animate={{ scale: expanded ? 1.05 : 1 }}
                >
                  <Icon className={cn(expanded ? "h-5 w-5" : "h-4 w-4")} />
                </motion.span>
                {expanded ? (
                  <span className="relative z-[1] max-w-[64px] truncate text-[9px]">
                    {item.label.split(" ")[0]}
                  </span>
                ) : null}
                {pending > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 z-[2] flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-2)] px-1 text-[9px] font-bold text-[#111]">
                    {pending}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pb-1">
          <UserMenu />
        </div>
      </aside>
    );
  }

  return (
    <div className="glass sticky top-0 z-30 mb-3 overflow-hidden rounded-[28px] px-3 py-2">
      <div className="flex items-center gap-3">
        <BrandMark compact={!expanded} />
        <motion.nav
          layout
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1",
            !expanded && "justify-end",
          )}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            const pending = countForHref(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "relative flex shrink-0 items-center justify-center rounded-2xl transition-all",
                  expanded ? "h-14 min-w-[72px] flex-col gap-0.5 px-2" : "h-10 w-10",
                  active
                    ? "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--text)]"
                    : "text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]",
                  pending > 0 && "nav-pending",
                )}
              >
                <PendingGlow active={pending > 0} className="rounded-2xl" />
                <Icon className={cn("relative z-[1]", expanded ? "h-5 w-5" : "h-4 w-4")} />
                {expanded ? (
                  <span className="relative z-[1] text-[10px]">{item.label.split(" ")[0]}</span>
                ) : null}
                {pending > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 z-[2] h-2 w-2 rounded-full bg-[var(--accent-2)]" />
                ) : null}
              </Link>
            );
          })}
        </motion.nav>
        <UserMenu />
      </div>
    </div>
  );
}

/** Floating dock with hover scale */
export function DockNav() {
  const isActive = useNavActive();
  const { prefs } = useUiPrefs();
  const { countForHref } = usePendientes();
  const pos = prefs.navPosition;

  const positionClass =
    pos === "top"
      ? "top-3 left-1/2 -translate-x-1/2 flex-row"
      : pos === "left"
        ? "left-3 top-1/2 -translate-y-1/2 flex-col"
        : pos === "right"
          ? "right-3 top-1/2 -translate-y-1/2 flex-col"
          : "bottom-3 left-1/2 -translate-x-1/2 flex-row";

  const isVertical = pos === "left" || pos === "right";

  return (
    <nav
      className={cn(
        "glass-strong pointer-events-auto fixed z-40 flex items-end gap-1 rounded-[28px] p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
        positionClass,
      )}
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        const pending = countForHref(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              "group relative flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-200 hover:scale-125 hover:-translate-y-1",
              isVertical && "hover:translate-y-0 hover:translate-x-1",
              active
                ? "bg-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-[var(--text)]"
                : "text-[var(--text-muted)] hover:text-[var(--text)]",
              pending > 0 && "nav-pending",
            )}
          >
            <PendingGlow active={pending > 0} className="rounded-2xl" />
            <Icon className="relative z-[1] h-5 w-5" />
            {pending > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 z-[2] flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-2)] px-1 text-[9px] font-bold text-[#111]">
                {pending}
              </span>
            ) : null}
            <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--bg-elevated)] px-2 py-1 text-[10px] text-[var(--text)] opacity-0 shadow group-hover:block group-hover:opacity-100">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
