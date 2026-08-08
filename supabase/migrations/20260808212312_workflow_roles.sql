-- Workflow editable: quién recibe cada transición (solo ADMIN_SISTEMAS modifica)

create table public.workflow_etapas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  estatus public.estatus_expediente not null,
  orden int not null,
  descripcion text,
  activo boolean not null default true
);

insert into public.workflow_etapas (codigo, nombre, estatus, orden, descripcion) values
  ('REVISION', 'Revisión de requisitos', 'REVISION_REQUISITOS', 10,
   'Laura revisa bases y documentos de empresa (caducidad / aptitud)'),
  ('APTO', 'Luz verde', 'APTO', 20, 'Se confirma que somos aptos'),
  ('ORDEN_COTIZAR', 'Orden de cotizar', 'ORDEN_COTIZAR', 30,
   'Laura indica a Compras/Ventas cotizar (estudio de mercado)'),
  ('COTIZACION', 'En cotización', 'EN_COTIZACION', 40, 'Carga y parseo de cotizaciones proveedor'),
  ('COMPARATIVO', 'Comparativo', 'COMPARATIVO', 50, 'Selección iluminada de mejores partidas'),
  ('COT_FINAL', 'Cotización final', 'COTIZACION_FINAL', 60, 'Documento con refs P1/P2 y markup interno'),
  ('PROPUESTA', 'Propuesta Admin/Finanzas', 'PROPUESTA_ADMIN', 70,
   'Itza prepara propuesta económica y técnica'),
  ('DIRECTOR', 'Revisión Director', 'REVISION_DIRECTOR', 80, 'Nesim revisa y envía'),
  ('ENVIADA', 'Propuesta enviada', 'ENVIADA', 90, 'En espera de fallo'),
  ('GANADA', 'Ganada → recotización', 'RECOTIZACION', 100,
   'Ventas recotiza a mejor precio post-adjudicación'),
  ('COMPRA_ENTREGA', 'Compra y remisión', 'ENTREGA', 110, 'Remisión → Itza / cobranza'),
  ('COBRANZA', 'Cobranza', 'COBRANZA', 120, 'Seguimiento de pagos');

-- Asignación: qué rol (o usuario fijo) atiende cada etapa
create table public.workflow_asignaciones (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references public.workflow_etapas (id) on delete cascade,
  rol_id uuid references public.roles (id),
  usuario_fijo_id uuid references public.perfiles (id),
  empresa_id uuid references public.empresas (id), -- null = todas
  updated_by uuid references public.perfiles (id),
  updated_at timestamptz not null default now(),
  check (rol_id is not null or usuario_fijo_id is not null)
);

-- Defaults por código de rol
insert into public.workflow_asignaciones (etapa_id, rol_id)
select e.id, r.id
from public.workflow_etapas e
join public.roles r on (
  (e.codigo in ('REVISION','APTO','ORDEN_COTIZAR') and r.codigo = 'LICITACIONES')
  or (e.codigo in ('COTIZACION','COMPARATIVO','COT_FINAL','GANADA') and r.codigo = 'COMPRAS_VENTAS')
  or (e.codigo in ('PROPUESTA','COMPRA_ENTREGA','COBRANZA') and r.codigo = 'ADMIN_FINANZAS')
  or (e.codigo in ('DIRECTOR','ENVIADA') and r.codigo = 'DIRECTOR')
);

-- Transiciones permitidas
create table public.workflow_transiciones (
  id uuid primary key default gen_random_uuid(),
  desde public.estatus_expediente not null,
  hacia public.estatus_expediente not null,
  accion_ui text not null,
  requiere_rol text[], -- codigos rol
  unique (desde, hacia)
);

