"use client";

import { useMemo, useState, useTransition } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import {
  importCotizacionExcelAction,
  importListaLimpiaExcelAction,
} from "@/app/app/comercial/actions";

type ProveedorOpt = {
  id: string;
  razonSocial: string;
  preferido: boolean;
  tipo: string;
  especialidades: string[];
};

export function ExcelImportPanel({
  expedienteId,
  nextAlias,
  proveedores = [],
}: {
  expedienteId: string;
  nextAlias: string;
  proveedores?: ProveedorOpt[];
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [proveedorNombre, setProveedorNombre] = useState("");

  const preferidos = useMemo(
    () => proveedores.filter((p) => p.preferido),
    [proveedores],
  );
  const sugerido = preferidos[0]?.razonSocial ?? "";

  function run(
    action: (
      fd: FormData,
    ) => Promise<
      { ok: true; message: string } | { ok: false; error: string }
    >,
    form: HTMLFormElement,
  ) {
    setMsg(null);
    setErr(null);
    start(async () => {
      const fd = new FormData(form);
      const res = await action(fd);
      if (res.ok) setMsg(res.message);
      else setErr(res.error);
    });
  }

  return (
    <Glass className="float-card mb-4 p-4">
      <div className="mb-3 flex items-center gap-2">
        <FileSpreadsheet className="h-4 w-4 text-[var(--accent)]" />
        <h3 className="text-sm font-semibold">Importar Excel</h3>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <form
          className="glass-thin space-y-2 rounded-2xl p-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(importListaLimpiaExcelAction, e.currentTarget);
          }}
        >
          <p className="text-xs font-medium">Lista limpia → partidas</p>
          <input type="hidden" name="expedienteId" value={expedienteId} />
          <input
            name="file"
            type="file"
            accept=".xlsx,.xls,.csv"
            required
            className="block w-full text-xs text-[var(--text-muted)] file:mr-2 file:rounded-xl file:border-0 file:bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] file:px-3 file:py-1.5 file:text-xs file:text-[var(--text)]"
          />
          <Button type="submit" size="sm" variant="glass" disabled={pending}>
            <Upload className="h-3.5 w-3.5" />
            Cargar lista
          </Button>
        </form>

        <form
          className="glass-thin space-y-2 rounded-2xl p-3"
          onSubmit={(e) => {
            e.preventDefault();
            run(importCotizacionExcelAction, e.currentTarget);
          }}
        >
          <p className="text-xs font-medium">
            Cotización proveedor ({nextAlias})
          </p>
          <input type="hidden" name="expedienteId" value={expedienteId} />
          <input type="hidden" name="alias" value={nextAlias} />

          {preferidos.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {preferidos.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProveedorNombre(p.razonSocial)}
                  className="rounded-xl bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] px-2 py-1 text-[10px] font-medium text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--accent)_28%,transparent)]"
                  title={p.especialidades.join(", ") || p.tipo}
                >
                  ★ {p.razonSocial}
                </button>
              ))}
            </div>
          )}

          <input
            name="proveedorNombre"
            required
            list="prov-sugeridos"
            value={proveedorNombre}
            onChange={(e) => setProveedorNombre(e.target.value)}
            placeholder={
              sugerido
                ? `ej. ${sugerido}`
                : "Nombre proveedor"
            }
            className="glass-thin h-9 w-full rounded-xl px-3 text-xs"
          />
          <datalist id="prov-sugeridos">
            {proveedores.map((p) => (
              <option key={p.id} value={p.razonSocial}>
                {p.preferido ? "Preferido" : p.tipo}
              </option>
            ))}
          </datalist>

          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <input name="incluyeIva" type="checkbox" defaultChecked value="1" />
            Precios con IVA
          </label>
          <input
            name="file"
            type="file"
            accept=".xlsx,.xls,.csv"
            required
            className="block w-full text-xs text-[var(--text-muted)] file:mr-2 file:rounded-xl file:border-0 file:bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] file:px-3 file:py-1.5 file:text-xs file:text-[var(--text)]"
          />
          <Button type="submit" size="sm" disabled={pending}>
            <Upload className="h-3.5 w-3.5" />
            Cargar cotización
          </Button>
        </form>
      </div>

      {msg ? <p className="mt-3 text-xs text-[var(--accent)]">{msg}</p> : null}
      {err ? <p className="mt-3 text-xs text-[var(--danger)]">{err}</p> : null}
    </Glass>
  );
}
