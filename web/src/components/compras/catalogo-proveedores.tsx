"use client";

import { useMemo, useState } from "react";
import { Glass } from "@/components/ui/glass";
import {
  ESPECIALIDADES_SUGERIDAS,
  TIPOS_PROVEEDOR,
  TIPO_PROVEEDOR_LABEL,
  type TipoProveedor,
} from "@/lib/domain/proveedores";
import { cn } from "@/lib/utils";

type Marca = { id: string; nombre: string; categoria: string };

type Proveedor = {
  id: string;
  razonSocial: string;
  rfc: string | null;
  aliasCorto: string | null;
  contactoNombre: string | null;
  contactoEmail: string | null;
  contactoTel: string | null;
  tipo: string;
  especialidades: string[];
  zonaCobertura: string | null;
  preferido: boolean;
  calificacion: number;
  notas: string | null;
  marcas: Marca[];
};

export function CatalogoProveedores({
  proveedores,
}: {
  proveedores: Proveedor[];
}) {
  const [tipo, setTipo] = useState<string>("TODOS");
  const [q, setQ] = useState("");
  const [soloPreferidos, setSoloPreferidos] = useState(false);
  const [especialidad, setEspecialidad] = useState("");
  const [marca, setMarca] = useState("");

  const marcasOpts = useMemo(() => {
    const set = new Map<string, string>();
    for (const p of proveedores) {
      for (const m of p.marcas) set.set(m.id, m.nombre);
    }
    return [...set.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [proveedores]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return proveedores.filter((p) => {
      if (tipo !== "TODOS" && p.tipo !== tipo) return false;
      if (soloPreferidos && !p.preferido) return false;
      if (
        especialidad &&
        !p.especialidades.some(
          (e) => e.toLowerCase() === especialidad.toLowerCase(),
        )
      )
        return false;
      if (marca && !p.marcas.some((m) => m.id === marca)) return false;
      if (!qq) return true;
      const hay = [
        p.razonSocial,
        p.aliasCorto,
        p.rfc,
        p.zonaCobertura,
        ...p.especialidades,
        ...p.marcas.map((m) => m.nombre),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [proveedores, tipo, q, soloPreferidos, especialidad, marca]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { TODOS: proveedores.length };
    for (const t of TIPOS_PROVEEDOR) c[t] = 0;
    for (const p of proveedores) c[p.tipo] = (c[p.tipo] ?? 0) + 1;
    return c;
  }, [proveedores]);

  return (
    <Glass className="overflow-hidden">
      <div className="border-b border-[var(--glass-border)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            Catálogo ({filtered.length}/{proveedores.length})
          </p>
          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={soloPreferidos}
              onChange={(e) => setSoloPreferidos(e.target.checked)}
            />
            Solo preferidos
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTipo("TODOS")}
            className={cn(
              "rounded-2xl px-2.5 py-1 text-[11px] font-medium transition",
              tipo === "TODOS"
                ? "bg-[var(--accent)] text-[var(--bg)]"
                : "glass-thin text-[var(--text-muted)]",
            )}
          >
            Todos · {counts.TODOS}
          </button>
          {TIPOS_PROVEEDOR.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={cn(
                "rounded-2xl px-2.5 py-1 text-[11px] font-medium transition",
                tipo === t
                  ? "bg-[var(--accent)] text-[var(--bg)]"
                  : "glass-thin text-[var(--text-muted)]",
              )}
            >
              {TIPO_PROVEEDOR_LABEL[t]} · {counts[t] ?? 0}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar razón social, RFC, marca…"
            className="rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm sm:col-span-1"
          />
          <select
            value={especialidad}
            onChange={(e) => setEspecialidad(e.target.value)}
            className="rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Especialidad</option>
            {ESPECIALIDADES_SUGERIDAS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
          <select
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            className="rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm"
          >
            <option value="">Marca</option>
            {marcasOpts.map(([id, nombre]) => (
              <option key={id} value={id}>
                {nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="divide-y divide-[var(--glass-border)] text-sm">
        {filtered.map((p) => (
          <li key={p.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {p.preferido ? "★ " : ""}
                  {p.razonSocial}
                  {p.aliasCorto ? (
                    <span className="ml-1 text-xs text-[var(--text-muted)]">
                      ({p.aliasCorto})
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {TIPO_PROVEEDOR_LABEL[p.tipo as TipoProveedor] ?? p.tipo}
                  {p.zonaCobertura ? ` · ${p.zonaCobertura}` : ""}
                  {p.rfc ? ` · ${p.rfc}` : ""}
                  {" · "}
                  {"★".repeat(p.calificacion)}
                </p>
                {p.especialidades.length > 0 && (
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                    {p.especialidades.join(" · ")}
                  </p>
                )}
                {p.marcas.length > 0 && (
                  <p className="mt-1 text-[11px]">
                    Marcas:{" "}
                    <span className="text-[var(--accent)]">
                      {p.marcas.map((m) => m.nombre).join(", ")}
                    </span>
                  </p>
                )}
              </div>
              <div className="text-right text-[11px] text-[var(--text-muted)]">
                {p.contactoNombre ?? "—"}
                <br />
                {p.contactoEmail ?? p.contactoTel ?? ""}
              </div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-6 text-[var(--text-muted)]">
            Ningún proveedor con esos filtros.
          </li>
        )}
      </ul>
    </Glass>
  );
}