insert into public.workflow_transiciones (desde, hacia, accion_ui, requiere_rol) values
  ('BORRADOR', 'REVISION_REQUISITOS', 'Enviar a revisión', array['LICITACIONES','ADMIN_SISTEMAS','COMPRAS_VENTAS']),
  ('REVISION_REQUISITOS', 'APTO', 'Marcar apto (luz verde)', array['LICITACIONES','ADMIN_SISTEMAS']),
  ('REVISION_REQUISITOS', 'CANCELADO', 'No participamos', array['LICITACIONES','ADMIN_SISTEMAS']),
  ('APTO', 'ORDEN_COTIZAR', 'Ordenar cotizar', array['LICITACIONES','ADMIN_SISTEMAS']),
  ('ORDEN_COTIZAR', 'EN_COTIZACION', 'Iniciar cotización', array['COMPRAS_VENTAS','ADMIN_SISTEMAS']),
  ('EN_COTIZACION', 'COMPARATIVO', 'Abrir comparativo', array['COMPRAS_VENTAS','ADMIN_SISTEMAS']),
  ('COMPARATIVO', 'COTIZACION_FINAL', 'Generar cotización final', array['COMPRAS_VENTAS','ADMIN_SISTEMAS']),
  ('COTIZACION_FINAL', 'PROPUESTA_ADMIN', 'Pasar a Admin/Finanzas', array['LICITACIONES','COMPRAS_VENTAS','ADMIN_SISTEMAS']),
  ('PROPUESTA_ADMIN', 'REVISION_DIRECTOR', 'Enviar a Director', array['ADMIN_FINANZAS','ADMIN_SISTEMAS']),
  ('REVISION_DIRECTOR', 'ENVIADA', 'Marcar enviada', array['DIRECTOR','ADMIN_SISTEMAS']),
  ('ENVIADA', 'GANADA', 'Ganamos', array['LICITACIONES','DIRECTOR','ADMIN_SISTEMAS']),
  ('ENVIADA', 'PERDIDA', 'Perdimos', array['LICITACIONES','DIRECTOR','ADMIN_SISTEMAS']),
  ('GANADA', 'RECOTIZACION', 'Recotizar mejores precios', array['COMPRAS_VENTAS','ADMIN_SISTEMAS']),
  ('RECOTIZACION', 'COMPRA', 'Pasar a compra', array['COMPRAS_VENTAS','ADMIN_SISTEMAS']),
  ('COMPRA', 'ENTREGA', 'Generar remisión', array['COMPRAS_VENTAS','ADMIN_SISTEMAS']),
  ('ENTREGA', 'COBRANZA', 'Pasar a cobranza', array['ADMIN_FINANZAS','ADMIN_SISTEMAS']),
  ('COBRANZA', 'CERRADO', 'Cerrar expediente', array['ADMIN_FINANZAS','ADMIN_SISTEMAS']);

-- Requisitos detectados vs documentos empresa (análisis Laura)
create table public.requisitos_expediente (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes (id) on delete cascade,
  descripcion text not null,
  obligatorio boolean not null default true,
  documento_empresa_id uuid references public.documentos_empresa (id),
  cumple boolean,
  motivo text, -- vencido / faltante / ok
  fuente text, -- MANUAL | PARSER
  created_at timestamptz not null default now()
);

-- Módulo bolsa (integración): enlace configurable por admin
create table public.modulos_externos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique, -- BOLSA
  nombre text not null,
  url text,
  embed boolean not null default true,
  visible_en_menu boolean not null default true,
  rol_minimo text[] not null default array['ADMIN_FINANZAS','ADMIN_SISTEMAS'],
  activo boolean not null default true,
  updated_by uuid references public.perfiles (id),
  updated_at timestamptz not null default now()
);

insert into public.modulos_externos (codigo, nombre, url, embed) values
  ('BOLSA', 'Administración de Bolsa', null, true);

-- Vista rápida de aptitud por empresa
create or replace view public.v_aptitud_empresa
with (security_invoker = true)
as
select
  d.empresa_id,
  d.id as documento_id,
  d.nombre,
  d.fecha_vencimiento,
  case
    when d.fecha_vencimiento is null then 'NO_APLICA'::public.estado_documento_empresa
    when d.fecha_vencimiento < current_date then 'VENCIDO'::public.estado_documento_empresa
    when d.fecha_vencimiento < current_date + 30 then 'POR_VENCER'::public.estado_documento_empresa
    else 'VIGENTE'::public.estado_documento_empresa
  end as estado_calc
from public.documentos_empresa d;
