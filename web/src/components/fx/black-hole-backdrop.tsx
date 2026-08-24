"use client";

import dynamic from "next/dynamic";

const BlackHole = dynamic(
  () => import("@/components/fx/black-hole").then((m) => m.BlackHole),
  {
    ssr: false,
    loading: () => <div className="fx-aurora-fallback absolute inset-0" />,
  },
);

/**
 * Full-bleed Black Hole stage for marketing/auth surfaces.
 * z-0 (not negative) so it stays above body background.
 */
export function BlackHoleBackdrop({
  interactive = true,
}: {
  interactive?: boolean;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[#02040a]" />
      {/* Always-on CSS fallback so the page never looks empty while WebGL boots */}
      <div className="fx-aurora-fallback absolute inset-0" />
      <BlackHole
        className="absolute inset-0"
        backgroundColor="#02040a"
        speed={1.2}
        zoom={1.15}
        particleCount={20}
        orbSize={1.25}
        glow={0.28}
        contrast={1.9}
        mirrorSplits={3}
        warpEnabled
        distanceFade={0.62}
        colorShiftR={0.8}
        colorShiftG={-1.8}
        colorShiftB={-5.0}
        colorSpeed={0.32}
        opacity={1}
        cursorInteraction={interactive}
        cursorIntensity={1.4}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_75%_at_50%_42%,transparent_25%,rgba(2,4,10,0.45)_100%)]" />
    </div>
  );
}
