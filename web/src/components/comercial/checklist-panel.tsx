import { Glass } from "@/components/ui/glass";
import { Button } from "@/components/ui/button";
import { completarTareaExpedienteAction } from "@/app/app/comercial/actions";

type Tarea = {
  id: string;
  tipo: string;
  titulo: string;
  estado: string;
  orden: number;
  asignadoNombre: string | null;
  completedAt: Date | null;
};

export function ChecklistPanel({
  expedienteId,
  tareas,
  estatus,
}: {
  expedienteId: string;
  tareas: Tarea[];
  estatus: string;
}) {
  if (
    tareas.length === 0 &&
    !["GANADA", "RECOTIZACION", "COMPRA", "ENTREGA", "COBRANZA"].includes(
      estatus,
    )
  ) {
    return null;
  }

  const pendientes = tareas.filter((t) => t.estado === "PENDIENTE");
  const hechos = tareas.filter((t) => t.estado === "HECHO");

  return (
    <Glass className="mb-4 overflow-hidden">
      <div className="border-b border-[var(--glass-border)] px-5 py-4">
        <h3 className="display text-lg font-semibold">Checklist operativo</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Se genera al ganar (recotizar proveedores) y al entregar (facturar).
          {pendientes.length
            ? ` · ${pendientes.length} pendiente${pendientes.length === 1 ? "" : "s"}`
            : " · al día"}
        </p>
      </div>

      {tareas.length === 0 ? (
        <p className="px-5 py-6 text-sm text-[var(--text-muted)]">
          Sin tareas aún. Al marcar Ganada aparecerán aquí.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--glass-border)]">
          {tareas.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
            >
              <div className="min-w-0">
                <p
                  className={
                    t.estado === "HECHO"
                      ? "text-sm text-[var(--text-muted)] line-through"
                      : "text-sm font-medium"
                  }
                >
                  {t.titulo}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {t.tipo}
                  {t.asignadoNombre ? ` · ${t.asignadoNombre}` : ""}
                  {t.completedAt
                    ? ` · ${new Date(t.completedAt).toLocaleDateString("es-MX")}`
                    : ""}
                </p>
              </div>
              {t.estado === "PENDIENTE" ? (
                <form action={completarTareaExpedienteAction}>
                  <input type="hidden" name="tareaId" value={t.id} />
                  <input type="hidden" name="expedienteId" value={expedienteId} />
                  <Button type="submit" size="sm" variant="glass">
                    Hecho
                  </Button>
                </form>
              ) : (
                <span className="text-[11px] uppercase tracking-wider text-[var(--accent)]">
                  OK
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {hechos.length > 0 && pendientes.length === 0 && (
        <p className="border-t border-[var(--glass-border)] px-5 py-3 text-xs text-[var(--accent)]">
          Checklist completo.
        </p>
      )}
    </Glass>
  );
}
