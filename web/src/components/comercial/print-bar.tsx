"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PrintBar({
  backHref,
  title,
}: {
  backHref: string;
  title: string;
}) {
  return (
    <div className="print:hidden sticky top-0 z-30 border-b border-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass)_92%,transparent)] px-4 py-3 backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Sin markup interno · listo para PDF / impresión
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={backHref}>
            <Button type="button" size="sm" variant="ghost">
              Expediente
            </Button>
          </Link>
          <Button
            type="button"
            size="sm"
            onClick={() => window.print()}
          >
            Imprimir / PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
