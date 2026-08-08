"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Glass } from "@/components/ui/glass";

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const [empresa, setEmpresa] = useState("MONE");
  const [sector, setSector] = useState<"GOBIERNO" | "PRIVADO">("GOBIERNO");

  return (
    <AppShell
      title="Nueva solicitud"
      subtitle="Paso 1 del expediente. Al guardar en Supabase se genera código YLK-EMPRESA-AÑO-#####."
    >
      <Glass className="max-w-xl p-6">
        <label className="block">
          <span className="text-xs text-[var(--text-muted)]">Empresa</span>
          <select
            className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
          >
            <option value="MONE">MONE</option>
            <option value="DAKAM">DAKAM</option>
            <option value="NARAMO">NARAMO</option>
          </select>
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["GOBIERNO", "PRIVADO"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSector(s)}
              className={
                sector === s
                  ? "rounded-2xl bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] px-3 py-3 text-sm ring-1 ring-[var(--accent)]"
                  : "glass-thin rounded-2xl px-3 py-3 text-sm"
              }
            >
              {s}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-xs text-[var(--text-muted)]">Título</span>
          <input
            className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm outline-none"
            placeholder="Ej. Suministro válvulas IMSS"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-xs text-[var(--text-muted)]">
            Tipo (catálogo LAASSP / privado)
          </span>
          <select className="glass-thin mt-1 h-11 w-full rounded-2xl px-3 text-sm">
            {sector === "GOBIERNO" ? (
              <>
                <option>Licitación pública</option>
                <option>Invitación a cuando menos tres personas</option>
                <option>Adjudicación directa</option>
              </>
            ) : (
              <>
                <option>Proyecto</option>
                <option>Venta directa</option>
              </>
            )}
          </select>
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => router.push("/app/comercial")}>
            Cancelar
          </Button>
          <Button onClick={() => router.push("/app/comercial/exp-1")}>
            Crear expediente (demo)
          </Button>
        </div>
      </Glass>
    </AppShell>
  );
}
