-- YLIKA Ops — core schema
-- Multi-empresa · expediente · partidas · cotizaciones · remisiones · documentos

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────
create type public.sector_solicitud as enum ('GOBIERNO', 'PRIVADO');
create type public.ambito_solicitud as enum ('ADQUISICIONES', 'OBRA', 'PRIVADO');
create type public.estatus_expediente as enum (
  'BORRADOR',
  'REVISION_REQUISITOS',          -- Laura analiza
  'APTO',                         -- luz verde Laura
  'ORDEN_COTIZAR',                -- cotizar mercado
  'EN_COTIZACION',
  'COMPARATIVO',
  'COTIZACION_FINAL',             -- lista para Itza
  'PROPUESTA_ADMIN',              -- Itza arma económica/técnica
  'REVISION_DIRECTOR',            -- Nesim
  'ENVIADA',                      -- propuesta enviada
  'GANADA',
  'PERDIDA',
  'RECOTIZACION',                 -- post-ganada, mejores precios
  'COMPRA',
  'ENTREGA',
  'COBRANZA',
  'CERRADO',
  'CANCELADO'
);

create type public.tipo_documento as enum (
  'BASE_LICITACION',
  'LISTA_LIMPIA',
  'COTIZACION_PROVEEDOR',
  'COTIZACION_FINAL',
  'PROPUESTA_ECONOMICA',
  'PROPUESTA_TECNICA',
  'CONSTANCIA_EMPRESA',
  'FALLO',
  'CONTRATO',
  'OC',
  'REMISION',
  'FACTURA',
  'OTRO'
);

create type public.estado_documento_empresa as enum (
  'VIGENTE',
  'POR_VENCER',
  'VENCIDO',
  'NO_APLICA'
);

-- ── Empresas del grupo ───────────────────────────────────────────────
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  razon_social text not null,
  rfc text,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.empresas (codigo, razon_social, rfc) values
  ('MONE', 'Distribuidora de Materiales y Construcción Mone', null),
  ('DAKAM', 'Dakam Developers', null),
  ('NARAMO', 'Soluciones de Estacionamiento Naramo', null);

-- ── Perfiles (auth.users) ────────────────────────────────────────────
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  email text not null unique,
  avatar_url text,
  activo boolean not null default true,
  tema_ui text not null default 'obsidian',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Roles de sistema (editables en nombre/permisos; códigos estables)
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  descripcion text,
  es_admin boolean not null default false,
  permisos jsonb not null default '{}'::jsonb,
  activo boolean not null default true
);

insert into public.roles (codigo, nombre, descripcion, es_admin, permisos) values
  ('ADMIN_SISTEMAS', 'Sistemas / Developer', 'Administra roles, workflow y módulos', true,
    '{"all": true}'::jsonb),
  ('LICITACIONES', 'Licitaciones', 'Revisa bases, requisitos y aptitud', false,
    '{"licitaciones": true, "expedientes:read": true}'::jsonb),
  ('COMPRAS_VENTAS', 'Compras / Ventas', 'Cotiza, compara proveedores, recotiza', false,
    '{"comercial": true, "compras": true, "expedientes": true}'::jsonb),
  ('ADMIN_FINANZAS', 'Administración y Finanzas', 'Propuestas, remisiones, cobranza, bolsa', false,
    '{"tesoreria": true, "cobranza": true, "bolsa": true, "expedientes:read": true}'::jsonb),
  ('DIRECTOR', 'Director', 'Aprueba y envía propuestas', false,
    '{"expedientes:read": true, "aprobar_propuesta": true}'::jsonb),
  ('OBRA', 'Obra / Técnico', 'Responsable técnico en proyectos', false,
    '{"proyectos": true, "expedientes:read": true}'::jsonb);

-- Un usuario puede tener varios roles (ej. Miguel: COMPRAS_VENTAS + ADMIN_SISTEMAS)
create table public.usuario_roles (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  rol_id uuid not null references public.roles (id) on delete cascade,
  empresa_id uuid references public.empresas (id) on delete cascade, -- null = todas
  unique (usuario_id, rol_id, empresa_id)
);

