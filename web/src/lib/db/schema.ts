import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Auth.js tables ───────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  activo: boolean("activo").notNull().default(true),
  temaUi: text("tema_ui").notNull().default("obsidian"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ── Enums ────────────────────────────────────────────────────────────
export const sectorEnum = pgEnum("sector_solicitud", ["GOBIERNO", "PRIVADO"]);
export const ambitoEnum = pgEnum("ambito_solicitud", [
  "ADQUISICIONES",
  "OBRA",
  "PRIVADO",
]);
export const estatusExpedienteEnum = pgEnum("estatus_expediente", [
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
]);
export const tipoDocumentoEnum = pgEnum("tipo_documento", [
  "BASE_LICITACION",
  "LISTA_LIMPIA",
  "COTIZACION_PROVEEDOR",
  "COTIZACION_FINAL",
  "PROPUESTA_ECONOMICA",
  "PROPUESTA_TECNICA",
  "CONSTANCIA_EMPRESA",
  "FALLO",
  "CONTRATO",
  "OC",
  "REMISION",
  "FACTURA",
  "OTRO",
]);
export const estadoDocEmpresaEnum = pgEnum("estado_documento_empresa", [
  "VIGENTE",
  "POR_VENCER",
  "VENCIDO",
  "NO_APLICA",
]);

// ── Core business ────────────────────────────────────────────────────
export const empresas = pgTable("empresas", {
  id: uuid("id").defaultRandom().primaryKey(),
  codigo: varchar("codigo", { length: 16 }).notNull().unique(),
  razonSocial: text("razon_social").notNull(),
  rfc: text("rfc"),
  activa: boolean("activa").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  codigo: varchar("codigo", { length: 64 }).notNull().unique(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  esAdmin: boolean("es_admin").notNull().default(false),
  permisos: jsonb("permisos").notNull().default({}),
  activo: boolean("activo").notNull().default(true),
});

export const usuarioRoles = pgTable(
  "usuario_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    rolId: uuid("rol_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    empresaId: uuid("empresa_id").references(() => empresas.id, {
      onDelete: "cascade",
    }),
  },
  (t) => [uniqueIndex("usuario_roles_unique").on(t.userId, t.rolId, t.empresaId)],
);

export const usuarioEmpresas = pgTable(
  "usuario_empresas",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    empresaId: uuid("empresa_id")
      .notNull()
      .references(() => empresas.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.empresaId] })],
);

export const tiposSolicitud = pgTable("tipos_solicitud", {
  id: uuid("id").defaultRandom().primaryKey(),
  sector: sectorEnum("sector").notNull(),
  ambito: ambitoEnum("ambito").notNull(),
  codigo: varchar("codigo", { length: 64 }).notNull().unique(),
  nombre: text("nombre").notNull(),
  activo: boolean("activo").notNull().default(true),
  orden: integer("orden").notNull().default(100),
});

