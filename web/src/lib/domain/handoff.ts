import type { EstatusExpediente } from "@/lib/domain/workflow";
import { defaultTabForEstatus } from "@/lib/domain/expediente-utils";

export type HandoffOption = {
  hacia: EstatusExpediente;
  label: string;
  owner: string;
  hint?: string;
};

/** Next explicit handoffs from current status (structure-first, no Drive). */
export const HANDOFFS_FROM: Partial<
  Record<EstatusExpediente, HandoffOption[]>
> = {
  REVISION_REQUISITOS: [
    {
      hacia: "ORDEN_COTIZAR",
      label: "Orden de cotizar → Ventas",
      owner: "Laura → Ventas",
      hint: "Requisitos OK; pasar a cotizar",
    },
    {
      hacia: "CANCELADO",
      label: "No participamos",
      owner: "Laura",
    },
  ],
  APTO: [
    {
      hacia: "ORDEN_COTIZAR",
      label: "Orden de cotizar → Ventas",
      owner: "Laura → Ventas",
    },
  ],
  ORDEN_COTIZAR: [
    {
      hacia: "EN_COTIZACION",
      label: "Iniciar cotización",
      owner: "Ventas",
    },
  ],
  EN_COTIZACION: [
    {
      hacia: "COMPARATIVO",
      label: "Pasar a comparativo",
      owner: "Ventas",
    },
  ],
  COMPARATIVO: [
    {
      hacia: "COTIZACION_FINAL",
      label: "Cotización final lista",
      owner: "Ventas",
    },
    {
      hacia: "PROPUESTA_ADMIN",
      label: "Pasar a Itza",
      owner: "Ventas → Itza",
    },
  ],
  COTIZACION_FINAL: [
    {
      hacia: "PROPUESTA_ADMIN",
      label: "Pasar a Itza",
      owner: "Ventas → Itza",
    },
  ],
  PROPUESTA_ADMIN: [
    {
      hacia: "REVISION_DIRECTOR",
      label: "Listo → Nesim",
      owner: "Itza → Nesim",
    },
  ],
  REVISION_DIRECTOR: [
    {
      hacia: "ENVIADA",
      label: "Marcar enviada",
      owner: "Nesim",
      hint: "Requiere cliente + contacto",
    },
  ],
  ENVIADA: [
    {
      hacia: "GANADA",
      label: "Fallo: ganada",
      owner: "Nesim",
    },
    {
      hacia: "PERDIDA",
      label: "Fallo: perdida",
      owner: "Nesim",
    },
  ],
  RECOTIZACION: [
    {
      hacia: "COMPRA",
      label: "Emitir compra / OC → Compras",
      owner: "Compras",
    },
  ],
  COMPRA: [
    {
      hacia: "ENTREGA",
      label: "Pasar a remisión / entrega",
      owner: "Compras → Entrega",
    },
  ],
  ENTREGA: [
    {
      hacia: "COBRANZA",
      label: "Entregado → cobranza Itza",
      owner: "→ Itza",
    },
  ],
  COBRANZA: [
    {
      hacia: "CERRADO",
      label: "Cerrar expediente",
      owner: "Itza",
    },
  ],
};

export function handoffsFor(estatus: string): HandoffOption[] {
  return HANDOFFS_FROM[estatus as EstatusExpediente] ?? [];
}

/** Deep-link to the right expediente tab for a status queue item */
export function expedienteHref(expedienteId: string, estatus: string) {
  const tab = defaultTabForEstatus(estatus);
  return `/app/comercial/${expedienteId}?tab=${tab}`;
}
