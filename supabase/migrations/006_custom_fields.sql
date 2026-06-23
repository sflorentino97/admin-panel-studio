-- ============================================================
-- Migration 006: Campos personalizados por demanda
-- ============================================================
-- ADR-004: custom_field_definitions descreve os campos;
-- valores em requests.custom_data (JSONB).
-- Validação de obrigatórios acontece no servidor (RPC).
-- ============================================================

-- 1. Enum de tipo de campo
create type custom_field_type as enum
  ('text','textarea','number','date','select','multiselect','checkbox','url');

-- 2. Tabela de definições de campo
create table custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  field_type custom_field_type not null,
  options jsonb,
  is_required boolean not null default false,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. Coluna JSONB em requests
alter table requests add column if not exists custom_data jsonb not null default '{}'::jsonb;

-- 4. RLS
alter table custom_field_definitions enable row level security;
create policy cfd_read  on custom_field_definitions for select using (true);
create policy cfd_admin on custom_field_definitions for all using (is_admin()) with check (is_admin());