export const clientes = pgTable("clientes", {
  id: uuid("id").defaultRandom().primaryKey(),
  tipo: sectorEnum("tipo").notNull().default("PRIVADO"),
  razonSocial: text("razon_social").notNull(),
  rfc: text("rfc"),
  dependencia: text("dependencia"),
  contactoNombre: text("contacto_nombre"),
  contactoEmail: text("contacto_email"),
  contactoTel: text("contacto_tel"),
  direccion: text("direccion"),
  notas: text("notas"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const tipoProveedorEnum = pgEnum("tipo_proveedor", [
  "MATERIALES",
  "EQUIPOS",
  "SERVICIOS",
  "OBRA",
  "TRANSPORTE",
  "MIXTO",
]);

export const proveedores = pgTable("proveedores", {
  id: uuid("id").defaultRandom().primaryKey(),
  razonSocial: text("razon_social").notNull(),
  rfc: text("rfc"),
  aliasCorto: text("alias_corto"),
  contactoNombre: text("contacto_nombre"),
  contactoEmail: text("contacto_email"),
  contactoTel: text("contacto_tel"),
  condicionesPago: text("condiciones_pago"),
  tipo: tipoProveedorEnum("tipo").notNull().default("MATERIALES"),
  especialidades: text("especialidades").array().notNull().default([]),
  zonaCobertura: text("zona_cobertura"),
  preferido: boolean("preferido").notNull().default(false),
  calificacion: integer("calificacion").notNull().default(3),
  notas: text("notas"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const marcas = pgTable("marcas", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull().unique(),
  categoria: text("categoria").notNull().default("GENERAL"),
  activa: boolean("activa").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const proveedorMarcas = pgTable(
  "proveedor_marcas",
  {
    proveedorId: uuid("proveedor_id")
      .notNull()
      .references(() => proveedores.id, { onDelete: "cascade" }),
    marcaId: uuid("marca_id")
      .notNull()
      .references(() => marcas.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.proveedorId, t.marcaId] })],
);

export const documentosEmpresa = pgTable("documentos_empresa", {
  id: uuid("id").defaultRandom().primaryKey(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(),
  categoria: text("categoria").notNull().default("GENERAL"),
  storagePath: text("storage_path"),
  fechaEmision: timestamp("fecha_emision", { mode: "date" }),
  fechaVencimiento: timestamp("fecha_vencimiento", { mode: "date" }),
  estado: estadoDocEmpresaEnum("estado").notNull().default("VIGENTE"),
  notas: text("notas"),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const solicitudes = pgTable("solicitudes", {
  id: uuid("id").defaultRandom().primaryKey(),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id),
  sector: sectorEnum("sector").notNull(),
  tipoSolicitudId: uuid("tipo_solicitud_id")
    .notNull()
    .references(() => tiposSolicitud.id),
  clienteId: uuid("cliente_id").references(() => clientes.id),
  titulo: text("titulo").notNull(),
  folioExterno: text("folio_externo"),
  caracter: text("caracter"),
  montoEstimado: numeric("monto_estimado", { precision: 18, scale: 2 }),
  moneda: text("moneda").notNull().default("MXN"),
  meta: jsonb("meta").notNull().default({}),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const expedientes = pgTable("expedientes", {
  id: uuid("id").defaultRandom().primaryKey(),
  codigo: text("codigo").notNull().unique(),
  solicitudId: uuid("solicitud_id")
    .notNull()
    .unique()
    .references(() => solicitudes.id, { onDelete: "cascade" }),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id),
  estatus: estatusExpedienteEnum("estatus").notNull().default("BORRADOR"),
  responsableActualId: uuid("responsable_actual_id").references(() => users.id),
  aptoRequisitos: boolean("apto_requisitos"),
  aptoNotas: text("apto_notas"),
  markupPct: numeric("markup_pct", { precision: 8, scale: 4 }).default("0"),
  criterioSeleccion: text("criterio_seleccion").notNull().default("PRECIO"),
  /** Google Drive folder id for this expediente root */
  driveFolderId: text("drive_folder_id"),
  driveWebViewLink: text("drive_web_view_link"),
  /** Plazos operativos (tiempo y forma) */
  fechaJuntaAclaraciones: timestamp("fecha_junta_aclaraciones", { mode: "date" }),
  fechaApertura: timestamp("fecha_apertura", { mode: "date" }),
  fechaFallo: timestamp("fecha_fallo", { mode: "date" }),
  vigenciaOfertaHasta: timestamp("vigencia_oferta_hasta", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const bitacora = pgTable("bitacora", {
  id: uuid("id").defaultRandom().primaryKey(),
  expedienteId: uuid("expediente_id")
    .notNull()
    .references(() => expedientes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  accion: text("accion").notNull(),
  deEstatus: estatusExpedienteEnum("de_estatus"),
  aEstatus: estatusExpedienteEnum("a_estatus"),
  detalle: jsonb("detalle").notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const partidas = pgTable(
  "partidas",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expedienteId: uuid("expediente_id")
      .notNull()
      .references(() => expedientes.id, { onDelete: "cascade" }),
    numero: integer("numero").notNull(),
    descripcion: text("descripcion").notNull(),
    cantidad: numeric("cantidad", { precision: 18, scale: 4 }).notNull().default("1"),
    unidad: text("unidad").notNull().default("PZA"),
    marcaSolicitada: text("marca_solicitada"),
    especificacion: text("especificacion"),
    notas: text("notas"),
  },
  (t) => [uniqueIndex("partidas_exp_num").on(t.expedienteId, t.numero)],
);

/** Relación partida ↔ proveedor/marca dentro de un expediente */
export const partidaRelaciones = pgTable(
  "partida_relaciones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expedienteId: uuid("expediente_id")
      .notNull()
      .references(() => expedientes.id, { onDelete: "cascade" }),
    partidaId: uuid("partida_id")
      .notNull()
      .references(() => partidas.id, { onDelete: "cascade" }),
    proveedorId: uuid("proveedor_id").references(() => proveedores.id, {
      onDelete: "set null",
    }),
    marcaId: uuid("marca_id").references(() => marcas.id, {
      onDelete: "set null",
    }),
    marcaTexto: text("marca_texto"),
    origen: text("origen").notNull().default("MANUAL"), // MANUAL | COMPARATIVO | IMPORT
    notas: text("notas"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("partida_rel_unique").on(t.expedienteId, t.partidaId)],
);

export const cotizacionesProveedor = pgTable(
  "cotizaciones_proveedor",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expedienteId: uuid("expediente_id")
      .notNull()
      .references(() => expedientes.id, { onDelete: "cascade" }),
    proveedorId: uuid("proveedor_id")
      .notNull()
      .references(() => proveedores.id),
    aliasEnExpediente: text("alias_en_expediente").notNull(),
    fecha: timestamp("fecha", { mode: "date" }).notNull().defaultNow(),
    vigencia: timestamp("vigencia", { mode: "date" }),
    moneda: text("moneda").notNull().default("MXN"),
    incluyeIva: boolean("incluye_iva").notNull().default(true),
    tiempoEntregaDias: integer("tiempo_entrega_dias"),
    condiciones: text("condiciones"),
    archivoPath: text("archivo_path"),
    parseStatus: text("parse_status").notNull().default("PENDING"),
    parseMeta: jsonb("parse_meta").notNull().default({}),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("cot_alias_exp").on(t.expedienteId, t.aliasEnExpediente),
  ],
);

export const cotizacionPartidas = pgTable("cotizacion_partidas", {
  id: uuid("id").defaultRandom().primaryKey(),
  cotizacionId: uuid("cotizacion_id")
    .notNull()
    .references(() => cotizacionesProveedor.id, { onDelete: "cascade" }),
  partidaId: uuid("partida_id").references(() => partidas.id, {
    onDelete: "set null",
  }),
  descripcionOfertada: text("descripcion_ofertada"),
  precioUnitarioConIva: numeric("precio_unitario_con_iva", {
    precision: 18,
    scale: 4,
  }),
  precioUnitarioSinIva: numeric("precio_unitario_sin_iva", {
    precision: 18,
    scale: 4,
  }),
  tiempoEntregaDias: integer("tiempo_entrega_dias"),
  pctContenidoNacional: numeric("pct_contenido_nacional", {
    precision: 6,
    scale: 2,
  }),
  paisOrigen: text("pais_origen"),
  marcaOfertada: text("marca_ofertada"),
  matchConfidence: numeric("match_confidence", { precision: 5, scale: 4 }),
  matchManual: boolean("match_manual").notNull().default(false),
  seleccionado: boolean("seleccionado").notNull().default(false),
  notas: text("notas"),
});

export const cotizacionesFinales = pgTable(
  "cotizaciones_finales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expedienteId: uuid("expediente_id")
      .notNull()
      .references(() => expedientes.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    markupPctAplicado: numeric("markup_pct_aplicado", {
      precision: 8,
      scale: 4,
    })
      .notNull()
      .default("0"),
    criterio: text("criterio").notNull().default("PRECIO"),
    generadoPor: uuid("generado_por").references(() => users.id),
    archivoPath: text("archivo_path"),
    payload: jsonb("payload").notNull().default({}),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("cot_final_ver").on(t.expedienteId, t.version)],
);

export const remisiones = pgTable("remisiones", {
  id: uuid("id").defaultRandom().primaryKey(),
  expedienteId: uuid("expediente_id")
    .notNull()
    .references(() => expedientes.id, { onDelete: "cascade" }),
  empresaId: uuid("empresa_id")
    .notNull()
    .references(() => empresas.id),
  folio: text("folio").notNull().unique(),
  destinatario: text("destinatario").notNull(),
  direccionEntrega: text("direccion_entrega"),
  fechaEntrega: timestamp("fecha_entrega", { mode: "date" }),
  fechaProgramada: timestamp("fecha_programada", { mode: "date" }),
  responsableEntrega: text("responsable_entrega"),
  estatus: text("estatus").notNull().default("BORRADOR"),
  notas: text("notas"),
  creadoPor: uuid("creado_por").references(() => users.id),
  recibidoPorFinanzasId: uuid("recibido_por_finanzas_id").references(
    () => users.id,
  ),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const remisionPartidas = pgTable("remision_partidas", {
  id: uuid("id").defaultRandom().primaryKey(),
  remisionId: uuid("remision_id")
    .notNull()
    .references(() => remisiones.id, { onDelete: "cascade" }),
  partidaId: uuid("partida_id").references(() => partidas.id),
  descripcion: text("descripcion").notNull(),
  cantidad: numeric("cantidad", { precision: 18, scale: 4 }).notNull(),
  unidad: text("unidad").notNull().default("PZA"),
});

export const documentos = pgTable("documentos", {
  id: uuid("id").defaultRandom().primaryKey(),
  expedienteId: uuid("expediente_id").references(() => expedientes.id, {
    onDelete: "cascade",
  }),
  empresaId: uuid("empresa_id").references(() => empresas.id),
  tipo: tipoDocumentoEnum("tipo").notNull().default("OTRO"),
  nombre: text("nombre").notNull(),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type"),
  driveFileId: text("drive_file_id"),
  driveWebViewLink: text("drive_web_view_link"),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const parseColumnAliases = pgTable(
  "parse_column_aliases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    campo: text("campo").notNull(),
    alias: text("alias").notNull(),
    peso: integer("peso").notNull().default(1),
  },
  (t) => [uniqueIndex("alias_campo").on(t.campo, t.alias)],
);

export const workflowEtapas = pgTable("workflow_etapas", {
  id: uuid("id").defaultRandom().primaryKey(),
  codigo: varchar("codigo", { length: 64 }).notNull().unique(),
  nombre: text("nombre").notNull(),
  estatus: estatusExpedienteEnum("estatus").notNull(),
  orden: integer("orden").notNull(),
  descripcion: text("descripcion"),
  activo: boolean("activo").notNull().default(true),
});

export const workflowAsignaciones = pgTable("workflow_asignaciones", {
  id: uuid("id").defaultRandom().primaryKey(),
  etapaId: uuid("etapa_id")
    .notNull()
    .references(() => workflowEtapas.id, { onDelete: "cascade" }),
  rolId: uuid("rol_id").references(() => roles.id),
  usuarioFijoId: uuid("usuario_fijo_id").references(() => users.id),
  empresaId: uuid("empresa_id").references(() => empresas.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const workflowTransiciones = pgTable(
  "workflow_transiciones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    desde: estatusExpedienteEnum("desde").notNull(),
    hacia: estatusExpedienteEnum("hacia").notNull(),
    accionUi: text("accion_ui").notNull(),
    requiereRol: text("requiere_rol").array(),
  },
  (t) => [uniqueIndex("wf_trans_unique").on(t.desde, t.hacia)],
);

export const requisitosExpediente = pgTable("requisitos_expediente", {
  id: uuid("id").defaultRandom().primaryKey(),
  expedienteId: uuid("expediente_id")
    .notNull()
    .references(() => expedientes.id, { onDelete: "cascade" }),
  descripcion: text("descripcion").notNull(),
  obligatorio: boolean("obligatorio").notNull().default(true),
  documentoEmpresaId: uuid("documento_empresa_id").references(
    () => documentosEmpresa.id,
  ),
  cumple: boolean("cumple"),
  motivo: text("motivo"),
  fuente: text("fuente"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const modulosExternos = pgTable("modulos_externos", {
  id: uuid("id").defaultRandom().primaryKey(),
  codigo: varchar("codigo", { length: 64 }).notNull().unique(),
  nombre: text("nombre").notNull(),
  url: text("url"),
  embed: boolean("embed").notNull().default(true),
  visibleEnMenu: boolean("visible_en_menu").notNull().default(true),
  rolMinimo: text("rol_minimo").array().notNull().default(["ADMIN_FINANZAS"]),
  activo: boolean("activo").notNull().default(true),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ── Bolsa (réplica nativa del sistema Administración de Bolsa) ────────
export const tipoMovimientoBolsaEnum = pgEnum("tipo_movimiento_bolsa", [
  "saldo_apertura",
  "ingreso",
  "gasto",
  "transferencia_interna",
  "aporte_enviado",
  "aporte_recibido",
]);

export const naturalezaAporteEnum = pgEnum("naturaleza_aporte", [
  "prestamo",
  "pago_deuda",
  "reembolso",
  "cooperacion",
]);

export const estadoMovimientoBolsaEnum = pgEnum("estado_movimiento_bolsa", [
  "pendiente_aprobacion",
  "activo",
  "rechazado",
  "anulado",
]);

export const bolsas = pgTable("bolsas", {
  id: uuid("id").defaultRandom().primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  color: text("color").notNull().default("#eab308"),
  icono: text("icono").default("wallet"),
  moneda: text("moneda").notNull().default("MXN"),
  esGeneral: boolean("es_general").notNull().default(false),
  parentId: uuid("parent_id"),
  assignedByAdminId: uuid("assigned_by_admin_id").references(() => users.id),
  archivada: boolean("archivada").notNull().default(false),
  archivadaAt: timestamp("archivada_at", { mode: "date" }),
  permiteSaldoNegativo: boolean("permite_saldo_negativo").notNull().default(false),
  metaHabilitada: boolean("meta_habilitada").notNull().default(false),
  metaMonto: numeric("meta_monto", { precision: 14, scale: 2 }),
  metaFecha: timestamp("meta_fecha", { mode: "date" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

export const bolsaMiembros = pgTable(
  "bolsa_miembros",
  {
    bolsaId: uuid("bolsa_id")
      .notNull()
      .references(() => bolsas.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addedBy: uuid("added_by").references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.bolsaId, t.userId] })],
);

export const bolsaCategorias = pgTable(
  "bolsa_categorias",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nombre: text("nombre").notNull(),
    tipo: text("tipo").notNull().default("ambos"),
    color: text("color").notNull().default("#64748b"),
    icono: text("icono"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("bolsa_cat_user_nombre").on(t.userId, t.nombre, t.tipo)],
);

export const bolsaMovimientos = pgTable("bolsa_movimientos", {
  id: uuid("id").defaultRandom().primaryKey(),
  bolsaId: uuid("bolsa_id")
    .notNull()
    .references(() => bolsas.id, { onDelete: "cascade" }),
  tipo: tipoMovimientoBolsaEnum("tipo").notNull(),
  monto: numeric("monto", { precision: 14, scale: 2 }).notNull(),
  moneda: text("moneda").notNull().default("MXN"),
  categoriaId: uuid("categoria_id").references(() => bolsaCategorias.id, {
    onDelete: "set null",
  }),
  descripcion: text("descripcion"),
  fechaSolicitud: timestamp("fecha_solicitud", { mode: "date" })
    .notNull()
    .defaultNow(),
  fechaEjecucion: timestamp("fecha_ejecucion", { mode: "date" }),
  estado: estadoMovimientoBolsaEnum("estado")
    .notNull()
    .default("activo"),
  autorId: uuid("autor_id")
    .notNull()
    .references(() => users.id),
  aprobadoPor: uuid("aprobado_por").references(() => users.id),
  aprobadoAt: timestamp("aprobado_at", { mode: "date" }),
  motivoRechazo: text("motivo_rechazo"),
  anuladoAt: timestamp("anulado_at", { mode: "date" }),
  anuladoPor: uuid("anulado_por").references(() => users.id),
  motivoAnulacion: text("motivo_anulacion"),
  naturalezaAporte: naturalezaAporteEnum("naturaleza_aporte"),
  plazoDias: integer("plazo_dias"),
  fechaVencimiento: timestamp("fecha_vencimiento", { mode: "date" }),
  prestamoId: uuid("prestamo_id"),
  contraparteBolsaId: uuid("contraparte_bolsa_id").references(() => bolsas.id),
  contraparteUserId: uuid("contraparte_user_id").references(() => users.id),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ── Bot personal + solicitudes de cambio ─────────────────────────────
export const estadoRecordatorioEnum = pgEnum("estado_recordatorio", [
  "PENDIENTE",
  "HECHO",
  "CANCELADO",
]);

export const botRecordatorios = pgTable("bot_recordatorios", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  cuando: timestamp("cuando", { mode: "date" }).notNull(),
  estado: estadoRecordatorioEnum("estado").notNull().default("PENDIENTE"),
  meta: jsonb("meta").notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const botMensajes = pgTable("bot_mensajes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rol: text("rol").notNull(), // user | bot
  contenido: text("contenido").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const tipoCambioEnum = pgEnum("tipo_cambio_solicitud", [
  "CAMBIO_TITULO",
  "AGREGAR_PARTIDA",
  "EDITAR_PARTIDA",
  "ELIMINAR_PARTIDA",
  "CAMBIO_CLIENTE",
  "OTRO",
]);

export const estadoCambioEnum = pgEnum("estado_cambio_solicitud", [
  "PENDIENTE",
  "APROBADA",
  "RECHAZADA",
]);

export const solicitudesCambio = pgTable("solicitudes_cambio", {
  id: uuid("id").defaultRandom().primaryKey(),
  expedienteId: uuid("expediente_id")
    .notNull()
    .references(() => expedientes.id, { onDelete: "cascade" }),
  tipo: tipoCambioEnum("tipo").notNull(),
  payload: jsonb("payload").notNull().default({}),
  motivo: text("motivo"),
  estado: estadoCambioEnum("estado").notNull().default("PENDIENTE"),
  solicitadoPor: uuid("solicitado_por")
    .notNull()
    .references(() => users.id),
  revisadoPor: uuid("revisado_por").references(() => users.id),
  revisadoAt: timestamp("revisado_at", { mode: "date" }),
  notaRevision: text("nota_revision"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/** Checklist operativo por expediente (recotización, factura, etc.) */
export const estadoTareaEnum = pgEnum("estado_tarea_expediente", [
  "PENDIENTE",
  "HECHO",
  "CANCELADO",
]);

export const expedienteTareas = pgTable("expediente_tareas", {
  id: uuid("id").defaultRandom().primaryKey(),
  expedienteId: uuid("expediente_id")
    .notNull()
    .references(() => expedientes.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(), // RECOTIZAR_PROVEEDOR | FACTURAR | ENTREGA | OTRO
  titulo: text("titulo").notNull(),
  estado: estadoTareaEnum("estado").notNull().default("PENDIENTE"),
  orden: integer("orden").notNull().default(100),
  meta: jsonb("meta").notNull().default({}),
  asignadoA: uuid("asignado_a").references(() => users.id),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(usuarioRoles),
  empresas: many(usuarioEmpresas),
}));
