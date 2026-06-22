-- =============================================================
-- Funções auxiliares (security definer — evita recursão de RLS)
-- =============================================================

create or replace function is_admin() returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function current_client_id() returns uuid
language sql security definer set search_path = public as $$
  select client_id from profiles where id = auth.uid();
$$;

-- =============================================================
-- Ativar RLS em todas as tabelas
-- =============================================================

alter table clients                 enable row level security;
alter table profiles                enable row level security;
alter table request_types           enable row level security;
alter table requests                enable row level security;
alter table request_attachments     enable row level security;
alter table request_comments        enable row level security;
alter table request_status_history  enable row level security;
alter table notifications_log       enable row level security;

-- =============================================================
-- POLICIES
-- =============================================================

-- PROFILES
create policy profiles_self_read  on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_admin_all  on profiles for all using (is_admin()) with check (is_admin());

-- CLIENTS
create policy clients_admin_all   on clients for all using (is_admin()) with check (is_admin());
create policy clients_self_read   on clients for select using (id = current_client_id());

-- REQUEST TYPES
create policy types_read          on request_types for select using (true);
create policy types_admin_write   on request_types for all using (is_admin()) with check (is_admin());

-- REQUESTS (cliente: SELECT + INSERT próprios; status é coisa do admin)
create policy requests_admin_all     on requests for all using (is_admin()) with check (is_admin());
create policy requests_client_read   on requests for select using (client_id = current_client_id());
create policy requests_client_insert on requests for insert with check (client_id = current_client_id());

-- ATTACHMENTS
create policy att_admin_all    on request_attachments for all using (is_admin()) with check (is_admin());
create policy att_client_read  on request_attachments for select using (
  exists (select 1 from requests r where r.id = request_id and r.client_id = current_client_id()));
create policy att_client_ins   on request_attachments for insert with check (
  exists (select 1 from requests r where r.id = request_id and r.client_id = current_client_id()));

-- COMMENTS
create policy cmt_admin_all    on request_comments for all using (is_admin()) with check (is_admin());
create policy cmt_client_read  on request_comments for select using (
  exists (select 1 from requests r where r.id = request_id and r.client_id = current_client_id()));
create policy cmt_client_ins   on request_comments for insert with check (
  author_id = auth.uid() and
  exists (select 1 from requests r where r.id = request_id and r.client_id = current_client_id()));

-- STATUS HISTORY (cliente só lê; escrita via trigger/admin)
create policy hist_admin_all   on request_status_history for all using (is_admin()) with check (is_admin());
create policy hist_client_read on request_status_history for select using (
  exists (select 1 from requests r where r.id = request_id and r.client_id = current_client_id()));

-- NOTIFICATIONS (admin/servidor)
create policy notif_admin_all  on notifications_log for all using (is_admin()) with check (is_admin());
