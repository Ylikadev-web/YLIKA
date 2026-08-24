"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, FileUp, FolderOpen } from "lucide-react";
import { uploadDocumentoExpedienteAction } from "@/app/app/comercial/actions";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import {
  DOC_TIPO_LABEL,
  DOC_UPLOAD_TIPOS,
  checklistForExpediente,
} from "@/lib/domain/doc-checklist";
import { cn } from "@/lib/utils";

export type ArchivoDoc = {
  id: string;
  tipo: string;
  nombre: string;
  mimeType?: string | null;
  driveFileId?: string | null;
  driveWebViewLink?: string | null;
  createdAt?: Date | string | null;
};

export function ArchivoPanel({
  expedienteId,
  estatus,
  sector,
  documentos,
  driveFolderId,
  driveWebViewLink,
}: {
  expedienteId: string;
  estatus: string;
  sector: string;
  documentos: ArchivoDoc[];
  driveFolderId?: string | null;
  driveWebViewLink?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tipo, setTipo] = useState<string>("BASE_LICITACION");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const presentTipos = useMemo(
    () => [...new Set(documentos.map((d) => d.tipo))],
    [documentos],
  );
  const check = useMemo(
    () =>
      checklistForExpediente({
        estatus,
        sector,
        presentTipos,
      }),
    [estatus, sector, presentTipos],
  );

  const driveLive =
    !!driveFolderId && !String(driveFolderId).startsWith("stub:");

  function onUpload(fd: FormData) {
    setMsg(null);
    setErr(null);
    start(async () => {
      const res = await uploadDocumentoExpedienteAction(fd);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setMsg(
        res.driveSynced
          ? "Archivo guardado y espejado en Drive"
          : `Archivo guardado${res.driveReason ? ` (Drive: ${res.driveReason})` : ""}`,
      );
      router.refresh();
    });
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_1.1fr]">
      <Glass className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="display font-semibold">Archivo del expediente</h3>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Fuente operativa en la app; Drive es el espejo humano.
            </p>
          </div>
          {driveWebViewLink ? (
            <a
              href={driveWebViewLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-[var(--accent)] ring-1 ring-[var(--glass-border)]"
            >
              <FolderOpen className="size-3.5" />
              Abrir Drive
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <span className="rounded-xl px-2.5 py-1.5 text-[11px] text-[var(--text-muted)] ring-1 ring-[var(--glass-border)]">
              {driveLive ? "Drive sin link" : "Drive stub (sin creds)"}
            </span>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">
              Checklist docs · etapa actual
            </span>
            <span className="font-medium">
              {check.done}/{check.required} · {check.pct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--text)_8%,transparent)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-all"
              style={{ width: `${check.pct}%` }}
            />
          </div>
          <ul className="mt-3 space-y-1.5">
            {check.items.map((item) => (
              <li
                key={item.tipo}
                className={cn(
                  "flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs",
                  item.ok
                    ? "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                    : "glass-thin text-[var(--text-muted)]",
                )}
              >
                <span>{item.label}</span>
                <span className="font-medium">{item.ok ? "OK" : "Falta"}</span>
              </li>
            ))}
          </ul>
        </div>

        <form
          className="space-y-2 border-t border-[var(--glass-border)] pt-3"
          action={(fd) => onUpload(fd)}
        >
          <input type="hidden" name="expedienteId" value={expedienteId} />
          <p className="text-xs font-medium text-[var(--text-muted)]">
            Subir documento
          </p>
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="glass-thin h-10 w-full rounded-2xl px-3 text-sm"
          >
            {DOC_UPLOAD_TIPOS.map((t) => (
              <option key={t} value={t}>
                {DOC_TIPO_LABEL[t] ?? t}
              </option>
            ))}
          </select>
          <input
            type="file"
            name="file"
            required
            className="block w-full text-xs text-[var(--text-muted)] file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--accent)] file:px-3 file:py-2 file:text-xs file:font-medium file:text-[var(--bg)]"
          />
          <Button type="submit" size="sm" disabled={pending}>
            <FileUp className="size-3.5" />
            {pending ? "Subiendo…" : "Guardar en expediente"}
          </Button>
          {err ? <p className="text-sm text-[var(--danger)]">{err}</p> : null}
          {msg ? (
            <p className="text-sm text-[var(--accent)]">{msg}</p>
          ) : null}
        </form>
      </Glass>

      <Glass className="p-5">
        <h3 className="display font-semibold">Documentos ({documentos.length})</h3>
        <ul className="mt-3 max-h-[70vh] space-y-2 overflow-y-auto">
          {documentos.length === 0 ? (
            <li className="text-sm text-[var(--text-muted)]">
              Aún no hay archivos. Sube bases, propuestas, fallo, OC…
            </li>
          ) : (
            documentos.map((d) => (
              <li
                key={d.id}
                className="glass-thin flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.nombre}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {DOC_TIPO_LABEL[d.tipo] ?? d.tipo}
                    {d.createdAt
                      ? ` · ${new Date(d.createdAt).toLocaleString("es-MX")}`
                      : ""}
                    {d.driveFileId && !String(d.driveFileId).startsWith("stub:")
                      ? " · en Drive"
                      : " · solo app"}
                  </p>
                </div>
                {d.driveWebViewLink ? (
                  <a
                    href={d.driveWebViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-[var(--accent)]"
                  >
                    Ver en Drive
                  </a>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </Glass>
    </div>
  );
}
