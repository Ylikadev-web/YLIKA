"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CarouselNav,
  ClassicNav,
  DockNav,
  RailNav,
} from "@/components/nav/module-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { UserMenu } from "@/components/nav/user-menu";
import { useUiPrefs } from "@/components/providers/ui-prefs-provider";
import { cn } from "@/lib/utils";

export type ShellDensity = "comfortable" | "compact" | "auto";

function resolveDensity(
  density: ShellDensity,
  pathname: string | null,
): "comfortable" | "compact" {
  if (density === "compact") return "compact";
  if (density === "comfortable") return "comfortable";
  // auto: detalle de expediente / bolsa / formularios largos
  if (!pathname) return "comfortable";
  if (/^\/app\/comercial\/[^/]+$/.test(pathname) && !pathname.endsWith("/nuevo"))
    return "compact";
  if (/^\/app\/tesoreria\/bolsa\/[^/]+$/.test(pathname)) return "compact";
  if (pathname.startsWith("/app/comercial/nuevo")) return "compact";
  if (pathname.includes("/cotizacion/")) return "compact";
  return "comfortable";
}

export function AppShell({
  children,
  title,
  subtitle,
  actions,
  density = "auto",
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** comfortable = título grande; compact = barra fina esquina; auto = según ruta */
  density?: ShellDensity;
}) {
  const pathname = usePathname();
  const mode = resolveDensity(density, pathname);
  const compact = mode === "compact";

  const { prefs, mounted } = useUiPrefs();
  const style = mounted ? prefs.navStyle : "classic";
  let position = mounted ? prefs.navPosition : "left";
  if (
    (style === "classic" || style === "rail") &&
    (position === "top" || position === "bottom")
  ) {
    position = "left";
  }

  const useSideChrome =
    style === "classic" ||
    style === "rail" ||
    (style === "carousel" && (position === "left" || position === "right"));

  const useTopCarousel =
    style === "carousel" && (position === "top" || position === "bottom");

  const useDock = style === "dock";

  const sideNav =
    style === "rail" ? (
      <RailNav />
    ) : style === "carousel" ? (
      <CarouselNav orientation="v" />
    ) : (
      <ClassicNav />
    );

  const padForDock =
    useDock &&
    (position === "bottom"
      ? "pb-24"
      : position === "top"
        ? "pt-20"
        : position === "left"
          ? "pl-20"
          : "pr-20");

  return (
    <div className="relative min-h-screen">
      <div className="app-atmosphere" aria-hidden />
      {prefs.floatOrbs !== false ? (
        <div className="float-orbs" aria-hidden>
          <span className="orb orb-a" />
          <span className="orb orb-b" />
          <span className="orb orb-c" />
        </div>
      ) : null}

      <div
        className={cn(
          "mx-auto flex max-w-[1440px] gap-4 p-4",
          useDock ? padForDock : "pb-24 lg:pb-4",
          useSideChrome && position === "right" && "flex-row-reverse",
        )}
      >
        {useSideChrome ? (
          <div className="hidden lg:block">{sideNav}</div>
        ) : null}

        <div className="min-w-0 flex-1">
          {useTopCarousel && position === "top" ? (
            <div className="hidden lg:block">
              <CarouselNav orientation="h" />
            </div>
          ) : null}

          <motion.header
            layout
            initial={
              compact
                ? { opacity: 0, y: 18, scale: 1.02 }
                : { opacity: 0, y: 8 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={cn(
              "glass mb-3 flex items-center justify-between gap-3",
              compact
                ? "sticky top-2 z-30 rounded-2xl px-3 py-2 sm:px-3.5"
                : "mb-4 rounded-[28px] px-5 py-4 sm:px-6",
            )}
          >
            <div className="min-w-0 flex-1">
              <motion.h1
                layout
                className={cn(
                  "display font-semibold tracking-tight",
                  compact
                    ? "truncate text-sm sm:text-base"
                    : "text-2xl sm:text-3xl",
                )}
              >
                {title}
              </motion.h1>
              {subtitle ? (
                <motion.p
                  layout
                  className={cn(
                    "truncate text-[var(--text-muted)]",
                    compact ? "text-[10px] leading-tight" : "mt-0.5 text-xs",
                  )}
                >
                  {subtitle}
                </motion.p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
              {actions}
              <UserMenu variant="avatar" align="end" />
            </div>
          </motion.header>

          <main className={cn(compact ? "pb-6" : "pb-8")}>{children}</main>

          {useTopCarousel && position === "bottom" ? (
            <div className="mt-4 hidden lg:block">
              <CarouselNav orientation="h" />
            </div>
          ) : null}
        </div>
      </div>

      {useDock ? (
        <div className="hidden lg:block">
          <DockNav />
        </div>
      ) : null}

      <MobileNav />
    </div>
  );
}
