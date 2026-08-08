"use client";

import type { ReactNode } from "react";
import { MobileNav } from "@/components/nav/mobile-nav";
import { Sidebar } from "@/components/nav/sidebar";

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
  return (
    <div className="relative min-h-screen">
      <div className="app-atmosphere" aria-hidden />
      <div className="float-orbs" aria-hidden>
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>
      <div className="mx-auto flex max-w-[1440px] gap-4 p-4 pb-24 lg:pb-4">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1">
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
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
