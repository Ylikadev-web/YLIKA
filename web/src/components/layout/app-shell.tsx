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
      <div className="mx-auto flex max-w-[1440px] gap-4 p-4 pb-24 lg:pb-4">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <div className="min-w-0 flex-1">
          <header className="glass mb-4 flex flex-wrap items-end justify-between gap-4 rounded-[28px] px-5 py-5 sm:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Grupo YLIKA
              </p>
              <h1 className="display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap items-center gap-2">{actions}</div>
            ) : null}
          </header>
          <main className="pb-8">{children}</main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
