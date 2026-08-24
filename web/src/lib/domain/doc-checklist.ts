import type { EstatusExpediente } from "@/lib/domain/workflow";

export type DocChecklistItem = {
  tipo: string;
  label: string;
  /** Required once the expediente has reached this stage (inclusive) */
  fromStage: EstatusExpediente;
  sectors?: Array<"GOBIERNO" | "PRIVADO">;
};

/** Order used to decide if a stage has been "reached" */
export const STAGE_ORDER: EstatusExpediente[] = [
  "BORRADOR",
  "REVISION_REQUISITOS",
  "APTO",
  "ORDEN_COTIZAR",
  "EN_COTIZACION",
  "COMPARATIVO",
  "COTIZACION_FINAL",
  "PROPUESTA_ADMIN",
  "REVISION_DIRECTOR",
  "ENVIADA",
  "GANADA",
  "PERDIDA",
  "RECOTIZACION",
  "COMPRA",
  "ENTREGA",
  "COBRANZA",
  "CERRADO",
  "CANCELADO",
];

export const DOC_CHECKLIST: DocChecklistItem[] = [
  {
    tipo: "BASE_LICITACION",
    label: "Bases / convocatoria",
    fromStage: "REVISION_REQUISITOS",
    sectors: ["GOBIERNO"],
  },
  {
    tipo: "LISTA_LIMPIA",
    label: "Lista limpia (partidas)",
    fromStage: "ORDEN_COTIZAR",
  },
  {
    tipo: "COTIZACION_PROVEEDOR",
    label: "Cotización proveedor (≥1)",
    fromStage: "EN_COTIZACION",
  },
  {
    tipo: "COTIZACION_FINAL",
    label: "Cotización final YLIKA",
    fromStage: "COTIZACION_FINAL",
  },
  {
    tipo: "PROPUESTA_ECONOMICA",
    label: "Propuesta económica",
    fromStage: "PROPUESTA_ADMIN",
  },
  {
    tipo: "PROPUESTA_TECNICA",
    label: "Propuesta técnica",
    fromStage: "PROPUESTA_ADMIN",
    sectors: ["GOBIERNO"],
  },
  {
    tipo: "FALLO",
    label: "Fallo / acuse",
    fromStage: "ENVIADA",
  },
  {
    tipo: "OC",
    label: "Orden de compra",
    fromStage: "COMPRA",
  },
  {
    tipo: "REMISION",
    label: "Remisión",
    fromStage: "ENTREGA",
  },
  {
    tipo: "FACTURA",
    label: "Factura",
    fromStage: "COBRANZA",
  },
];

export const DOC_TIPO_LABEL: Record<string, string> = {
  BASE_LICITACION: "Bases",
  LISTA_LIMPIA: "Lista limpia",
  COTIZACION_PROVEEDOR: "Cotización proveedor",
  COTIZACION_FINAL: "Cotización final",
  PROPUESTA_ECONOMICA: "Propuesta económica",
  PROPUESTA_TECNICA: "Propuesta técnica",
  CONSTANCIA_EMPRESA: "Constancia empresa",
  FALLO: "Fallo / acuse",
  CONTRATO: "Contrato",
  OC: "Orden de compra",
  REMISION: "Remisión",
  FACTURA: "Factura",
  OTRO: "Otro",
};

export const DOC_UPLOAD_TIPOS = [
  "BASE_LICITACION",
  "LISTA_LIMPIA",
  "COTIZACION_PROVEEDOR",
  "COTIZACION_FINAL",
  "PROPUESTA_ECONOMICA",
  "PROPUESTA_TECNICA",
  "FALLO",
  "CONTRATO",
  "OC",
  "REMISION",
  "FACTURA",
  "OTRO",
] as const;

function stageIndex(estatus: string) {
  const i = STAGE_ORDER.indexOf(estatus as EstatusExpediente);
  return i >= 0 ? i : 0;
}

export function checklistForExpediente(input: {
  estatus: string;
  sector: "GOBIERNO" | "PRIVADO" | string;
  presentTipos: string[];
}) {
  const cur = stageIndex(input.estatus);
  const present = new Set(input.presentTipos);
  const items = DOC_CHECKLIST.filter((d) => {
    if (d.sectors && !d.sectors.includes(input.sector as "GOBIERNO" | "PRIVADO")) {
      return false;
    }
    return stageIndex(d.fromStage) <= cur;
  }).map((d) => ({
    ...d,
    ok: present.has(d.tipo),
  }));

  const required = items.length;
  const done = items.filter((i) => i.ok).length;
  const pct = required === 0 ? 100 : Math.round((done / required) * 100);
  const missing = items.filter((i) => !i.ok);

  return { items, required, done, pct, missing };
}