-- Acceso a empresas
create table public.usuario_empresas (
  usuario_id uuid not null references public.perfiles (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  primary key (usuario_id, empresa_id)
);

-- ── Catálogo tipos de solicitud ──────────────────────────────────────
create table public.tipos_solicitud (
  id uuid primary key default gen_random_uuid(),
  sector public.sector_solicitud not null,
  ambito public.ambito_solicitud not null,
  codigo text not null unique,
  nombre text not null,
  activo boolean not null default true,
  orden int not null default 100
);

insert into public.tipos_solicitud (sector, ambito, codigo, nombre, orden) values
  ('GOBIERNO', 'ADQUISICIONES', 'LICITACION_PUBLICA', 'Licitación pública', 10),
  ('GOBIERNO', 'ADQUISICIONES', 'INVITACION_3', 'Invitación a cuando menos tres personas', 20),
  ('GOBIERNO', 'ADQUISICIONES', 'ADJUDICACION_DIRECTA', 'Adjudicación directa', 30),
  ('GOBIERNO', 'ADQUISICIONES', 'DIALOGO_COMPETITIVO', 'Diálogo competitivo', 40),
  ('GOBIERNO', 'ADQUISICIONES', 'ADJ_DIRECTA_NEGOCIACION', 'Adjudicación directa con estrategia de negociación', 50),
  ('GOBIERNO', 'ADQUISICIONES', 'ACUERDO_MARCO', 'Contrato específico por acuerdo marco', 60),
  ('GOBIERNO', 'ADQUISICIONES', 'TIENDA_DIGITAL', 'Órdenes de suministro / Tienda Digital', 70),
  ('GOBIERNO', 'OBRA', 'OBRA_LICITACION', 'Obra · Licitación pública', 80),
  ('GOBIERNO', 'OBRA', 'OBRA_INVITACION_3', 'Obra · Invitación a cuando menos tres', 90),
  ('GOBIERNO', 'OBRA', 'OBRA_ADJUDICACION', 'Obra · Adjudicación directa', 100),
  ('PRIVADO', 'PRIVADO', 'PROYECTO', 'Proyecto privado', 110),
  ('PRIVADO', 'PRIVADO', 'VENTA_DIRECTA', 'Venta directa', 120);

-- ── Clientes / proveedores ───────────────────────────────────────────
create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  tipo public.sector_solicitud not null default 'PRIVADO',
  razon_social text not null,
  rfc text,
  dependencia text,
  contacto_nombre text,
  contacto_email text,
  contacto_tel text,
  direccion text,
  notas text,
  created_at timestamptz not null default now()
);

create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  rfc text,
  alias_corto text, -- P1, P2 se asignan por expediente
  contacto_nombre text,
  contacto_email text,
  contacto_tel text,
  condiciones_pago text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Documentos de empresa (aptitud Laura) ────────────────────────────
create table public.documentos_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nombre text not null,              -- ej. Opinión de cumplimiento SAT
  categoria text not null default 'GENERAL',
  storage_path text,
  fecha_emision date,
  fecha_vencimiento date,
  estado public.estado_documento_empresa not null default 'VIGENTE',
  notas text,
  updated_by uuid references public.perfiles (id),
  updated_at timestamptz not null default now()
);

-- ── Solicitud → Expediente ───────────────────────────────────────────
create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id),
  sector public.sector_solicitud not null,
  tipo_solicitud_id uuid not null references public.tipos_solicitud (id),
  cliente_id uuid references public.clientes (id),
  titulo text not null,
  folio_externo text, -- CompraNet / referencia
  caracter text,      -- Nacional / Internacional
  monto_estimado numeric(18,2),
  moneda text not null default 'MXN',
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references public.perfiles (id),
  created_at timestamptz not null default now()
);

