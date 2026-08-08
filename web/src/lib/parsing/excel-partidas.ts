/**
 * Parser determinista de listas limpias / cotizaciones Excel.
 * Sin RAG ni “knowledge base” de tokens: aliases en DB + fuzzy match local.
 */
import * as XLSX from "xlsx";

export type ParsedRow = {
  numero?: number;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precio?: number;
  marca?: string;
  entregaDias?: number;
  raw: Record<string, unknown>;
};

const ALIASES: Record<string, string[]> = {
  descripcion: [
    "descripcion",
    "descripción",
    "concepto",
    "producto",
    "detalle",
    "descripcion del bien",
  ],
  cantidad: ["cantidad", "cant", "qty", "cantidad solicitada"],
  unidad: ["unidad", "u.m.", "um", "unidad de medida"],
  precio: [
    "precio",
    "p.unitario",
    "precio unitario",
    "importe unitario",
    "precio con iva",
    "p.u.",
  ],
  marca: ["marca", "marca ofertada"],
  entrega: ["entrega", "tiempo de entrega", "dias entrega", "días"],
  numero: ["no", "nº", "num", "partida", "#", "item"],
};

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mapHeader(header: string): string | null {
  const h = norm(header);
  for (const [field, aliases] of Object.entries(ALIASES)) {
    if (aliases.some((a) => h === a || h.includes(a))) return field;
  }
  return null;
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,\s]/g, "").replace(",", ""));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** Extrae filas de un ArrayBuffer Excel/CSV. */
export function parseExcelPartidas(buffer: ArrayBuffer): {
  rows: ParsedRow[];
  headers: string[];
  mapping: Record<string, string>;
} {
  const wb = XLSX.read(buffer, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  if (!json.length) return { rows: [], headers: [], mapping: {} };

  const headers = Object.keys(json[0]);
  const mapping: Record<string, string> = {};
  for (const h of headers) {
    const field = mapHeader(h);
    if (field && !mapping[field]) mapping[field] = h;
  }

  const rows: ParsedRow[] = json
    .map((raw, idx) => {
      const descripcion = String(raw[mapping.descripcion] ?? "").trim();
      if (!descripcion) return null;
      return {
        numero: toNumber(raw[mapping.numero]) ?? idx + 1,
        descripcion,
        cantidad: toNumber(raw[mapping.cantidad]) ?? 1,
        unidad: String(raw[mapping.unidad] ?? "PZA").trim() || "PZA",
        precio: toNumber(raw[mapping.precio]),
        marca: mapping.marca ? String(raw[mapping.marca] || "").trim() : undefined,
        entregaDias: toNumber(raw[mapping.entrega]),
        raw,
      } satisfies ParsedRow;
    })
    .filter(Boolean) as ParsedRow[];

  return { rows, headers, mapping };
}

/**
 * Empareja filas de cotización proveedor → partidas de lista limpia.
 * Score por tokens; umbral bajo → NEEDS_REVIEW (humano confirma).
 */
export function matchPartidas(
  limpia: { id: string; numero: number; descripcion: string }[],
  ofertadas: ParsedRow[],
): {
  partidaId: string | null;
  numero: number | null;
  row: ParsedRow;
  confidence: number;
}[] {
  const tokenize = (s: string) =>
    new Set(
      norm(s)
        .split(/[^a-z0-9]+/)
        .filter((t) => t.length > 1),
    );

  return ofertadas.map((row) => {
    const tokens = tokenize(row.descripcion);
    let best = { id: null as string | null, numero: null as number | null, score: 0 };
    for (const p of limpia) {
      const pt = tokenize(p.descripcion);
      let inter = 0;
      tokens.forEach((t) => {
        if (pt.has(t)) inter += 1;
      });
      const score = inter / Math.max(tokens.size, pt.size, 1);
      if (score > best.score) best = { id: p.id, numero: p.numero, score };
    }
    return {
      partidaId: best.score >= 0.35 ? best.id : null,
      numero: best.score >= 0.35 ? best.numero : null,
      row,
      confidence: Number(best.score.toFixed(3)),
    };
  });
}

/** Asegura precio con IVA 16%. Si `incluyeIva` false, multiplica. */
export function precioConIva(precio: number, incluyeIva: boolean) {
  return incluyeIva ? precio : Number((precio * 1.16).toFixed(4));
}

/** Aplica markup interno (no se imprime el %). */
export function aplicarMarkup(precioConIvaValue: number, markupPct: number) {
  return Number((precioConIvaValue * (1 + markupPct / 100)).toFixed(4));
}
