"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Check, Palette } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Glass } from "@/components/ui/glass";
import { THEMES, type ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

export default function ConfiguracionPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <AppShell
      title="Configuración"
      subtitle="Apariencia del workspace. Los temas cambian materiales de vidrio, atmósfera y acentos — no solo modo claro/oscuro."
    >
      <div className="grid gap-4">
        <Glass className="p-6">
          <div className="flex items-center gap-3">
            <div className="glass-thin flex h-11 w-11 items-center justify-center rounded-2xl">
              <Palette className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="display text-lg font-semibold">Temas visuales</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Elige cómo se siente la plataforma para el equipo.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {THEMES.map((item) => {
              const active = mounted && theme === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTheme(item.id)}
                  className={cn(
                    "group relative overflow-hidden rounded-[24px] p-4 text-left transition",
                    "ring-1 ring-[var(--glass-border)]",
                    active &&
                      "ring-2 ring-[var(--accent)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_20%,transparent)]",
                  )}
                  style={{ background: item.preview.bg }}
                >
                  <div
                    className="absolute inset-0 opacity-80"
                    style={{
                      background: `
                        radial-gradient(ellipse 80% 60% at 20% 0%, ${item.preview.accent}55, transparent 55%),
                        radial-gradient(ellipse 70% 50% at 90% 20%, ${item.preview.glow}40, transparent 50%)
                      `,
                    }}
                  />
                  <div
                    className="relative mb-10 h-16 rounded-2xl border"
                    style={{
                      background: item.preview.panel,
                      borderColor: "rgba(255,255,255,0.18)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <div
                      className="absolute left-3 top-3 h-2 w-10 rounded-full"
                      style={{ background: item.preview.accent }}
                    />
                    <div
                      className="absolute bottom-3 right-3 h-6 w-6 rounded-full"
                      style={{ background: item.preview.glow }}
                    />
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-semibold drop-shadow",
                          item.id === "frost" ? "text-[#12161c]" : "text-white",
                        )}
                      >
                        {item.name}
                      </p>
                      {active ? (
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full",
                            item.id === "frost"
                              ? "bg-black/10 text-[#12161c]"
                              : "bg-white/20 text-white",
                          )}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </div>
                    <p
                      className={cn(
                        "mt-1 text-xs leading-relaxed",
                        item.id === "frost"
                          ? "text-[#12161c]/75"
                          : "text-white/75",
                      )}
                    >
                      {item.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </Glass>

        <div className="grid gap-4 lg:grid-cols-2">
          <Glass className="p-6">
            <h3 className="display text-base font-semibold">Empresas</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Multi-empresa del grupo (próximo: switch persistente + RLS).
            </p>
            <ul className="mt-4 space-y-2">
              {[
                ["MONE", "Distribuidora de Materiales y Construcción"],
                ["DAKAM", "Dakam Developers"],
                ["NARAMO", "Soluciones de Estacionamiento"],
              ].map(([code, name]) => (
                <li
                  key={code}
                  className="glass-thin flex items-center justify-between rounded-2xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{code}</p>
                    <p className="text-xs text-[var(--text-muted)]">{name}</p>
                  </div>
                  {code === "MONE" ? (
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_20%,transparent)] px-2.5 py-1 text-[10px] text-[var(--accent)]">
                      activa
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Glass>

          <Glass className="p-6">
            <h3 className="display text-base font-semibold">Preferencias UI</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Controles que llegan en siguientes iteraciones.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
              <li className="glass-thin rounded-2xl px-4 py-3">
                Densidad de tablas (cómoda / compacta)
              </li>
              <li className="glass-thin rounded-2xl px-4 py-3">
                Reducir transparencias (accesibilidad)
              </li>
              <li className="glass-thin rounded-2xl px-4 py-3">
                Tema por usuario (Supabase profile)
              </li>
            </ul>
            {mounted ? (
              <p className="mt-4 text-xs text-[var(--text-muted)]">
                Tema actual:{" "}
                <span className="text-[var(--text)]">
                  {(theme as ThemeId) ?? "obsidian"}
                </span>
              </p>
            ) : null}
          </Glass>
        </div>
      </div>
    </AppShell>
  );
}
