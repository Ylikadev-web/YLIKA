"use client";

import dynamic from "next/dynamic";

const BlackHole = dynamic(
  () => import("@/components/fx/black-hole").then((m) => m.BlackHole),
  { ssr: false },
);

/**
 * Full-bleed Black Hole stage for marketing/auth surfaces.
 * Tuned to YLIKA accents (teal ↔ amber cycle).
 */
export function BlackHoleBackdrop({
  interactive = true,
}: {
  interactive?: boolean;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[var(--bg)]" />
      <BlackHole
        className="absolute inset-0"
        backgroundColor="#05070a"
        speed={0.85}
        zoom={1.55}
        particleCount={14}
        orbSize={0.85}
        glow={0.1}
        contrast={2.6}
        mirrorSplits={2}
        warpEnabled
        distanceFade={0.42}
        colorShiftR={-1.2}
        colorShiftG={0.4}
        colorShiftB={-4.5}
        colorSpeed={0.18}
        opacity={0.9}
        cursorInteraction={interactive}
        cursorIntensity={1.1}
      />
      {/* Soft brand wash so glass cards stay readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_45%,transparent_20%,color-mix(in_srgb,var(--bg)_72%,transparent)_75%)]" />
    </div>
  );
}
