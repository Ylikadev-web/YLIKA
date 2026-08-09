export const TIPOS_PROVEEDOR = [
  "MATERIALES",
  "EQUIPOS",
  "SERVICIOS",
  "OBRA",
  "TRANSPORTE",
  "MIXTO",
] as const;

export type TipoProveedor = (typeof TIPOS_PROVEEDOR)[number];

export const TIPO_PROVEEDOR_LABEL: Record<TipoProveedor, string> = {
  MATERIALES: "Materiales",
  EQUIPOS: "Equipos",
  SERVICIOS: "Servicios",
  OBRA: "Obra",
  TRANSPORTE: "Transporte",
  MIXTO: "Mixto",
};

export const ESPECIALIDADES_SUGERIDAS = [
  "Acero",
  "Hidráulica",
  "Válvulas",
  "Eléctrico",
  "Iluminación",
  "Herramienta",
  "Cemento",
  "PVC",
  "Soldadura",
  "Transporte local",
  "Maquinaria",
  "Señalética",
];
