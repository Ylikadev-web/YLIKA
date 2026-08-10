"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Tag } from "lucide-react";
import {
  createMarcaAction,
  createProveedorAction,
} from "@/app/app/actions-modules";
import { Button } from "@/components/ui/button";
import { GlassModal } from "@/components/ui/glass-modal";
import {
  ESPECIALIDADES_SUGERIDAS,
  TIPOS_PROVEEDOR,
  TIPO_PROVEEDOR_LABEL,
} from "@/lib/domain/proveedores";

type MarcaOpt = { id: string; nombre: string; categoria: string };

const fieldClass =
  "mt-1 w-full rounded-2xl border border-[var(--glass-border)] bg-transparent px-3 py-2 text-sm";

export function ComprasAltaToolbar({ marcas }: { marcas: MarcaOpt[] }) {
  const router = useRouter();
  const [openProv, setOpenProv] = useState(false);
  const [openMarca, setOpenMarca] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submitProveedor(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createProveedorAction(formData);
        setOpenProv(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  function submitMarca(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createMarcaAction(formData);
        setOpenMarca(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setError(null);
            setOpenProv(true);
          }}
        >
          <Plus className="size-3.5" />
          Proveedor
        </Button>
        <Button
          type="button"
          size="sm"
          variant="glass"
          onClick={() => {
            setError(null);
            setOpenMarca(true);
          }}
        >
          <Tag className="size-3.5" />
          Marca
        </Button>
        {marcas.length > 0 ? (
          <ul className="ml-1 flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {marcas.map((m) => (
              <li
                key={m.id}
                className="glass-thin rounded-2xl px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
              >
                {m.nombre}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-xs text-[var(--text-muted)]">
            Sin marcas aún
          </span>
        )}
      </div>

      <GlassModal
        open={openProv}
        onClose={() => !pending && setOpenProv(false)}
        title="Alta de proveedor"
        description="Clasifica por tipo, especialidad, zona, marcas y preferencia."
        wide
      >
        <form action={submitProveedor} className="grid gap-3 md:grid-cols-2">
          <label className="text-sm md:col-span-2">
            Razón social
            <input name="razonSocial" required className={fieldClass} />
          </label>
          <label className="text-sm">
            Alias corto
            <input name="aliasCorto" className={fieldClass} />
          </label>
          <label className="text-sm">
            RFC
            <input name="rfc" className={fieldClass} />
          </label>
          <label className="text-sm">
            Tipo
            <select
              name="tipo"
              defaultValue="MATERIALES"
              className={fieldClass}
            >
              {TIPOS_PROVEEDOR.map((t) => (
                <option key={t} value={t}>
                  {TIPO_PROVEEDOR_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Zona cobertura
            <input
              name="zonaCobertura"
              placeholder="CDMX / Bajío / Nacional"
              className={fieldClass}
            />
          </label>
          <label className="text-sm md:col-span-2">
            Especialidades (coma)
            <input
              name="especialidades"
              list="esp-sugeridas-modal"
              placeholder={ESPECIALIDADES_SUGERIDAS.slice(0, 4).join(", ")}
              className={fieldClass}
            />
            <datalist id="esp-sugeridas-modal">
              {ESPECIALIDADES_SUGERIDAS.map((e) => (
                <option key={e} value={e} />
              ))}
            </datalist>
          </label>
          <label className="text-sm">
            Contacto
            <input name="contactoNombre" className={fieldClass} />
          </label>
          <label className="text-sm">
            Email
            <input name="contactoEmail" type="email" className={fieldClass} />
          </label>
          <label className="text-sm">
            Teléfono
            <input name="contactoTel" className={fieldClass} />
          </label>
          <label className="text-sm">
            Calificación (1–5)
            <input
              name="calificacion"
              type="number"
              min={1}
              max={5}
              defaultValue={3}
              className={fieldClass}
            />
          </label>
          {marcas.length > 0 ? (
            <fieldset className="md:col-span-2">
              <legend className="text-sm">Marcas que maneja</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {marcas.map((m) => (
                  <label
                    key={m.id}
                    className="glass-thin flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 text-xs"
                  >
                    <input type="checkbox" name="marcaIds" value={m.id} />
                    {m.nombre}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="preferido" />
            Proveedor preferido
          </label>
          {error ? (
            <p className="text-sm text-[var(--danger)] md:col-span-2">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2 md:col-span-2">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setOpenProv(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar proveedor"}
            </Button>
          </div>
        </form>
      </GlassModal>

      <GlassModal
        open={openMarca}
        onClose={() => !pending && setOpenMarca(false)}
        title="Agregar marca"
        description="Catálogo transversal para Relaciones y filtros."
      >
        <form action={submitMarca} className="grid gap-3">
          <label className="text-sm">
            Nombre
            <input name="nombre" required className={fieldClass} />
          </label>
          <label className="text-sm">
            Categoría
            <input
              name="categoria"
              defaultValue="GENERAL"
              className={fieldClass}
            />
          </label>
          {error ? (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => setOpenMarca(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="glass" disabled={pending}>
              {pending ? "Guardando…" : "Agregar marca"}
            </Button>
          </div>
        </form>
      </GlassModal>
    </>
  );
}
