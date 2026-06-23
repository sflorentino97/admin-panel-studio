-- ============================================================
-- Migration 005: Kanban editável — status vira tabela
-- ============================================================
-- ADR-003: Enum fixo não permite editar colunas. Trocamos por
-- request_statuses. Cada status tem uma CATEGORIA que dirige
-- toda a lógica (1 ativa, carimbo de tempo). Nome/cor/ordem
-- da coluna é cosmético.
-- ============================================================

-- 1. Enum de categoria (fixa, poucos valores, dirige lógica)
create type status_category as enum ('backlog','active','review','done','cancelled');

-- 2. Tabela de status (colunas do kanban)
create table request_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category status_category not null,
  position int not null default 0,
  color text default '#9ca3af',
  wip_limit int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Seed mapeando o enum antigo
insert into request_statuses (name, category, position, color) values
  ('Fila',        'backlog',   0, '#9ca3af'),
  ('Em produção', 'active',    1, '#3b82f6'),
  ('Em revisão',  'review',    2, '#f59e0b'),
  ('Concluído',   'done',      3, '#10b981'),
  ('Cancelado',   'cancelled', 4, '#ef4444');

-- 4. Adicionar status_id em requests
alter table requests add column status_id uuid references request_statuses(id);

-- 5. Migrar dados do enum para FK
update requests r set status_id = s.id
from request_statuses s
where (r.status = 'queued'      and s.category = 'backlog')
   or (r.status = 'in_progress' and s.category = 'active')
   or (r.status = 'in_review'   and s.category = 'review')
   or (r.status = 'done'        and s.category = 'done')
   or (r.status = 'cancelled'   and s.category = 'cancelled');

alter table requests alter column status_id set not null;

-- 6. Adicionar status_id em request_status_history
alter table request_status_history
  add column from_status_id uuid references request_statuses(id),
  add column to_status_id uuid references request_statuses(id);

-- Migrar histórico existente
update request_status_history h set
  from_status_id = fs.id,
  to_status_id   = ts.id
from request_statuses fs, request_statuses ts
where (
  (h.from_status = 'queued'      and fs.category = 'backlog')
  or (h.from_status = 'in_progress' and fs.category = 'active')
  or (h.from_status = 'in_review'   and fs.category = 'review')
  or (h.from_status = 'done'        and fs.category = 'done')
  or (h.from_status = 'cancelled'   and fs.category = 'cancelled')
) and (
  (h.to_status = 'queued'      and ts.category = 'backlog')
  or (h.to_status = 'in_progress' and ts.category = 'active')
  or (h.to_status = 'in_review'   and ts.category = 'review')
  or (h.to_status = 'done'        and ts.category = 'done')
  or (h.to_status = 'cancelled'   and ts.category = 'cancelled')
);

-- Preencher to_status_id onde from_status era null (primeiro registro)
update request_status_history h set to_status_id = ts.id
from request_statuses ts
where h.to_status_id is null
  and (
    (h.to_status = 'queued'      and ts.category = 'backlog')
    or (h.to_status = 'in_progress' and ts.category = 'active')
    or (h.to_status = 'in_review'   and ts.category = 'review')
    or (h.to_status = 'done'        and ts.category = 'done')
    or (h.to_status = 'cancelled'   and ts.category = 'cancelled')
  );

alter table request_status_history alter column to_status_id set not null;

-- 7. Atualizar trigger de mudança de status (usa categoria)
create or replace function handle_status_change() returns trigger language plpgsql as $$
declare new_cat status_category;
begin
  if NEW.status_id is distinct from OLD.status_id then
    select category into new_cat from request_statuses where id = NEW.status_id;

    if new_cat = 'active' then
      if exists (
        select 1 from requests rq join request_statuses st on st.id = rq.status_id
        where rq.client_id = NEW.client_id and st.category = 'active' and rq.id <> NEW.id
      ) then raise exception 'Este cliente já tem um pedido em andamento'; end if;
      if NEW.started_at is null then NEW.started_at := now(); end if;
    end if;

    if new_cat = 'done' and NEW.completed_at is null then NEW.completed_at := now(); end if;
  end if;
  return NEW;
end; $$;

-- 8. Atualizar trigger de log de histórico (usa status_id)
create or replace function log_status_history() returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    insert into request_status_history(request_id, from_status_id, to_status_id, changed_by)
    values (NEW.id, null, NEW.status_id, auth.uid());
  elsif NEW.status_id is distinct from OLD.status_id then
    insert into request_status_history(request_id, from_status_id, to_status_id, changed_by)
    values (NEW.id, OLD.status_id, NEW.status_id, auth.uid());
  end if;
  return NEW;
end; $$;

-- 9. Atualizar view de tempo médio
create or replace view avg_delivery_by_type with (security_invoker = on) as
select rt.name as type_name,
       count(*) filter (where r.completed_at is not null) as completed_count,
       avg(r.completed_at - r.started_at) filter (where r.completed_at is not null and r.started_at is not null) as avg_cycle_time,
       avg(r.completed_at - r.created_at) filter (where r.completed_at is not null) as avg_lead_time
from requests r left join request_types rt on rt.id = r.type_id
group by rt.name;

-- 10. RLS para request_statuses
alter table request_statuses enable row level security;
create policy rs_read  on request_statuses for select using (true);
create policy rs_admin on request_statuses for all using (is_admin()) with check (is_admin());

-- NOTA: as colunas antigas (requests.status, request_status_history.from_status/to_status)
-- ficam por enquanto para compatibilidade. Remover depois de validar tudo em produção:
--   alter table requests drop column status;
--   alter table request_status_history drop column from_status, drop column to_status;
--   drop type request_status;
