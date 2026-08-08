"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Glass } from "@/components/ui/glass";
import { DEMO_TEAM } from "@/lib/domain/demo-data";
import { PIPELINE_STAGES } from "@/lib/domain/workflow";

const ASSIGN = [
  { stage: "Revisión / luz verde / orden cotizar", role: "LICITACIONES", who: "Laura" },
  { stage: "Cotización · comparativo · cot. final · recotizar", role: "COMPRAS_VENTAS", who: "Miguel, Fernando (+ Laura)" },
  { stage: "Propuesta económica/técnica · cobranza · bolsa", role: "ADMIN_FINANZAS", who: "Itza" },
  { stage: "Envío propuesta", role: "DIRECTOR", who: "Nesim Zonana Bettech" },
  { stage: "Roles + módulos + workflow", role: "ADMIN_SISTEMAS", who: "Miguel (perfil Sistemas)" },
];

export default function WorkflowConfigPage() {
  return (
    <AppShell
      title="Workflow y roles"
      subtitle="Solo ADMIN_SISTEMAS puede reasignar a quién cae cada etapa. Miguel opera con dos perfiles: Ventas/Compras y Sistemas."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Glass className="p-5">
          <h2 className="display text-lg font-semibold">Equipo</h2>
          <ul className="mt-4 space-y-2">
            {DEMO_TEAM.map((p) => (
              <li
                key={p.name}
                className="glass-thin flex items-center justify-between rounded-2xl px-4 py-3"
              >
                <span className="text-sm font-medium">{p.name}</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {p.roles.join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </Glass>

        <Glass className="p-5">
          <h2 className="display text-lg font-semibold">
            Asignación de etapas
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Editable en Supabase (`workflow_asignaciones`) cuando conectemos
            Auth. UI de drag-assign llega en la siguiente iteración admin.
          </p>
          <ul className="mt-4 space-y-2">
            {ASSIGN.map((a) => (
              <li key={a.stage} className="glass-thin rounded-2xl px-4 py-3">
                <p className="text-sm font-medium">{a.stage}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Rol {a.role} → {a.who}
                </p>
              </li>
            ))}
          </ul>
        </Glass>
      </div>

      <Glass className="mt-4 p-5">
        <h2 className="display text-lg font-semibold">Pipeline configurado</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {PIPELINE_STAGES.map((s) => (
            <div
              key={s.key}
              className="glass-thin rounded-2xl px-3 py-2 text-xs"
            >
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              {s.label}
            </div>
          ))}
        </div>
      </Glass>
    </AppShell>
  );
}
