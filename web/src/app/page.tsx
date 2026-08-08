import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="app-atmosphere" aria-hidden />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="glass relative overflow-hidden rounded-[36px] px-8 py-14 sm:px-16">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--accent)_22%,transparent),transparent)]" />
          <div className="relative mx-auto mb-8 h-24 w-24 overflow-hidden rounded-[28px] ring-1 ring-[var(--glass-border)]">
            <Image
              src="/brand/ylika-logo.png"
              alt="YLIKA"
              fill
              className="object-cover"
              sizes="96px"
              priority
            />
          </div>
          <p className="display text-xs font-semibold tracking-[0.35em] text-[var(--accent)]">
            YLIKA
          </p>
          <h1 className="display mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Ops Platform
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            Expedientes, licitaciones y proyectos del grupo — con una interfaz
            que no se siente como el CRM de siempre.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/app"
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[var(--accent-2)] px-5 text-sm font-semibold text-[#111] shadow-[0_12px_40px_color-mix(in_srgb,var(--accent-2)_35%,transparent)] transition hover:brightness-110"
            >
              Entrar al workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/app/configuracion"
              className="glass-thin inline-flex h-12 items-center rounded-2xl px-5 text-sm font-medium text-[var(--text)]"
            >
              Ver temas
            </Link>
          </div>
          <p className="mt-8 text-[11px] text-[var(--text-muted)]">
            MONE · DAKAM · NARAMO · acceso temporal vía Cloudflare Tunnel
          </p>
        </div>
      </div>
    </div>
  );
}
