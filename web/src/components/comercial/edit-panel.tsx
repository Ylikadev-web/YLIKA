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

  return (
    <Glass className="float-card mb-4 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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

      <form
        className="mb-4 flex flex-wrap items-end gap-2"
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
        className="mb-4 flex flex-wrap items-end gap-2"
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

      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          Partidas
        </p>
      </div>
      <ul className="mb-3 space-y-2">
        {partidas.map((p) => (
          <li
            key={p.id}
            className="glass-thin flex flex-wrap items-end gap-2 rounded-2xl p-3"
          >
            <form
              className="flex min-w-0 flex-1 flex-wrap items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("expedienteId", expedienteId);
                fd.set("tipo", "EDITAR_PARTIDA");
                fd.set("partidaId", p.id);
                run(fd);
              }}
            >
              <span className="text-xs text-[var(--text-muted)]">#{p.numero}</span>
              <input
                name="descripcion"
                defaultValue={p.descripcion}
                className="glass-thin h-9 min-w-[160px] flex-1 rounded-xl px-2 text-xs"
              />
              <input
                name="cantidad"
                defaultValue={p.cantidad}
                className="glass-thin h-9 w-16 rounded-xl px-2 text-xs"
              />
              <input
                name="unidad"
                defaultValue={p.unidad}
                className="glass-thin h-9 w-16 rounded-xl px-2 text-xs"
              />
              <Button type="submit" size="sm" variant="ghost" disabled={pending}>
                OK
              </Button>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData();
                fd.set("expedienteId", expedienteId);
                fd.set("tipo", "ELIMINAR_PARTIDA");
                fd.set("partidaId", p.id);
                run(fd);
              }}
            >
              <Button type="submit" size="sm" variant="danger" disabled={pending}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </form>
          </li>
        ))}
      </ul>

      <form
        className="flex flex-wrap items-end gap-2"
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

      {msg ? <p className="mt-3 text-xs text-[var(--accent)]">{msg}</p> : null}

      {cambiosPendientes.length > 0 && (
        <div className="mt-4 border-t border-[var(--glass-border)] pt-3">
          <p className="mb-2 text-xs font-semibold">
            Cambios esperando autorización ({cambiosPendientes.length})
          </p>
          <ul className="space-y-2">
            {cambiosPendientes.map((c) => (
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
            ))}
          </ul>
        </div>
      )}
    </Glass>
  );
}
