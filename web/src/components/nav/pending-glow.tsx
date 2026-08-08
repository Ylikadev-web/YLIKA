"use client";

import { cn } from "@/lib/utils";
import { useUiPrefs } from "@/components/providers/ui-prefs-provider";

export function PendingGlow({
  active,
  className,
}: {
  active: boolean;
  className?: string;
}) {
  const { prefs } = useUiPrefs();
  if (!active || !prefs.pendingGlow) return null;
  return (
    <span
      aria-hidden
      className={cn("pending-glow-ring pointer-events-none absolute inset-0", className)}
    />
  );
}
