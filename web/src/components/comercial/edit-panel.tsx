"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import {
  resolverCambioAction,
  solicitarOAplicarCambioAction,
} from "@/app/app/comercial/edit-actions";
import { cn } from "@/lib/utils";

type Partida = {
  id: string;
  numero: number;
  descripcion: string;
  cantidad: string;
  unidad: string;
  marcaSolicitada?: string | null;
};

type CambioPendiente = {
  id: string;
  tipo: string;
  payload: unknown;
  motivo: string | null;
  solicitante: string | null;
};

export function EditPanel({
  expedienteId,
  titulo,
  clienteNombre,
  partidas,
  cambiosPendientes,
  canApprove,
}: {
  expedienteId: string;
  titulo: string;
  clienteNombre?: string | null;
  partidas: Partida[];
  cambiosPendientes: CambioPendiente[];
  canApprove: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [tituloEdit, setTituloEdit] = useState(titulo);
  const [forzarAprobacion, setForzarAprobacion] = useState(true);
  const [section, setSection] = useState<"datos" | "partidas" | "cambios">(
    "datos",
  );
  const [activePartidaId, setActivePartidaId] = useState(partidas[0]?.id ?? "");

  const activePartida =
    partidas.find((p) => p.id === activePartidaId) ?? partidas[0];

  function run(fd: FormData) {
    setMsg(null);
    if (forzarAprobacion) fd.set("forzarAprobacion", "1");
    start(async () => {
      const res = await solicitarOAplicarCambioAction(fd);
      if (!res.ok) setMsg(res.error);
      else {
        setMsg(
          res.mode === "pending"
            ? "Enviado a Itza/Nesim para autorización"
            : "Cambio aplicado",
        );
        router.refresh();
      }
    });
  }

  const sections = [
    { id: "datos" as const, label: "Datos" },
    {
      id: "partidas" as const,
      label: "Partidas",
      badge: partidas.length || null,
    },
    {
      id: "cambios" as const,
      label: "Cambios",
      badge: cambiosPendientes.length || null,
      hidden: cambiosPendientes.length === 0 && !canApprove,
    },
  ];

  return (
    <Glass className="float-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-border)] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Personalizar solicitud</h3>
          <p className="text-xs text-[var(--text-muted)]">
            Título, cliente y partidas — con autorización Itza/Nesim
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={forzarAprobacion}
            onChange={(e) => setForzarAprobacion(e.target.checked)}
          />
          Pedir autorización
        </label>
      </div>

      <div
        role="tablist"
        className="flex gap-0.5 overflow-x-auto border-b border-[var(--glass-border)] px-2 py-1.5"
      >
        {sections
          .filter((s) => !s.hidden)
          .map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={section === s.id}
              onClick={() => setSection(s.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition",
                section === s.id
                  ? "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]",
              )}
            >
              {s.label}
              {s.badge != null && s.badge !== 0 ? (
                <span className="text-[10px] text-[var(--accent-2)]">
                  {s.badge}
                </span>
              ) : null}
            </button>
          ))}
      </div>

      <div className="p-4">
        {section === "datos" && (
          <div className="space-y-4">
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("expedienteId", expedienteId);
                fd.set("tipo", "CAMBIO_TITULO");
                run(fd);
              }}
            >
              <label className="min-w-[220px] flex-1 text-xs">
                Título
                <input
                  name="titulo"
                  value={tituloEdit}
                  onChange={(e) => setTituloEdit(e.target.value)}
                  className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
                />
              </label>
              <Button type="submit" size="sm" variant="glass" disabled={pending}>
                <Pencil className="h-3.5 w-3.5" />
                Guardar título
              </Button>
            </form>

            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("expedienteId", expedienteId);
                fd.set("tipo", "CAMBIO_CLIENTE");
                run(fd);
              }}
            >
              <label className="min-w-[220px] flex-1 text-xs">
                Cliente
                <input
                  name="clienteNombre"
                  defaultValue={clienteNombre ?? ""}
                  placeholder="Razón social"
                  className="glass-thin mt-1 h-10 w-full rounded-2xl px-3 text-sm"
                />
              </label>
              <Button type="submit" size="sm" variant="ghost" disabled={pending}>
                Actualizar cliente
              </Button>
            </form>
          </div>
        )}

        {section === "partidas" && (
          <div>
            {partidas.length > 0 ? (
              <>
                <div
                  role="tablist"
                  className="mb-3 flex gap-0.5 overflow-x-auto"
                >
                  {partidas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePartidaId(p.id)}
                      className={cn(
                        "flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium transition",
                        p.id === activePartida?.id
                          ? "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)]"
                          : "text-[var(--text-muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)]",
                      )}
                    >
                      <span className="text-[var(--accent)]">#{p.numero}</span>
                      <span className="max-w-[120px] truncate">
                        {p.descripcion}
                      </span>
                    </button>
                  ))}
                </div>

                {activePartida && (
                  <div className="glass-thin rounded-2xl p-3">
                    <p className="mb-3 text-xs text-[var(--accent)]">
                      Partida #{activePartida.numero}
                    </p>
                    <form
                      className="grid gap-2 sm:grid-cols-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        fd.set("expedienteId", expedienteId);
                        fd.set("tipo", "EDITAR_PARTIDA");
                        fd.set("partidaId", activePartida.id);
                        run(fd);
                      }}
                    >
                      <label className="text-xs sm:col-span-2">
                        Descripción
                        <input
                          key={`d-${activePartida.id}`}
                          name="descripcion"
                          defaultValue={activePartida.descripcion}
                          className="glass-thin mt-1 h-9 w-full rounded-xl px-2 text-xs"
                        />
                      </label>
                      <label className="text-xs">
                        Cantidad
                        <input
                          key={`c-${activePartida.id}`}
                          name="cantidad"
                          defaultValue={activePartida.cantidad}
                          className="glass-thin mt-1 h-9 w-full rounded-xl px-2 text-xs"
                        />
                      </label>
                      <label className="text-xs">
                        Unidad
                        <input
                          key={`u-${activePartida.id}`}
                          name="unidad"
                          defaultValue={activePartida.unidad}
                          className="glass-thin mt-1 h-9 w-full rounded-xl px-2 text-xs"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2 sm:col-span-4">
                        <Button
                          type="submit"
                          size="sm"
                          variant="glass"
                          disabled={pending}
                        >
                          Guardar partida
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          disabled={pending}
                          onClick={() => {
                            const fd = new FormData();
                            fd.set("expedienteId", expedienteId);
                            fd.set("tipo", "ELIMINAR_PARTIDA");
                            fd.set("partidaId", activePartida.id);
                            run(fd);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <p className="mb-3 text-sm text-[var(--text-muted)]">
                Sin partidas. Agrega la primera abajo o importa Excel.
              </p>
            )}

            <form
              className="mt-4 flex flex-wrap items-end gap-2 border-t border-[var(--glass-border)] pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("expedienteId", expedienteId);
                fd.set("tipo", "AGREGAR_PARTIDA");
                run(fd);
                e.currentTarget.reset();
              }}
            >
              <input
                name="descripcion"
                required
                placeholder="Nueva partida"
                className="glass-thin h-10 min-w-[180px] flex-1 rounded-2xl px-3 text-sm"
              />
              <input
                name="cantidad"
                defaultValue="1"
                className="glass-thin h-10 w-20 rounded-2xl px-3 text-sm"
              />
              <input
                name="unidad"
                defaultValue="PZA"
                className="glass-thin h-10 w-20 rounded-2xl px-3 text-sm"
              />
              <Button type="submit" size="sm" disabled={pending}>
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </Button>
            </form>
          </div>
        )}

        {section === "cambios" && (
          <ul className="space-y-2">
            {cambiosPendientes.length === 0 ? (
              <li className="text-sm text-[var(--text-muted)]">
                Sin cambios pendientes.
              </li>
            ) : (
              cambiosPendientes.map((c) => (
                <li
                  key={c.id}
                  className="glass-thin flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3 py-2 text-xs"
                >
                  <div>
                    <p className="font-medium">
                      {c.tipo} · {c.solicitante}
                    </p>
                    <p className="text-[var(--text-muted)]">
                      {JSON.stringify(c.payload).slice(0, 120)}
                    </p>
                  </div>
                  {canApprove ? (
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="accent"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            const fd = new FormData();
                            fd.set("cambioId", c.id);
                            fd.set("decision", "APROBADA");
                            await resolverCambioAction(fd);
                            router.refresh();
                          })
                        }
                      >
                        Aprobar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            const fd = new FormData();
                            fd.set("cambioId", c.id);
                            fd.set("decision", "RECHAZADA");
                            await resolverCambioAction(fd);
                            router.refresh();
                          })
                        }
                      >
                        Rechazar
                      </Button>
                    </div>
                  ) : (
                    <span className="text-[var(--text-muted)]">Pendiente</span>
                  )}
                </li>
              ))
            )}
          </ul>
        )}

        {msg ? <p className="mt-3 text-xs text-[var(--accent)]">{msg}</p> : null}
      </div>
    </Glass>
  );
}
