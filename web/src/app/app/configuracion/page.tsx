"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  GitBranch,
  LayoutPanelLeft,
  Palette,
  Sparkles,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { useUiPrefs } from "@/components/providers/ui-prefs-provider";
import { THEMES, type ThemeId } from "@/lib/themes";
import {
  NAV_POSITION_OPTIONS,
  NAV_STYLE_OPTIONS,
  type GlassBlur,
  type NavPosition,
  type NavStyle,
} from "@/lib/ui-prefs";
import { cn } from "@/lib/utils";

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="glass-thin flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left"
    >
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      </div>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-[var(--accent)]" : "bg-[color-mix(in_srgb,var(--text)_18%,transparent)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "left-5" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

export default function ConfiguracionPage() {
  const { theme, setTheme } = useTheme();
  const { prefs, setPrefs, resetPrefs, mounted } = useUiPrefs();
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  return (
    <AppShell title="Configuración">
      <div className="grid gap-4">
        <Glass className="p-6">
          <div className="flex items-center gap-3">
            <div className="glass-thin flex h-11 w-11 items-center justify-center rounded-2xl">
              <Palette className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="display text-lg font-semibold">Temas</h2>
              <p className="text-xs text-[var(--text-muted)]">Color y atmósfera</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {THEMES.map((item) => {
              const active = ready && theme === item.id;
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
                  />
                  <div className="relative flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        item.id === "frost" ? "text-[#12161c]" : "text-white",
                      )}
                    >
                      {item.name}
                    </p>
                    {active ? (
                      <Check
                        className={cn(
                          "h-4 w-4",
                          item.id === "frost" ? "text-[#12161c]" : "text-white",
                        )}
                      />
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </Glass>

        <Glass className="p-6">
          <div className="flex items-center gap-3">
            <div className="glass-thin flex h-11 w-11 items-center justify-center rounded-2xl">
              <LayoutPanelLeft className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="display text-lg font-semibold">Navegación</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Estilo y posición — no cambia la lógica del sistema
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {NAV_STYLE_OPTIONS.map((opt) => {
              const active = mounted && prefs.navStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setPrefs({ navStyle: opt.id as NavStyle })}
                  className={cn(
                    "glass-thin rounded-2xl p-4 text-left transition",
                    active &&
                      "ring-2 ring-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{opt.name}</p>
                    {active ? <Check className="h-4 w-4 text-[var(--accent)]" /> : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{opt.tagline}</p>
                </button>
              );
            })}
          </div>

          <p className="mt-5 mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Posición de la barra
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {NAV_POSITION_OPTIONS.map((opt) => {
              const active = mounted && prefs.navPosition === opt.id;
              const disabledClassicSide =
                prefs.navStyle === "classic" &&
                (opt.id === "top" || opt.id === "bottom");
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabledClassicSide}
                  onClick={() => setPrefs({ navPosition: opt.id as NavPosition })}
                  className={cn(
                    "glass-thin rounded-2xl px-3 py-3 text-sm font-medium transition disabled:opacity-35",
                    active && "ring-2 ring-[var(--accent)]",
                  )}
                >
                  {opt.name}
                </button>
              );
            })}
          </div>
          {prefs.navStyle === "classic" ? (
            <p className="mt-2 text-[11px] text-[var(--text-muted)]">
              Clásica usa izquierda/derecha. Para superior/inferior elige Carrusel o Dock.
            </p>
          ) : null}
        </Glass>

        <Glass className="p-6">
          <div className="flex items-center gap-3">
            <div className="glass-thin flex h-11 w-11 items-center justify-center rounded-2xl">
              <Sparkles className="h-5 w-5 text-[var(--accent-2)]" />
            </div>
            <div>
              <h2 className="display text-lg font-semibold">Material y motion</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Blur, orbes, glow de pendientes
              </p>
            </div>
          </div>

          <p className="mt-5 mb-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
            Difuminado del vidrio
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["soft", "Suave"],
                ["strong", "Fuerte"],
                ["max", "Máximo"],
              ] as [GlassBlur, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPrefs({ glassBlur: id })}
                className={cn(
                  "glass-thin rounded-2xl px-3 py-3 text-sm font-medium",
                  mounted && prefs.glassBlur === id && "ring-2 ring-[var(--accent)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <ToggleRow
              label="Glow de pendientes"
              hint="Retroiluminación en módulos y bot cuando hay tareas"
              checked={prefs.pendingGlow}
              onChange={(pendingGlow) => setPrefs({ pendingGlow })}
            />
            <ToggleRow
              label="Orbes flotantes"
              hint="Atmósfera animada de fondo"
              checked={prefs.floatOrbs}
              onChange={(floatOrbs) => setPrefs({ floatOrbs })}
            />
            <ToggleRow
              label="Reducir transparencias"
              hint="Paneles más sólidos, menos blur (accesibilidad)"
              checked={prefs.reduceTransparency}
              onChange={(reduceTransparency) => setPrefs({ reduceTransparency })}
            />
          </div>

          <div className="mt-4">
            <Button type="button" variant="ghost" size="sm" onClick={resetPrefs}>
              Restaurar visuales por defecto
            </Button>
          </div>
        </Glass>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/app/configuracion/workflow">
            <Glass className="flex h-full items-start gap-3 p-5 transition hover:ring-1 hover:ring-[var(--glass-border)]">
              <GitBranch className="mt-0.5 h-5 w-5 text-[var(--accent)]" />
              <div>
                <h3 className="display text-base font-semibold">Workflow y roles</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Quién recibe cada etapa
                </p>
              </div>
            </Glass>
          </Link>
          <Link href="/app/tesoreria">
            <Glass className="flex h-full items-start gap-3 p-5 transition hover:ring-1 hover:ring-[var(--glass-border)]">
              <Wallet className="mt-0.5 h-5 w-5 text-[var(--accent-2)]" />
              <div>
                <h3 className="display text-base font-semibold">Bolsa</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Módulo nativo en Tesorería
                </p>
              </div>
            </Glass>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
