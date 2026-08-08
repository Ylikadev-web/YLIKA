-- RLS + helpers de autorización (NO usar user_metadata)

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuario_roles ur
    join public.roles r on r.id = ur.rol_id
    where ur.usuario_id = auth.uid()
      and r.es_admin = true
      and r.activo = true
  );
$$;

create or replace function public.has_rol(p_codigo text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1
    from public.usuario_roles ur
    join public.roles r on r.id = ur.rol_id
    where ur.usuario_id = auth.uid()
      and r.codigo = p_codigo
      and r.activo = true
  );
$$;

create or replace function public.puede_empresa(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.usuario_empresas ue
    where ue.usuario_id = auth.uid() and ue.empresa_id = p_empresa_id
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.empresas enable row level security;
alter table public.perfiles enable row level security;
alter table public.roles enable row level security;
alter table public.usuario_roles enable row level security;
alter table public.usuario_empresas enable row level security;
alter table public.tipos_solicitud enable row level security;
alter table public.clientes enable row level security;
alter table public.proveedores enable row level security;
alter table public.documentos_empresa enable row level security;
alter table public.solicitudes enable row level security;
alter table public.expedientes enable row level security;
alter table public.bitacora enable row level security;
alter table public.partidas enable row level security;
alter table public.cotizaciones_proveedor enable row level security;
alter table public.cotizacion_partidas enable row level security;
alter table public.cotizaciones_finales enable row level security;
alter table public.remisiones enable row level security;
alter table public.remision_partidas enable row level security;
alter table public.documentos enable row level security;
alter table public.parse_column_aliases enable row level security;
alter table public.workflow_etapas enable row level security;
alter table public.workflow_asignaciones enable row level security;
alter table public.workflow_transiciones enable row level security;
alter table public.requisitos_expediente enable row level security;
alter table public.modulos_externos enable row level security;

create policy perfiles_select on public.perfiles for select to authenticated using (true);
create policy perfiles_update_self on public.perfiles for update to authenticated
  using (id = auth.uid() or public.is_admin());

create policy empresas_select on public.empresas for select to authenticated
  using (public.puede_empresa(id) or public.is_admin());
create policy empresas_admin on public.empresas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy roles_select on public.roles for select to authenticated using (true);
create policy roles_admin on public.roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy usuario_roles_select on public.usuario_roles for select to authenticated
  using (usuario_id = auth.uid() or public.is_admin());
create policy usuario_roles_admin on public.usuario_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy usuario_empresas_select on public.usuario_empresas for select to authenticated
  using (usuario_id = auth.uid() or public.is_admin());
create policy usuario_empresas_admin on public.usuario_empresas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy tipos_select on public.tipos_solicitud for select to authenticated using (true);
create policy tipos_admin on public.tipos_solicitud for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy clientes_all on public.clientes for all to authenticated
  using (true) with check (true);
create policy proveedores_all on public.proveedores for all to authenticated
  using (true) with check (true);

create policy docs_empresa_select on public.documentos_empresa for select to authenticated
  using (public.puede_empresa(empresa_id));
create policy docs_empresa_write on public.documentos_empresa for all to authenticated
  using (
    public.puede_empresa(empresa_id)
    and (public.has_rol('LICITACIONES') or public.has_rol('ADMIN_FINANZAS') or public.is_admin())
  )
  with check (
    public.puede_empresa(empresa_id)
    and (public.has_rol('LICITACIONES') or public.has_rol('ADMIN_FINANZAS') or public.is_admin())
  );

create policy solicitudes_all on public.solicitudes for all to authenticated
  using (public.puede_empresa(empresa_id))
  with check (public.puede_empresa(empresa_id));

create policy expedientes_all on public.expedientes for all to authenticated
  using (public.puede_empresa(empresa_id))
  with check (public.puede_empresa(empresa_id));

create policy bitacora_select on public.bitacora for select to authenticated
  using (exists (
    select 1 from public.expedientes e
    where e.id = expediente_id and public.puede_empresa(e.empresa_id)
  ));
create policy bitacora_insert on public.bitacora for insert to authenticated
  with check (exists (
    select 1 from public.expedientes e
    where e.id = expediente_id and public.puede_empresa(e.empresa_id)
  ));

create policy partidas_all on public.partidas for all to authenticated
  using (exists (
    select 1 from public.expedientes e
    where e.id = expediente_id and public.puede_empresa(e.empresa_id)
  ))
  with check (exists (
    select 1 from public.expedientes e
    where e.id = expediente_id and public.puede_empresa(e.empresa_id)
  ));

create policy cot_prov_all on public.cotizaciones_proveedor for all to authenticated
  using (exists (
    select 1 from public.expedientes e
    where e.id = expediente_id and public.puede_empresa(e.empresa_id)
  ))
  with check (exists (
    select 1 from public.expedientes e
    where e.id = expediente_id and public.puede_empresa(e.empresa_id)
  ));

create policy cot_partidas_all on public.cotizacion_partidas for all to authenticated
  using (exists (
    select 1
    from public.cotizaciones_proveedor c
    join public.expedientes e on e.id = c.expediente_id
    where c.id = cotizacion_id and public.puede_empresa(e.empresa_id)
  ))
  with check (exists (
    select 1
    from public.cotizaciones_proveedor c
    join public.expedientes e on e.id = c.expediente_id
    where c.id = cotizacion_id and public.puede_empresa(e.empresa_id)
  ));

create policy cot_final_all on public.cotizaciones_finales for all to authenticated
  using (exists (
    select 1 from public.expedientes e
    where e.id = expediente_id and public.puede_empresa(e.empresa_id)
  ))
  with check (exists (
    select 1 from public.expedientes e
    where e.id = expediente_id and public.puede_empresa(e.empresa_id)
  ));

create policy remisiones_all on public.remisiones for all to authenticated
  using (public.puede_empresa(empresa_id))
  with check (public.puede_empresa(empresa_id));

create policy remision_partidas_all on public.remision_partidas for all to authenticated
  using (exists (
    select 1 from public.remisiones r
    where r.id = remision_id and public.puede_empresa(r.empresa_id)
  ))
  with check (exists (
    select 1 from public.remisiones r
    where r.id = remision_id and public.puede_empresa(r.empresa_id)
  ));

create policy documentos_all on public.documentos for all to authenticated
  using (
    (empresa_id is not null and public.puede_empresa(empresa_id))
    or exists (
      select 1 from public.expedientes e
      where e.id = expediente_id and public.puede_empresa(e.empresa_id)
    )
  )
  with check (
    (empresa_id is not null and public.puede_empresa(empresa_id))
    or exists (
      select 1 from public.expedientes e
      where e.id = expediente_id and public.puede_empresa(e.empresa_id)
    )
  );

create policy aliases_select on public.parse_column_aliases for select to authenticated using (true);
create policy aliases_admin on public.parse_column_aliases for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy wf_etapas_select on public.workflow_etapas for select to authenticated using (true);
create policy wf_etapas_admin on public.workflow_etapas for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy wf_asig_select on public.workflow_asignaciones for select to authenticated using (true);
create policy wf_asig_admin on public.workflow_asignaciones for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy wf_tr_select on public.workflow_transiciones for select to authenticated using (true);
create policy wf_tr_admin on public.workflow_transiciones for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy requisitos_all on public.requisitos_expediente for all to authenticated
  using (exists (
    select 1 from public.expedientes e
    where e.id = expediente_id and public.puede_empresa(e.empresa_id)
  ))
  with check (exists (
    select 1 from public.expedientes e
    where e.id = expediente_id and public.puede_empresa(e.empresa_id)
  ));

create policy modulos_select on public.modulos_externos for select to authenticated using (true);
create policy modulos_admin on public.modulos_externos for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Storage buckets (run in dashboard or via API; SQL reference)
insert into storage.buckets (id, name, public)
values
  ('expedientes', 'expedientes', false),
  ('docs-empresa', 'docs-empresa', false)
on conflict (id) do nothing;
