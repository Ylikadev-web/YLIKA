"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { eliminarSolicitudAction } from "@/app/app/comercial/actions";
import { Button } from "@/components/ui/button";
import { GlassModal } from "@/components/ui/glass-modal";
import { Input } from "@/components/ui/input";

type Props = {
  expedienteId: string;
  codigo: string;
  compact?: boolean;
};

export function DeleteSolicitudButton({
  expedienteId,
  codigo,
  compact,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmCodigo, setConfirmCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("expedienteId", expedienteId);
      fd.set("confirmCodigo", confirmCodigo.trim());
      const res = await eliminarSolicitudAction(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.push("/app/comercial");
      router.refresh();
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="danger"
        size={compact ? "sm" : "md"}
        onClick={() => {
          setConfirmCodigo("");
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 className="size-3.5" />
        Eliminar
      </Button>

      <GlassModal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Eliminar solicitud"
        description={`Esta acción borra la solicitud ${codigo} y todo su expediente (partidas, cotizaciones, documentos, historial). No se puede deshacer.`}
      >
        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[var(--muted)]">
              Escribe el folio{" "}
              <span className="font-mono text-[var(--fg)]">{codigo}</span> para
              confirmar
            </span>
            <Input
              value={confirmCodigo}
              onChange={(e) => setConfirmCodigo(e.target.value)}
              placeholder={codigo}
              autoComplete="off"
              disabled={pending}
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
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={
                pending ||
                confirmCodigo.trim().toUpperCase() !== codigo.toUpperCase()
              }
              onClick={handleDelete}
            >
              {pending ? "Eliminando…" : "Eliminar definitivamente"}
            </Button>
          </div>
        </div>
      </GlassModal>
    </>
  );
}