create table public.expedientes (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique, -- YLK-MONE-2026-00041
  solicitud_id uuid not null unique references public.solicitudes (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id),
  estatus public.estatus_expediente not null default 'BORRADOR',
  responsable_actual_id uuid references public.perfiles (id),
  apto_requisitos boolean,
  apto_notas text,              -- resultado análisis Laura / sistema
  markup_pct numeric(8,4) default 0, -- % sobreprecios cotización final (interno)
  criterio_seleccion text not null default 'PRECIO', -- PRECIO | ENTREGA | MIXTO
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bitacora (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes (id) on delete cascade,
  usuario_id uuid references public.perfiles (id),
  accion text not null,
  de_estatus public.estatus_expediente,
  a_estatus public.estatus_expediente,
  detalle jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ── Partidas (lista limpia) ──────────────────────────────────────────
create table public.partidas (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes (id) on delete cascade,
  numero int not null,
  descripcion text not null,
  cantidad numeric(18,4) not null default 1,
  unidad text not null default 'PZA',
  marca_solicitada text,
  especificacion text,
  notas text,
  unique (expediente_id, numero)
);

-- ── Cotizaciones proveedor ──────────────────────────────────────────
create table public.cotizaciones_proveedor (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes (id) on delete cascade,
  proveedor_id uuid not null references public.proveedores (id),
  alias_en_expediente text not null, -- P1, P2…
  fecha date not null default current_date,
  vigencia date,
  moneda text not null default 'MXN',
  incluye_iva boolean not null default true, -- precios con 16%
  tiempo_entrega_dias int,
  condiciones text,
  archivo_path text,
  parse_status text not null default 'PENDING', -- PENDING|PARSED|NEEDS_REVIEW|FAILED
  parse_meta jsonb not null default '{}'::jsonb,
  created_by uuid references public.perfiles (id),
  created_at timestamptz not null default now(),
  unique (expediente_id, alias_en_expediente)
);

create table public.cotizacion_partidas (
  id uuid primary key default gen_random_uuid(),
  cotizacion_id uuid not null references public.cotizaciones_proveedor (id) on delete cascade,
  partida_id uuid references public.partidas (id) on delete set null,
  descripcion_ofertada text,
  precio_unitario_con_iva numeric(18,4), -- siempre con IVA 16%
  precio_unitario_sin_iva numeric(18,4),
  tiempo_entrega_dias int,
  pct_contenido_nacional numeric(6,2),
  pais_origen text,
  marca_ofertada text,
  match_confidence numeric(5,4), -- 0-1 autodetección
  match_manual boolean not null default false,
  seleccionado boolean not null default false,
  notas text
);

-- Snapshot cotización final (lo que se imprime; sin % markup visible)
create table public.cotizaciones_finales (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes (id) on delete cascade,
  version int not null default 1,
  markup_pct_aplicado numeric(8,4) not null default 0,
  criterio text not null default 'PRECIO',
  generado_por uuid references public.perfiles (id),
  archivo_path text,
  payload jsonb not null default '{}'::jsonb, -- filas finales P1/P2 refs
  created_at timestamptz not null default now(),
  unique (expediente_id, version)
);

-- ── Remisiones / entregas ────────────────────────────────────────────
create table public.remisiones (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes (id) on delete cascade,
  empresa_id uuid not null references public.empresas (id),
  folio text not null unique,
  destinatario text not null,
  direccion_entrega text,
  fecha_entrega date,
  estatus text not null default 'BORRADOR', -- BORRADOR|EMITIDA|ENTREGADA|CANCELADA
  notas text,
  creado_por uuid references public.perfiles (id),
  recibido_por_finanzas_id uuid references public.perfiles (id), -- Itza
  created_at timestamptz not null default now()
);

create table public.remision_partidas (
  id uuid primary key default gen_random_uuid(),
  remision_id uuid not null references public.remisiones (id) on delete cascade,
  partida_id uuid references public.partidas (id),
  descripcion text not null,
  cantidad numeric(18,4) not null,
  unidad text not null default 'PZA'
);

-- ── Documentos genéricos ─────────────────────────────────────────────
create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid references public.expedientes (id) on delete cascade,
  empresa_id uuid references public.empresas (id),
  tipo public.tipo_documento not null default 'OTRO',
  nombre text not null,
  storage_path text not null,
  mime_type text,
  uploaded_by uuid references public.perfiles (id),
  created_at timestamptz not null default now()
);

-- Alias de columnas aprendidos (sin RAG / sin quemar tokens)
create table public.parse_column_aliases (
  id uuid primary key default gen_random_uuid(),
  campo text not null, -- descripcion|cantidad|unidad|precio|marca|...
  alias text not null,
  peso int not null default 1,
  unique (campo, alias)
);

insert into public.parse_column_aliases (campo, alias) values
  ('descripcion', 'descripcion'), ('descripcion', 'descripción'),
  ('descripcion', 'concepto'), ('descripcion', 'producto'),
  ('descripcion', 'detalle'), ('cantidad', 'cantidad'),
  ('cantidad', 'cant'), ('cantidad', 'qty'), ('unidad', 'unidad'),
  ('unidad', 'u.m.'), ('unidad', 'um'), ('precio', 'precio'),
  ('precio', 'p.unitario'), ('precio', 'precio unitario'),
  ('precio', 'importe unitario'), ('marca', 'marca'),
  ('entrega', 'entrega'), ('entrega', 'tiempo de entrega');

-- Helpers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger expedientes_updated
  before update on public.expedientes
  for each row execute function public.set_updated_at();

-- Código de expediente
create or replace function public.generar_codigo_expediente(p_empresa_id uuid)
returns text language plpgsql as $$
declare
  v_codigo text;
  v_year int := extract(year from now())::int;
  v_seq int;
begin
  select codigo into v_codigo from public.empresas where id = p_empresa_id;
  select count(*) + 1 into v_seq
  from public.expedientes e
  where e.empresa_id = p_empresa_id
    and extract(year from e.created_at) = v_year;
  return format('YLK-%s-%s-%s', v_codigo, v_year, lpad(v_seq::text, 5, '0'));
end;
$$;
