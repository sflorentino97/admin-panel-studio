-- ============================================================
-- Migration 007: Painel financeiro — faturas, pagamentos, despesas
-- ============================================================
-- ADR-005: valores em numeric, nunca float. Webhook idempotente
-- via external_ref unique. Status de pagamento só do webhook.
-- ============================================================

-- 1. Enum de status de fatura
create type invoice_status as enum ('draft','sent','paid','overdue','void');

-- 2. Colunas de plano no cliente
alter table clients
  add column if not exists plan_name text,
  add column if not exists monthly_amount numeric(12,2),
  add column if not exists currency text not null default 'BRL';

-- 3. Faturas
create table invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  number text,
  amount numeric(12,2) not null,
  currency text not null default 'BRL',
  status invoice_status not null default 'draft',
  reference_period text,
  issue_date date not null default current_date,
  due_date date not null,
  paid_at timestamptz,
  external_ref text,
  notes text,
  created_at timestamptz not null default now(),
  unique (client_id, reference_period)
);

-- 4. Pagamentos
create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  method text,
  paid_at timestamptz not null default now(),
  external_ref text unique,
  created_at timestamptz not null default now()
);

-- 5. Despesas
create table expenses (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  category text,
  amount numeric(12,2) not null,
  currency text not null default 'BRL',
  incurred_on date not null default current_date,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. View do dashboard financeiro
create or replace view financial_overview with (security_invoker = on) as
select
  (select coalesce(sum(monthly_amount),0) from clients where is_active)                       as mrr,
  (select coalesce(sum(amount),0) from invoices
     where status='paid' and date_trunc('month', paid_at)=date_trunc('month', now()))         as receita_mes,
  (select coalesce(sum(amount),0) from invoices where status in ('sent','overdue'))           as a_receber,
  (select coalesce(sum(amount),0) from invoices where status='overdue')                       as em_atraso,
  (select coalesce(sum(amount),0) from expenses
     where date_trunc('month', incurred_on)=date_trunc('month', now()))                       as despesas_mes;

-- 7. RLS
alter table invoices enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;

create policy inv_admin  on invoices for all using (is_admin()) with check (is_admin());
create policy inv_client on invoices for select using (client_id = current_client_id());

create policy pay_admin  on payments for all using (is_admin()) with check (is_admin());
create policy pay_client on payments for select using (
  exists (select 1 from invoices i where i.id = invoice_id and i.client_id = current_client_id()));

create policy exp_admin  on expenses for all using (is_admin()) with check (is_admin());
