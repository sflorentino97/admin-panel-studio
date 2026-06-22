-- =============================================================
-- Regras de negócio: RPC + Triggers
-- =============================================================

-- Cliente abre pedido (respeita limite mensal no servidor)
create or replace function submit_request(p_title text, p_description text, p_type_id uuid default null)
returns requests language plpgsql security definer set search_path = public as $$
declare v_client uuid := current_client_id(); v_limit smallint; v_count int; v_row requests;
begin
  if v_client is null then raise exception 'Usuário não vinculado a um cliente'; end if;
  select monthly_request_limit into v_limit from clients where id = v_client;
  select count(*) into v_count from requests
   where client_id = v_client and date_trunc('month', created_at) = date_trunc('month', now());
  if v_count >= v_limit then raise exception 'Limite mensal de % pedido(s) atingido', v_limit; end if;
  insert into requests (client_id, type_id, title, description, status, created_by)
  values (v_client, p_type_id, p_title, p_description, 'queued', auth.uid())
  returning * into v_row;
  return v_row;
end; $$;

-- "1 ativa por vez" + carimbo dos tempos de ciclo
create or replace function handle_status_change() returns trigger language plpgsql as $$
begin
  if NEW.status is distinct from OLD.status then
    if NEW.status = 'in_progress' then
      if exists (select 1 from requests
                 where client_id = NEW.client_id and status = 'in_progress' and id <> NEW.id)
      then raise exception 'Este cliente já tem um pedido em andamento'; end if;
      if NEW.started_at is null then NEW.started_at := now(); end if;
    end if;
    if NEW.status = 'done' and NEW.completed_at is null then NEW.completed_at := now(); end if;
  end if;
  return NEW;
end; $$;

create trigger trg_status_change before update on requests
  for each row execute function handle_status_change();

-- Histórico de status (insert + update)
create or replace function log_status_history() returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    insert into request_status_history(request_id, from_status, to_status, changed_by)
    values (NEW.id, null, NEW.status, auth.uid());
  elsif NEW.status is distinct from OLD.status then
    insert into request_status_history(request_id, from_status, to_status, changed_by)
    values (NEW.id, OLD.status, NEW.status, auth.uid());
  end if;
  return NEW;
end; $$;

create trigger trg_hist_ins after insert on requests for each row execute function log_status_history();
create trigger trg_hist_upd after update on requests for each row execute function log_status_history();

-- =============================================================
-- View: tempo médio de entrega por tipo
-- =============================================================

create or replace view avg_delivery_by_type with (security_invoker = on) as
select rt.name as type_name,
       count(*) filter (where r.completed_at is not null) as completed_count,
       avg(r.completed_at - r.started_at) filter (where r.completed_at is not null and r.started_at is not null) as avg_cycle_time,
       avg(r.completed_at - r.created_at) filter (where r.completed_at is not null) as avg_lead_time
from requests r left join request_types rt on rt.id = r.type_id
group by rt.name;

-- =============================================================
-- Storage policies (contracts e attachments)
-- =============================================================

-- Criar buckets via dashboard do Supabase (privados).
-- Policies de storage:

create policy contracts_admin_all on storage.objects for all to authenticated
  using (bucket_id = 'contracts' and is_admin())
  with check (bucket_id = 'contracts' and is_admin());

create policy contracts_client_read on storage.objects for select to authenticated
  using (bucket_id = 'contracts'
         and (storage.foldername(name))[1] = current_client_id()::text);

create policy attachments_admin_all on storage.objects for all to authenticated
  using (bucket_id = 'attachments' and is_admin())
  with check (bucket_id = 'attachments' and is_admin());

create policy attachments_client_read on storage.objects for select to authenticated
  using (bucket_id = 'attachments'
         and (storage.foldername(name))[1] = current_client_id()::text);

create policy attachments_client_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments'
              and (storage.foldername(name))[1] = current_client_id()::text);

-- =============================================================
-- Trigger: criar perfil automaticamente ao criar usuário
-- =============================================================

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, role, full_name)
  values (NEW.id, 'client', NEW.raw_user_meta_data->>'full_name');
  return NEW;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
