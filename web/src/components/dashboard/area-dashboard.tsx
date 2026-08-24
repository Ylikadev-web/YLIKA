import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Glass } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

type Kpi = {
  label: string;
  value: string;
  hint: string;
  href: string;
  tone: "amber" | "cyan" | "rose" | "mint";
};

type AreaCard = {
  codigo: string;
  nombre: string;
  descripcion: string;
  href: string;
  color: "amber" | "cyan" | "rose" | "mint";
  pendingCount: number;
};

type Pendiente = {
  id: string;
  title: string;
  href: string;
  owner: string;
  tone: "amber" | "cyan" | "rose" | "mint";
};

const toneBg: Record<Kpi["tone"], string> = {
  amber: "text-[var(--accent-2)]",
  cyan: "text-[var(--accent)]",
  rose: "text-[var(--danger)]",
  mint: "text-[var(--accent)]",
};

export function AreaDashboard({
  kpis,
  areas,
  pendientes,
}: {
  kpis: Kpi[];
  areas: AreaCard[];
  pendientes: Pendiente[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href}>
            <Glass className="p-4 transition hover:-translate-y-0.5">
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                {k.label}
              </p>
              <p className={cn("display mt-1 text-2xl font-semibold", toneBg[k.tone])}>
                {k.value}
              </p>
              <p className="mt-1 truncate text-[11px] text-[var(--text-muted)]">
                {k.hint}
              </p>
            </Glass>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Glass className="p-4 lg:col-span-3">
          <h2 className="text-sm font-semibold">Tus áreas</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {areas.map((a) => (
              <li key={a.codigo}>
                <Link
                  href={a.href}
                  className="glass-thin flex items-start justify-between gap-2 rounded-2xl px-3 py-3 transition hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{a.nombre}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                      {a.descripcion}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {a.pendingCount > 0 ? (
                      <span className="status-dot status-dot-urgent flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-[#111]">
                        {a.pendingCount}
                      </span>
                    ) : null}
                    <ArrowUpRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  </div>
                </Link>
              </li>
            ))}
            {areas.length === 0 ? (
              <li className="text-sm text-[var(--text-muted)] sm:col-span-2">
                Sin áreas asignadas. Pide a Sistemas que te asigne roles.
              </li>
            ) : null}
          </ul>
        </Glass>

        <Glass className="p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold">Alertas de tu bandeja</h2>
          <ul className="mt-3 space-y-2">
            {pendientes.map((p) => (
              <li key={p.id}>
                <Link
                  href={p.href}
                  className="block rounded-2xl px-2 py-2 transition hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]"
                >
                  <p className="text-xs font-medium leading-snug">{p.title}</p>
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    {p.owner}
                  </p>
                </Link>
              </li>
            ))}
            {pendientes.length === 0 ? (
              <li className="text-xs text-[var(--text-muted)]">
                Sin pendientes en tus áreas. Buen momento.
              </li>
            ) : null}
          </ul>
        </Glass>
      </div>
    </div>
  );
}
