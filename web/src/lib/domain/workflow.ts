export type EstatusExpediente =
  | "BORRADOR"
  | "REVISION_REQUISITOS"
  | "APTO"
  | "ORDEN_COTIZAR"
  | "EN_COTIZACION"
  | "COMPARATIVO"
  | "COTIZACION_FINAL"
  | "PROPUESTA_ADMIN"
  | "REVISION_DIRECTOR"
  | "ENVIADA"
  | "GANADA"
  | "PERDIDA"
  | "RECOTIZACION"
  | "COMPRA"
  | "ENTREGA"
  | "COBRANZA"
  | "CERRADO"
  | "CANCELADO";

export type PipelineStage = {
  key: EstatusExpediente;
  label: string;
  owner: string;
  color: string;
};

/** Pipeline visual del flujo gobierno (Laura → Ventas → Itza → Nesim → …) */
export const PIPELINE_STAGES: PipelineStage[] = [
  {
    key: "REVISION_REQUISITOS",
    label: "Revisión Laura",
    owner: "Licitaciones",
    color: "var(--accent)",
  },
  {
    key: "ORDEN_COTIZAR",
    label: "Orden cotizar",
    owner: "Laura → Ventas",
    color: "var(--accent-2)",
  },
  {
    key: "EN_COTIZACION",
    label: "Cotizando",
    owner: "Compras/Ventas",
    color: "var(--accent)",
  },
  {
    key: "COMPARATIVO",
    label: "Comparativo",
    owner: "Compras/Ventas",
    color: "var(--accent-3)",
  },
  {
    key: "COTIZACION_FINAL",
    label: "Cot. final",
    owner: "→ Itza",
    color: "var(--accent-2)",
  },
  {
    key: "PROPUESTA_ADMIN",
    label: "Propuesta",
    owner: "Admin/Finanzas",
    color: "var(--accent)",
  },
  {
    key: "REVISION_DIRECTOR",
    label: "Director",
    owner: "Nesim",
    color: "var(--accent-2)",
  },
  {
    key: "ENVIADA",
    label: "Enviada",
    owner: "Espera fallo",
    color: "var(--text-muted)",
  },
  {
    key: "RECOTIZACION",
    label: "Recotizar",
    owner: "Compras",
    color: "var(--accent)",
  },
  {
    key: "ENTREGA",
    label: "Remisión",
    owner: "→ Cobranza",
    color: "var(--accent-2)",
  },
];

export const ESTATUS_LABEL: Record<EstatusExpediente, string> = {
  BORRADOR: "Borrador",
  REVISION_REQUISITOS: "Revisión requisitos",
  APTO: "Apto",
  ORDEN_COTIZAR: "Orden de cotizar",
  EN_COTIZACION: "En cotización",
  COMPARATIVO: "Comparativo",
  COTIZACION_FINAL: "Cotización final",
  PROPUESTA_ADMIN: "Propuesta Admin",
  REVISION_DIRECTOR: "Revisión Director",
  ENVIADA: "Enviada",
  GANADA: "Ganada",
  PERDIDA: "Perdida",
  RECOTIZACION: "Recotización",
  COMPRA: "Compra",
  ENTREGA: "Entrega",
  COBRANZA: "Cobranza",
  CERRADO: "Cerrado",
  CANCELADO: "Cancelado",
};
