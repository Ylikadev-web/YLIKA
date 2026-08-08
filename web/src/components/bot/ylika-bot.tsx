"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PendienteItem } from "@/lib/db/pendientes";

const TONE: Record<PendienteItem["tone"], string> = {
  amber: "bg-[color-mix(in_srgb,var(--accent-2)_35%,transparent)]",
  cyan: "bg-[color-mix(in_srgb,var(--accent)_35%,transparent)]",
  rose: "bg-[color-mix(in_srgb,var(--danger)_30%,transparent)]",
  mint: "bg-[color-mix(in_srgb,#34d399_35%,transparent)]",
};

export function YlikaBot({
  items,
  userName,
}: {
  items: PendienteItem[];
  userName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (items.length === 0) return;
    const t = setTimeout(() => setPulse(false), 4000);
    return () => clearTimeout(t);
  }, [items.length]);

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-50 lg:bottom-6 lg:right-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-auto mb-3 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-[28px] glass-strong shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold">YLIKA Bot</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {userName ? `${userName} · ` : ""}
                  {items.length} pendiente{items.length === 1 ? "" : "s"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text)_8%,transparent)]"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="max-h-[360px] space-y-1 overflow-y-auto p-2">
              {items.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-[var(--text-muted)]">
                  Nada pendiente. Buen ritmo.
                </li>
              ) : (
                items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => startTransition(() => setOpen(false))}
                      className="nav-pending relative flex items-start gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]"
                    >
                      <span
                        aria-hidden
                        className="pending-glow-ring pointer-events-none absolute inset-0 rounded-2xl"
                      />
                      <span
                        className={cn(
                          "relative z-[1] mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                          TONE[item.tone],
                        )}
                      />
                      <span className="relative z-[1] min-w-0">
                        <span className="block truncate text-sm font-medium">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)]">
                          {item.owner}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-label="Abrir bot de pendientes"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-2)] text-[#111] shadow-[0_12px_40px_color-mix(in_srgb,var(--accent-2)_45%,transparent)]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        animate={
          pulse && items.length
            ? { boxShadow: ["0 0 0 0 rgba(255,209,0,0.45)", "0 0 0 16px rgba(255,209,0,0)"] }
            : undefined
        }
        transition={{ repeat: pulse ? Infinity : 0, duration: 1.6 }}
      >
        <Bot className="h-6 w-6" />
        {items.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white">
            {items.length > 9 ? "9+" : items.length}
          </span>
        ) : null}
      </motion.button>
    </div>
  );
}
