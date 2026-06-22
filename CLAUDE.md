# Portal de Clientes — Studio de Design

> Este arquivo é o contexto do projeto. Salve-o como `CLAUDE.md` na raiz do
> repositório: o Claude Code o lê automaticamente como memória do projeto.
> Construa **na ordem dos milestones** (final do documento), não tudo de uma vez.

---

## 1. O que é

Portal web (PWA — instalável na tela inicial, sem app nativo, sem loja) para um
studio de design gerenciar demandas de clientes.

- **Admin (o studio):** cadastra clientes, vê e gerencia TODAS as demandas (kanban + lista), sobe contrato, define data de cobrança, acompanha métricas.
- **Cliente:** vê só as SUAS demandas (dashboard com kanban + lista), abre novos pedidos (com limite), baixa o contrato, vê tempo de execução e a próxima cobrança.

Regra de negócio central: cada cliente tem **1 demanda ativa por vez** e um
**limite de pedidos por mês** (padrão 1, configurável por cliente).

---

## 2. Stack (tecnologia chata de propósito)

- **Next.js (App Router) + TypeScript** — frontend e rotas de API.
- **Supabase** — Postgres + Auth + Storage. **Não escrever autenticação na mão.**
- **Tailwind CSS** — estilo.
- **Vercel** — hospedagem (tier grátis). Cron da Vercel para os lembretes.
- **Resend** (ou SMTP) — envio de e-mail dos lembretes.
- PWA: `manifest.json` + service worker (Next.js suporta nativamente).

**Guardrails inegociáveis**
- Segredos (chaves de API, `service_role` do Supabase) **nunca** no frontend — só em variáveis de ambiente do servidor.
- Toda a segurança de "quem vê o quê" mora no banco, via **Row Level Security (RLS)**. O frontend confia no banco, não o contrário.
- Cliente só recebe os privilégios mínimos: **ler e criar** os próprios pedidos. Mudar status é função do admin (o kanban é a SUA ferramenta).

---

## 3. Modelo de dados (SQL — rode no Supabase)

```sql
create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'client');
create type request_status as enum ('queued','in_progress','in_review','done','cancelled');

-- Clientes (as contas que o studio atende)
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  contract_path text,                              -- caminho no bucket 'contracts'
  billing_day smallint check (billing_day between 1 and 31),  -- dia de cobrança recorrente
  payment_reminder_days_before smallint not null default 3,
  monthly_request_limit smallint not null default 1,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Usuários de login (estende auth.users do Supabase)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  client_id uuid references clients(id) on delete set null,  -- null para admins
  full_name text,
  created_at timestamptz not null default now()
);

-- Tipos de demanda (para medir tempo médio POR tipo)
create table request_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true
);

-- Pedidos / demandas
create table requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  type_id uuid references request_types(id),
  title text not null,
  description text,
  status request_status not null default 'queued',
  priority smallint not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  started_at timestamptz,     -- carimbado ao entrar em 'in_progress' (início do ciclo)
  completed_at timestamptz,   -- carimbado ao entrar em 'done' (fim do ciclo)
  due_date date,
  position int                -- ordenação dentro da coluna do kanban
);

-- Anexos (briefings/refs do cliente, entregáveis)
create table request_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Comentários (thread de comunicação no pedido)
create table request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- Histórico de status (auditoria + métrica confiável)
create table request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  from_status request_status,
  to_status request_status not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

-- Log de notificações (evita reenviar o lembrete de pagamento)
create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  type text not null,                  -- ex.: 'payment_reminder'
  reference_period text,               -- ex.: '2026-07' (1 envio por ciclo)
  channel text not null default 'email',
  sent_at timestamptz not null default now(),
  unique (client_id, type, reference_period)
);
```

---

## 4. Segurança — funções auxiliares + RLS (SQL)

> A função abaixo é `security definer` de propósito: evita o erro clássico de
> **recursão de RLS** ao consultar `profiles` de dentro de uma policy.

```sql
create or replace function is_admin() returns boolean
language sql security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function current_client_id() returns uuid
language sql security definer set search_path = public as $$
  select client_id from profiles where id = auth.uid();
$$;

-- Liga RLS em tudo
alter table clients                 enable row level security;
alter table profiles                enable row level security;
alter table request_types           enable row level security;
alter table requests                enable row level security;
alter table request_attachments     enable row level security;
alter table request_comments        enable row level security;
alter table request_status_history  enable row level security;
alter table notifications_log       enable row level security;

-- PROFILES
create policy profiles_self_read  on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_admin_all  on profiles for all using (is_admin()) with check (is_admin());

-- CLIENTS
create policy clients_admin_all   on clients for all using (is_admin()) with check (is_admin());
create policy clients_self_read   on clients for select using (id = current_client_id());

-- REQUEST TYPES
create policy types_read          on request_types for select using (true);
create policy types_admin_write   on request_types for all using (is_admin()) with check (is_admin());

-- REQUESTS  (cliente: só SELECT + INSERT do próprio; status é coisa do admin)
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
```

**TESTE OBRIGATÓRIO antes de qualquer outra coisa:** logue como Cliente A e
tente abrir um pedido do Cliente B (pela URL/ID direto). Se conseguir, a RLS
está errada — pare e conserte. Esse é o único bug que vaza dado de cliente.

---

## 5. Regras de negócio (SQL — RPC + triggers)

