export const EXPEDIENTE_TAB_IDS = [
  "resumen",
  "archivo",
  "bases",
  "checklist",
  "edicion",
  "importar",
  "relaciones",
  "comparativo",
  "historial",
] as const;

export type ExpedienteTabId = (typeof EXPEDIENTE_TAB_IDS)[number];

/** Default tab sugerido según fase del expediente (server-safe) */
export function defaultTabForEstatus(estatus: string): ExpedienteTabId {
  switch (estatus) {
    case "REVISION_REQUISITOS":
      return "bases";
    case "APTO":
    case "ORDEN_COTIZAR":
      return "resumen";
    case "EN_COTIZACION":
      return "importar";
    case "COMPARATIVO":
    case "COTIZACION_FINAL":
      return "comparativo";
    case "GANADA":
    case "RECOTIZACION":
    case "COMPRA":
      return "checklist";
    case "ENTREGA":
      return "historial";
    case "PROPUESTA_ADMIN":
    case "REVISION_DIRECTOR":
    case "ENVIADA":
      return "archivo";
    case "COBRANZA":
      return "checklist";
    default:
      return "resumen";
  }
}

export function isExpedienteTabId(v: string | null | undefined): v is ExpedienteTabId {
  return !!v && (EXPEDIENTE_TAB_IDS as readonly string[]).includes(v);
}
