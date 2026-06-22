-- =============================================================
-- Milestone 1: Schema, Auth, RLS, funções auxiliares
-- Rode este arquivo no SQL Editor do Supabase (ou via CLI)
-- =============================================================

create extension if not exists "pgcrypto";

-- Enums
create type user_role as enum ('admin', 'client');
create type request_status as enum ('queued','in_progress','in_review','done','cancelled');

-- =============================================================
-- TABELAS
-- =============================================================

-- Clientes (as contas que o studio atende)
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  contract_path text,
  billing_day smallint check (billing_day between 1 and 31),
  payment_reminder_days_before smallint not null default 3,
  monthly_request_limit smallint not null default 1,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Perfis (estende auth.users do Supabase)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'client',
  client_id uuid references clients(id) on delete set null,
  full_name text,
  created_at timestamptz not null default now()
);

-- Tipos de demanda
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
  started_at timestamptz,
  completed_at timestamptz,
  due_date date,
  position int
);

-- Anexos
create table request_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- Comentários
create table request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null,
  created_at timestamptz not null default now()
);

-- Histórico de status
create table request_status_history (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references requests(id) on delete cascade,
  from_status request_status,
  to_status request_status not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

-- Log de notificações
create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  type text not null,
  reference_period text,
  channel text not null default 'email',
  sent_at timestamptz not null default now(),
  unique (client_id, type, reference_period)
);
