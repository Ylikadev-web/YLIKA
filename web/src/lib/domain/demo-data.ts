import type { EstatusExpediente } from "@/lib/domain/workflow";

export type DemoPartida = {
  numero: number;
  descripcion: string;
  cantidad: number;
  unidad: string;
};

export type DemoQuoteCell = {
  precio: number;
  entrega: number;
  pctNacional?: number;
  selected?: boolean;
};

export type DemoExpediente = {
  id: string;
  codigo: string;
  empresa: "MONE" | "DAKAM" | "NARAMO";
  titulo: string;
  tipo: string;
  sector: "GOBIERNO" | "PRIVADO";
  cliente: string;
  estatus: EstatusExpediente;
  owner: string;
  apto: boolean | null;
  docsVencidos: number;
  partidas: DemoPartida[];
  proveedores: { alias: string; nombre: string }[];
  precios: Record<number, Record<string, DemoQuoteCell>>;
  markupPct: number;
};

export const DEMO_TEAM = [
  { name: "Laura", roles: ["LICITACIONES", "COMPRAS_VENTAS"] },
  { name: "Miguel", roles: ["COMPRAS_VENTAS", "ADMIN_SISTEMAS"] },
  { name: "Fernando", roles: ["COMPRAS", "COMPRAS_VENTAS"] },
  { name: "Itza", roles: ["ADMIN_FINANZAS"] },
  { name: "Nesim Zonana Bettech", roles: ["DIRECTOR"] },
];

export const DEMO_EXPEDIENTES: DemoExpediente[] = [
  {
    id: "exp-1",
    codigo: "YLK-MONE-2026-00041",
    empresa: "MONE",
    titulo: "Suministro válvulas e hidráulica · IMSS",
    tipo: "Licitación pública",
    sector: "GOBIERNO",
    cliente: "IMSS Delegación",
    estatus: "COMPARATIVO",
    owner: "Miguel / Fernando",
    apto: true,
    docsVencidos: 0,
    markupPct: 12,
    partidas: [
      {
        numero: 1,
        descripcion: 'Válvula mariposa 6" clase 150',
        cantidad: 12,
        unidad: "PZA",
      },
      {
        numero: 2,
        descripcion: "Tubo acero al carbón 6\" Sch40",
        cantidad: 240,
        unidad: "M",
      },
      {
        numero: 3,
        descripcion: "Codo 90° Sch40 6\"",
        cantidad: 48,
        unidad: "PZA",
      },
      {
        numero: 4,
        descripcion: "Empaque EPDM 6\"",
        cantidad: 60,
        unidad: "PZA",
      },
    ],
    proveedores: [
      { alias: "P1", nombre: "Acero Norte SA" },
      { alias: "P2", nombre: "Hidráulica MX" },
      { alias: "P3", nombre: "ValvePro" },
    ],
    precios: {
      1: {
        P1: { precio: 4200, entrega: 15, pctNacional: 70 },
        P2: { precio: 4050, entrega: 21, pctNacional: 55, selected: true },
        P3: { precio: 4300, entrega: 12, pctNacional: 65 },
      },
      2: {
        P1: { precio: 890, entrega: 10, pctNacional: 85, selected: true },
        P2: { precio: 910, entrega: 12, pctNacional: 80 },
        P3: { precio: 905, entrega: 14, pctNacional: 75 },
      },
      3: {
        P1: { precio: 120, entrega: 7, pctNacional: 60 },
        P2: { precio: 115, entrega: 9, pctNacional: 65, selected: true },
        P3: { precio: 118, entrega: 8, pctNacional: 62 },
      },
      4: {
        P1: { precio: 35, entrega: 5 },
        P2: { precio: 32, entrega: 5, selected: true },
        P3: { precio: 34, entrega: 6 },
      },
    },
  },
  {
    id: "exp-2",
    codigo: "YLK-MONE-2026-00042",
    empresa: "MONE",
    titulo: "Adquisición materiales · convocatoria estatal",
    tipo: "Invitación a 3",
    sector: "GOBIERNO",
    cliente: "Gobierno del Estado",
    estatus: "REVISION_REQUISITOS",
    owner: "Laura",
    apto: null,
    docsVencidos: 1,
    markupPct: 10,
    partidas: [],
    proveedores: [],
    precios: {},
  },
  {
    id: "exp-3",
    codigo: "YLK-NARAMO-2026-00007",
    empresa: "NARAMO",
    titulo: "Estacionamiento Plaza Norte",
    tipo: "Proyecto privado",
    sector: "PRIVADO",
    cliente: "Plaza Norte SA",
    estatus: "PROPUESTA_ADMIN",
    owner: "Itza",
    apto: true,
    docsVencidos: 0,
    markupPct: 15,
    partidas: [
      {
        numero: 1,
        descripcion: "Sistema control acceso",
        cantidad: 1,
        unidad: "LOT",
      },
    ],
    proveedores: [{ alias: "P1", nombre: "AccessTech" }],
    precios: {
      1: { P1: { precio: 185000, entrega: 30, selected: true } },
    },
  },
];
