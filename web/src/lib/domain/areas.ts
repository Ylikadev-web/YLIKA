/** Áreas operativas YLIKA — alineadas a roles + carpetas Drive */

export type AreaCodigo =
  | "SISTEMAS"
  | "LICITACIONES"
  | "COMERCIAL"
  | "PROPUESTAS"
  | "DIRECCION"
  | "COMPRAS"
  | "ENTREGAS"
  | "CLIENTES"
  | "TESORERIA"
  | "DOCUMENTOS";

export type AreaDef = {
  codigo: AreaCodigo;
  nombre: string;
  descripcion: string;
  /** Roles que habilitan esta área en dashboard/nav */
  roles: string[];
  href: string;
  driveSubfolder: string;
  color: "amber" | "cyan" | "rose" | "mint";
};

export const AREAS: AreaDef[] = [
  {
    codigo: "SISTEMAS",
    nombre: "Sistemas",
    descripcion: "Usuarios, roles, integraciones y salud del ERP",
    roles: ["ADMIN_SISTEMAS"],
    href: "/app/configuracion",
    driveSubfolder: "00-Sistemas",
    color: "mint",
  },
  {
    codigo: "LICITACIONES",
    nombre: "Licitaciones",
    descripcion: "Requisitos, docs empresa, luz verde y bases",
    roles: ["LICITACIONES", "ADMIN_SISTEMAS"],
    href: "/app/licitaciones",
    driveSubfolder: "02-Licitaciones-Laura",
    color: "amber",
  },
  {
    codigo: "COMERCIAL",
    nombre: "Comercial",
    descripcion: "Solicitudes, partidas, cotizaciones y comparativo",
    roles: ["COMPRAS_VENTAS", "ADMIN_SISTEMAS"],
    href: "/app/comercial",
    driveSubfolder: "03-Cotizaciones-Proveedores",
    color: "cyan",
  },
  {
    codigo: "PROPUESTAS",
    nombre: "Propuestas · Admin",
    descripcion: "Propuesta económica, cobranza y facturación",
    roles: ["ADMIN_FINANZAS", "ADMIN_SISTEMAS"],
    href: "/app/propuestas",
    driveSubfolder: "05-Propuesta-Itza",
    color: "rose",
  },
  {
    codigo: "DIRECCION",
    nombre: "Dirección",
    descripcion: "Revisión, envío y fallo",
    roles: ["DIRECTOR", "ADMIN_SISTEMAS"],
    href: "/app/propuestas",
    driveSubfolder: "06-Envio-Nesim",
    color: "amber",
  },
  {
    codigo: "COMPRAS",
    nombre: "Compras",
    descripcion: "OC, proveedores, marcas y recotización post-ganada",
    roles: ["COMPRAS", "COMPRAS_VENTAS", "ADMIN_SISTEMAS"],
    href: "/app/compras",
    driveSubfolder: "07-Compra-Remision",
    color: "cyan",
  },
  {
    codigo: "ENTREGAS",
    nombre: "Entregas",
    descripcion: "Remisiones y calendario de entrega",
    roles: ["COMPRAS", "COMPRAS_VENTAS", "ADMIN_FINANZAS", "ADMIN_SISTEMAS"],
    href: "/app/entregas",
    driveSubfolder: "07-Compra-Remision",
    color: "mint",
  },
  {
    codigo: "CLIENTES",
    nombre: "Clientes",
    descripcion: "Directorio gobierno y privado",
    roles: ["LICITACIONES", "COMPRAS_VENTAS", "COMPRAS", "ADMIN_SISTEMAS"],
    href: "/app/clientes",
    driveSubfolder: "01-Bases",
    color: "cyan",
  },
  {
    codigo: "TESORERIA",
    nombre: "Bolsa · Tesorería",
    descripcion: "Bolsas, aportes y aprobaciones",
    roles: ["ADMIN_FINANZAS", "DIRECTOR", "ADMIN_SISTEMAS"],
    href: "/app/tesoreria",
    driveSubfolder: "09-Tesoreria",
    color: "rose",
  },
  {
    codigo: "DOCUMENTOS",
    nombre: "Documentos",
    descripcion: "Archivo del expediente y sync Drive",
    roles: [
      "LICITACIONES",
      "COMPRAS_VENTAS",
      "COMPRAS",
      "ADMIN_FINANZAS",
      "DIRECTOR",
      "ADMIN_SISTEMAS",
    ],
    href: "/app/documentos",
    driveSubfolder: "01-Bases",
    color: "mint",
  },
];

/** Subcarpetas fijas por expediente en Google Drive */
export const DRIVE_EXPEDIENTE_FOLDERS = [
  "01-Bases",
  "02-Licitaciones-Laura",
  "03-Cotizaciones-Proveedores",
  "04-Comparativo-Final",
  "05-Propuesta-Itza",
  "06-Envio-Nesim",
  "07-Compra-Remision",
  "08-Cobranza",
  "09-Tesoreria",
] as const;

export const DRIVE_FOLDER_BY_DOC_TYPE: Record<string, string> = {
  BASE_LICITACION: "01-Bases",
  LISTA_LIMPIA: "01-Bases",
  CONSTANCIA_EMPRESA: "02-Licitaciones-Laura",
  COTIZACION_PROVEEDOR: "03-Cotizaciones-Proveedores",
  COTIZACION_FINAL: "04-Comparativo-Final",
  PROPUESTA_ECONOMICA: "05-Propuesta-Itza",
  PROPUESTA_TECNICA: "05-Propuesta-Itza",
  FALLO: "06-Envio-Nesim",
  CONTRATO: "06-Envio-Nesim",
  OC: "07-Compra-Remision",
  REMISION: "07-Compra-Remision",
  FACTURA: "08-Cobranza",
  OTRO: "01-Bases",
};

export function areasForRoles(roles: string[]): AreaDef[] {
  const set = new Set(roles);
  return AREAS.filter((a) => a.roles.some((r) => set.has(r)));
}

export const ROLE_OPTIONS = [
  { codigo: "ADMIN_SISTEMAS", nombre: "Sistemas (superusuario)" },
  { codigo: "LICITACIONES", nombre: "Licitaciones (Laura)" },
  { codigo: "COMPRAS_VENTAS", nombre: "Comercial / Ventas" },
  { codigo: "COMPRAS", nombre: "Compras (OC / proveedores)" },
  { codigo: "ADMIN_FINANZAS", nombre: "Admin / Finanzas (Itza)" },
  { codigo: "DIRECTOR", nombre: "Dirección (Nesim)" },
] as const;