```sql
-- Cliente abre um pedido (respeita o limite mensal no servidor; não dá pra burlar pelo front)
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
```

**Tempo de execução / tempo médio** — uma view (use `security_invoker` para
respeitar a RLS de quem consulta):

```sql
create or replace view avg_delivery_by_type with (security_invoker = on) as
select rt.name as type_name,
       count(*) filter (where r.completed_at is not null) as completed_count,
       avg(r.completed_at - r.started_at) filter (where r.completed_at is not null and r.started_at is not null) as avg_cycle_time,
       avg(r.completed_at - r.created_at) filter (where r.completed_at is not null) as avg_lead_time
from requests r left join request_types rt on rt.id = r.type_id
group by rt.name;
```
- `avg_cycle_time` = tempo trabalhando (início→fim) — o "tempo de execução".
- `avg_lead_time` = tempo total que o cliente esperou (abertura→fim).

---

## 6. Contrato e anexos (Storage)

Dois buckets **privados** no Supabase: `contracts` e `attachments`.
Isolamento por pasta = id do cliente (`contracts/{client_id}/contrato.pdf`).
Servir sempre por **signed URL** (link temporário), nunca público.

```sql
create policy contracts_admin_all on storage.objects for all to authenticated
  using (bucket_id = 'contracts' and is_admin())
  with check (bucket_id = 'contracts' and is_admin());

create policy contracts_client_read on storage.objects for select to authenticated
  using (bucket_id = 'contracts'
         and (storage.foldername(name))[1] = current_client_id()::text);
```

---

## 7. Lembrete de pagamento (e-mail primeiro; push depois)

Decisão de CTO: **v1 = e-mail.** Confiável, funciona em qualquer aparelho.
Push em PWA é a peça mais fininha (no iPhone só funciona com o ícone instalado,
iOS 16.4+) — fica para a v2.

Job diário (Vercel Cron → Edge Function), em pseudocódigo:
```
para cada cliente ativo:
  proxima_cobranca = próximo dia 'billing_day' a partir de hoje
  periodo = ano-mês da proxima_cobranca           # ex.: '2026-07'
  if (proxima_cobranca - hoje) == payment_reminder_days_before
     e não existe notifications_log(cliente, 'payment_reminder', periodo):
        enviar e-mail
        inserir notifications_log(cliente, 'payment_reminder', periodo)
```
O `unique(client_id, type, reference_period)` garante envio único por ciclo.

---

## 8. Telas / rotas

**Admin**
- `/login` — login único; redireciona por papel.
- `/admin` — visão geral: pedidos ativos, fila, métricas (tempo médio por tipo).
- `/admin/clients` · `/admin/clients/new` · `/admin/clients/[id]` — CRUD, upload de contrato, dia de cobrança, limite mensal.
- `/admin/requests` — **kanban + lista** de TODOS os clientes (filtro por cliente). Arrastar card = mudar status.
- `/admin/requests/[id]` — detalhe, anexos, comentários, histórico.

**Cliente**
- `/` — dashboard: meus pedidos (**kanban + lista**), pedido ativo, tempo médio, próxima cobrança, baixar contrato.
- `/requests/new` — abrir pedido (chama `submit_request`; bloqueia/avisa no limite).
- `/requests/[id]` — detalhe, anexos, comentários.

---

## 9. Melhorias que apliquei (e por quê)

1. **`started_at` + `completed_at`** — separa *tempo de execução* (cycle time) de *tempo de espera* (lead time). Sem isso, "tempo de execução" fica impreciso.
2. **Tabela `request_types`** — permite medir tempo médio **por tipo** de demanda, não só geral.
3. **`request_status_history`** — auditoria e métrica confiável mesmo se alguém editar datas.
4. **Limite mensal via RPC no servidor** — não dá pra burlar pelo frontend; erro amigável em vez de quebrar.
5. **"1 ativa por vez" via trigger** — a regra vive no banco, não na tela.
6. **Anexos + comentários** — designer precisa de briefing/refs e de um canal de conversa no pedido.
7. **`notifications_log` com chave única por período** — nunca manda o lembrete duas vezes.
8. **E-mail antes de push** — 95% do valor com 10% do esforço; push fica pra depois.
9. **Storage privado + signed URL + isolamento por pasta** — contrato é dado sensível, não fica acessível publicamente.
10. **IDs em UUID** — não expõe contagem de clientes nem permite "adivinhar" URLs.
11. **Funções `security definer`** — evitam o bug clássico de recursão de RLS no Supabase.
12. **Menor privilégio pro cliente** — só lê/cria os próprios pedidos; status é do admin.

---

## 10. Ordem de construção (milestones — siga em ordem)

1. **Fundação + segurança:** schema, Auth, RLS, funções auxiliares. **Testar isolamento A↔B.**
2. **Admin cadastra cliente → cliente loga e vê seus pedidos em lista.**
3. **Kanban** (admin e cliente) + carimbo de tempos + view de tempo médio.
4. **Anexos + comentários** no pedido.
5. **Contrato:** upload (admin) / download por signed URL (cliente).
6. **Lembrete de pagamento por e-mail** (cron + log).
7. **PWA:** manifest + service worker (ícone na tela inicial).
8. **(v2)** Push, automações extras.

> Regra de ouro: cada milestone tem que **subir funcionando** antes do próximo.
> Um portal seguro e simples que existe vale mais que um completo que nunca sai.
