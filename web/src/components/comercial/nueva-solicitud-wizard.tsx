"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { createExpedienteAction } from "@/app/app/comercial/actions";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";
import { cn } from "@/lib/utils";

type Opt = { id: string; codigo?: string; nombre?: string; razonSocial?: string };

type PartidaRow = {
  key: string;
  descripcion: string;
  cantidad: string;
  unidad: string;
  marca: string;
};

const STEPS = [
  { id: 1, label: "Partidas" },
  { id: 2, label: "Contexto" },
] as const;

function newRow(): PartidaRow {
  return {
    key: Math.random().toString(36).slice(2),
    descripcion: "",
    cantidad: "1",
    unidad: "PZA",
    marca: "",
  };
}

export function NuevaSolicitudWizard({
  empresas,
  tiposGob,
  tiposPriv,
  defaultEmpresaId,
}: {
  empresas: Opt[];
  tiposGob: Opt[];
  tiposPriv: Opt[];
  defaultEmpresaId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [empresaId, setEmpresaId] = useState(defaultEmpresaId || empresas[0]?.id || "");
  const [sector, setSector] = useState<"GOBIERNO" | "PRIVADO">("GOBIERNO");
  const [tipoSolicitudId, setTipoSolicitudId] = useState(
    tiposGob[0]?.id || tiposPriv[0]?.id || "",
  );
  const [titulo, setTitulo] = useState("");
  const [partidas, setPartidas] = useState<PartidaRow[]>([newRow(), newRow()]);

  const [clienteNombre, setClienteNombre] = useState("");
  const [folioExterno, setFolioExterno] = useState("");
  const [caracter, setCaracter] = useState("Nacional");

  const tipos = useMemo(
    () => (sector === "GOBIERNO" ? tiposGob : tiposPriv),
    [sector, tiposGob, tiposPriv],
  );

  const partidasValidas = partidas.filter((p) => p.descripcion.trim());

  function goNext() {
    setError(null);
    if (!empresaId || !tipoSolicitudId || !titulo.trim()) {
      setError("Empresa, tipo y título son obligatorios");
      return;
    }
    if (partidasValidas.length === 0) {
      setError("Agrega al menos una partida (descripción)");
      return;
    }
    setStep(2);
  }

  function submit(skipCliente: boolean) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("empresaId", empresaId);
      fd.set("sector", sector);
      fd.set("tipoSolicitudId", tipoSolicitudId);
      fd.set("titulo", titulo.trim());
      if (!skipCliente && clienteNombre.trim()) {
        fd.set("clienteNombre", clienteNombre.trim());
      }
      if (folioExterno.trim()) fd.set("folioExterno", folioExterno.trim());
      if (caracter) fd.set("caracter", caracter);
      fd.set(
        "partidasJson",
        JSON.stringify(
          partidasValidas.map((p, i) => ({
            numero: i + 1,
            descripcion: p.descripcion.trim(),
            cantidad: p.cantidad || "1",
            unidad: p.unidad || "PZA",
            marca: p.marca || undefined,
          })),
        ),
      );
      try {
        const res = await createExpedienteAction(fd);
        router.push(`/app/comercial/${res.id}?tab=edicion`);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo crear");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-2">
        {STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              if (s.id === 1) setStep(1);
              else if (partidasValidas.length && titulo.trim()) setStep(2);
            }}
            className={cn(
              "flex-1 rounded-2xl px-3 py-2 text-xs font-medium transition",
              step === s.id
                ? "bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] text-[var(--text)] ring-1 ring-[var(--accent)]"
                : "glass-thin text-[var(--text-muted)]",
            )}
          >
            {s.id}. {s.label}
          </button>
        ))}
      </div>

      <Glass className="p-6">
        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-muted)]">
              Primero la lista de partidas. El cliente y CompraNet pueden ir
              después.
            </p>

            <label className="block">
              <span className="text-xs text-[var(--text-muted)]">Empresa</span>
              <select
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm"
              >
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.codigo} — {e.razonSocial}
                  </option>
                ))}
              </select>
            </label>

            <fieldset>
              <legend className="text-xs text-[var(--text-muted)]">Sector</legend>
              <div className="mt-1 grid grid-cols-2 gap-2">
                {(["GOBIERNO", "PRIVADO"] as const).map((sec) => (
                  <label
                    key={sec}
                    className="glass-thin flex items-center gap-2 rounded-2xl px-3 py-3 text-sm"
                  >
                    <input
                      type="radio"
                      checked={sector === sec}
                      onChange={() => {
                        setSector(sec);
                        const next = sec === "GOBIERNO" ? tiposGob : tiposPriv;
                        if (next[0]) setTipoSolicitudId(next[0].id);
                      }}
                    />
                    {sec === "GOBIERNO" ? "Gobierno" : "Privado"}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block">
              <span className="text-xs text-[var(--text-muted)]">Tipo</span>
              <select
                value={tipoSolicitudId}
                onChange={(e) => setTipoSolicitudId(e.target.value)}
                className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm"
              >
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-[var(--text-muted)]">Título</span>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm outline-none"
                placeholder="Ej. Suministro válvulas IMSS"
              />
            </label>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  Partidas ({partidasValidas.length})
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="glass"
                  onClick={() => setPartidas((p) => [...p, newRow()])}
                >
                  <Plus className="size-3.5" />
                  Partida
                </Button>
              </div>
              <ul className="space-y-2">
                {partidas.map((row, idx) => (
                  <li
                    key={row.key}
                    className="glass-thin grid gap-2 rounded-2xl p-3 sm:grid-cols-[1fr_72px_72px_auto]"
                  >
                    <input
                      value={row.descripcion}
                      onChange={(e) =>
                        setPartidas((rows) =>
                          rows.map((r) =>
                            r.key === row.key
                              ? { ...r, descripcion: e.target.value }
                              : r,
                          ),
                        )
                      }
                      placeholder={`Partida ${idx + 1} · descripción`}
                      className="rounded-xl border border-[var(--glass-border)] bg-transparent px-2.5 py-2 text-sm outline-none sm:col-span-1"
                    />
                    <input
                      value={row.cantidad}
                      onChange={(e) =>
                        setPartidas((rows) =>
                          rows.map((r) =>
                            r.key === row.key
                              ? { ...r, cantidad: e.target.value }
                              : r,
                          ),
                        )
                      }
                      placeholder="Cant"
                      className="rounded-xl border border-[var(--glass-border)] bg-transparent px-2.5 py-2 text-sm outline-none"
                    />
                    <input
                      value={row.unidad}
                      onChange={(e) =>
                        setPartidas((rows) =>
                          rows.map((r) =>
                            r.key === row.key
                              ? { ...r, unidad: e.target.value }
                              : r,
                          ),
                        )
                      }
                      placeholder="Ud"
                      className="rounded-xl border border-[var(--glass-border)] bg-transparent px-2.5 py-2 text-sm outline-none"
                    />
                    <div className="flex items-center gap-1 sm:flex-col">
                      <input
                        value={row.marca}
                        onChange={(e) =>
                          setPartidas((rows) =>
                            rows.map((r) =>
                              r.key === row.key
                                ? { ...r, marca: e.target.value }
                                : r,
                            ),
                          )
                        }
                        placeholder="Marca"
                        className="min-w-0 flex-1 rounded-xl border border-[var(--glass-border)] bg-transparent px-2.5 py-2 text-sm outline-none"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={partidas.length <= 1}
                        onClick={() =>
                          setPartidas((rows) =>
                            rows.filter((r) => r.key !== row.key),
                          )
                        }
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {error ? (
              <p className="text-sm text-[var(--danger)]">{error}</p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/app/comercial">
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Link>
              <Button type="button" onClick={goNext}>
                Continuar · contexto
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-muted)]">
              Opcional ahora. Puedes saltarlo y asignar cliente después en el
              expediente.
            </p>
            <label className="block">
              <span className="text-xs text-[var(--text-muted)]">
                Cliente / convocante
              </span>
              <input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm outline-none"
                placeholder="IMSS Delegación…"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-[var(--text-muted)]">
                  Folio CompraNet
                </span>
                <input
                  value={folioExterno}
                  onChange={(e) => setFolioExterno(e.target.value)}
                  className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs text-[var(--text-muted)]">Carácter</span>
                <select
                  value={caracter}
                  onChange={(e) => setCaracter(e.target.value)}
                  className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm"
                >
                  <option value="Nacional">Nacional</option>
                  <option value="Internacional">Internacional</option>
                  <option value="">N/A</option>
                </select>
              </label>
            </div>

            <div className="glass-thin rounded-2xl px-3 py-2 text-[11px] text-[var(--text-muted)]">
              Se crearán <strong className="text-[var(--text)]">{partidasValidas.length}</strong>{" "}
              partidas · {titulo || "sin título"}
            </div>

            {error ? (
              <p className="text-sm text-[var(--danger)]">{error}</p>
            ) : null}

            <div className="flex flex-wrap justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => setStep(1)}
              >
                Atrás
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="glass"
                  disabled={pending}
                  onClick={() => submit(true)}
                >
                  {pending ? "Creando…" : "Saltar y crear"}
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => submit(false)}
                >
                  {pending ? "Creando…" : "Crear expediente"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Glass>
    </div>
  );
}
