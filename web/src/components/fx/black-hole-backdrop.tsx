"use client";

import dynamic from "next/dynamic";

const BlackHole = dynamic(
  () => import("@/components/fx/black-hole").then((m) => m.BlackHole),
  { ssr: false },
);

/**
 * Full-bleed Black Hole stage for marketing/auth surfaces.
 * Tuned loud enough to read clearly behind the glass card.
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
      <div className="absolute inset-0 bg-[#02040a]" />
      <BlackHole
        className="absolute inset-0"
        backgroundColor="#02040a"
        speed={1.15}
        zoom={1.25}
        particleCount={18}
        orbSize={1.15}
        glow={0.22}
        contrast={2.1}
        mirrorSplits={3}
        warpEnabled
        distanceFade={0.55}
        colorShiftR={0.6}
        colorShiftG={-2.2}
        colorShiftB={-5.4}
        colorSpeed={0.28}
        opacity={1}
        cursorInteraction={interactive}
        cursorIntensity={1.35}
      />
      {/* Light edge vignette only — keep the center effect visible */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_45%,transparent_35%,rgba(2,4,10,0.55)_100%)]" />
    </div>
  );
}
