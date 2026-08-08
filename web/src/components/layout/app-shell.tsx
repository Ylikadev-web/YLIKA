"use client";

import type { ReactNode } from "react";
import {
  CarouselNav,
  ClassicNav,
  DockNav,
  RailNav,
} from "@/components/nav/module-nav";
import { MobileNav } from "@/components/nav/mobile-nav";
import { useUiPrefs } from "@/components/providers/ui-prefs-provider";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  title,
  subtitle,
  actions,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const { prefs, mounted } = useUiPrefs();
  const style = mounted ? prefs.navStyle : "classic";
  let position = mounted ? prefs.navPosition : "left";
  // Classic/rail only support left/right
  if ((style === "classic" || style === "rail") && (position === "top" || position === "bottom")) {
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

          <header className="glass mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[28px] px-5 py-4 sm:px-6">
            <h1 className="display text-2xl font-semibold tracking-tight sm:text-3xl">
              {title}
            </h1>
            {actions ? (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </header>
          {subtitle ? (
            <p className="mb-3 px-1 text-xs text-[var(--text-muted)]">{subtitle}</p>
          ) : null}
          <main className="pb-8">{children}</main>

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

      {/* Mobile always gets a bottom strip for reachability */}
      <MobileNav />
    </div>
  );
}
