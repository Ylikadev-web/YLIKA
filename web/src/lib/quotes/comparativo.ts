import { aplicarMarkup } from "@/lib/parsing/excel-partidas";

export type Cell = {
  alias: string;
  precio: number;
  entrega?: number;
  pctNacional?: number;
};

export type SelectionMode = "PRECIO" | "ENTREGA" | "MIXTO";

export function pickBest(
  cells: Cell[],
  mode: SelectionMode = "PRECIO",
): string | null {
  if (!cells.length) return null;
  const ranked = [...cells].sort((a, b) => {
    if (mode === "ENTREGA") {
      return (a.entrega ?? 999) - (b.entrega ?? 999) || a.precio - b.precio;
    }
    if (mode === "MIXTO") {
      // precio + penalización suave por días
      const sa = a.precio + (a.entrega ?? 0) * 5;
      const sb = b.precio + (b.entrega ?? 0) * 5;
      return sa - sb;
    }
    return a.precio - b.precio;
  });
  return ranked[0]?.alias ?? null;
}

export type FinalLine = {
  numero: number;
  descripcion: string;
  cantidad: number;
  unidad: string;
  proveedorRef: string; // P1, P2 — nunca el nombre real en doc final
  precioUnitario: number; // ya con markup, con IVA
  importe: number;
};

export function buildCotizacionFinal(args: {
  partidas: {
    numero: number;
    descripcion: string;
    cantidad: number;
    unidad: string;
  }[];
  /** numero → alias → precio con IVA */
  selected: Record<number, { alias: string; precio: number }>;
  markupPct: number;
}): FinalLine[] {
  return args.partidas.map((p) => {
    const sel = args.selected[p.numero];
    const unit = sel ? aplicarMarkup(sel.precio, args.markupPct) : 0;
    return {
      numero: p.numero,
      descripcion: p.descripcion,
      cantidad: p.cantidad,
      unidad: p.unidad,
      proveedorRef: sel?.alias ?? "—",
      precioUnitario: unit,
      importe: Number((unit * p.cantidad).toFixed(2)),
    };
  });
}
