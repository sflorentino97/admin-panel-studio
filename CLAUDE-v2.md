# Portal de Clientes — v2 (Kanban editável · Campos personalizados · Financeiro)

> Estende o `CLAUDE.md` v1 (já construído). Trate isto como **migrações** sobre o
> que existe. Mantenha o v1 no repositório como histórico; use este como spec de trabalho.
> Construa na ordem dos milestones (final do documento). Cada um sobe funcionando antes do próximo.

---

## Decisões de arquitetura desta versão (ADRs)

**ADR-003 — Status vira tabela (kanban editável).**
Enum fixo não permite editar colunas. Trocamos por `request_statuses`. Cada
status tem uma **categoria** (`backlog/active/review/done/cancelled`) que dirige
TODA a lógica (1 ativa, carimbo de tempo). O nome/cor/ordem da coluna é cosmético.
Trade-off: uma migração agora; em troca, colunas 100% editáveis sem mexer em código.

**ADR-004 — Campos personalizados via JSONB + definições.**
`custom_field_definitions` descreve os campos; valores em `requests.custom_data jsonb`.
Trade-off: flexível (adiciona campo sem migração), mas tipagem fraca → **validação no servidor** (na RPC).

**ADR-005 — Cobrança e nota fiscal: COMPRAR, não construir.**
Construímos faturas, métricas e dashboard. Cobrança real (PIX/boleto/cartão) e
NFS-e ficam num **provedor** (Asaas / Mercado Pago / Stripe / Pagar.me). Ele
confirma pagamento por **webhook**; nós só atualizamos status. Nunca construir
processador de pagamento nem emissor de nota.

**Guardrails de dinheiro**
- Valores sempre em `numeric`, **nunca** `float`.
- Webhook idempotente: cada evento tem `external_ref` único → não duplica pagamento.
- **Nunca** confie no status de pagamento vindo do front; só do webhook do provedor (servidor).

---

## 1. Kanban editável

```sql
create type status_category as enum ('backlog','active','review','done','cancelled');

create table request_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category status_category not null,
  position int not null default 0,
  color text default '#9ca3af',
  wip_limit int,                       -- null = sem limite de cards na coluna
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed mapeando o enum antigo
insert into request_statuses (name, category, position, color) values
  ('Fila',        'backlog',   0, '#9ca3af'),
  ('Em produção', 'active',    1, '#3b82f6'),
  ('Em revisão',  'review',    2, '#f59e0b'),
  ('Concluído',   'done',      3, '#10b981'),
  ('Cancelado',   'cancelled', 4, '#ef4444');

-- Migração da coluna enum -> FK
alter table requests add column status_id uuid references request_statuses(id);

update requests r set status_id = s.id
from request_statuses s
where (r.status = 'queued'      and s.category = 'backlog')
   or (r.status = 'in_progress' and s.category = 'active')
   or (r.status = 'in_review'   and s.category = 'review')
   or (r.status = 'done'        and s.category = 'done')
   or (r.status = 'cancelled'   and s.category = 'cancelled');

alter table requests alter column status_id set not null;
-- depois de validar TUDO em produção: alter table requests drop column status;
```

Trigger atualizado (usa categoria, não nome):

```sql
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
```

UI do admin: tela `/admin/board-settings` para criar/renomear/reordenar/colorir
colunas e definir `wip_limit`. Arrastar card entre colunas = trocar `status_id`.
Reordenar colunas = atualizar `position`.

> **Cuidado:** ao apagar uma coluna, exija mover os cards antes (ou bloqueie se
> houver pedidos nela). Nunca deixe pedido órfão sem status.

---

## 2. Campos personalizados no formulário de demanda

```sql
create type custom_field_type as enum
  ('text','textarea','number','date','select','multiselect','checkbox','url');

create table custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,            -- snake_case usado dentro do JSONB
  label text not null,
  field_type custom_field_type not null,
  options jsonb,                       -- para select/multiselect: ["Opção A","Opção B"]
  is_required boolean not null default false,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table requests add column custom_data jsonb not null default '{}'::jsonb;
```

RPC de criação atualizada (valida obrigatórios + injeta o JSONB):

```sql
create or replace function submit_request(
  p_title text, p_description text,
  p_type_id uuid default null, p_custom jsonb default '{}'::jsonb
) returns requests language plpgsql security definer set search_path = public as $$
declare v_client uuid := current_client_id(); v_limit smallint; v_count int;
        v_row requests; v_missing text;
begin
  if v_client is null then raise exception 'Usuário não vinculado a um cliente'; end if;

  -- campos personalizados obrigatórios
  select string_agg(label, ', ') into v_missing
  from custom_field_definitions d
  where d.is_required and d.is_active and (p_custom ->> d.key) is null;
  if v_missing is not null then
    raise exception 'Campos obrigatórios faltando: %', v_missing;
  end if;

  -- limite mensal
  select monthly_request_limit into v_limit from clients where id = v_client;
  select count(*) into v_count from requests
   where client_id = v_client and date_trunc('month', created_at) = date_trunc('month', now());
  if v_count >= v_limit then raise exception 'Limite mensal de % pedido(s) atingido', v_limit; end if;

  insert into requests (client_id, type_id, title, description, status_id, created_by, custom_data)
  values (v_client, p_type_id, p_title, p_description,
          (select id from request_statuses where category='backlog' and is_active order by position limit 1),
          auth.uid(), coalesce(p_custom,'{}'::jsonb))
  returning * into v_row;
  return v_row;
end; $$;
```

UI: o admin gerencia os campos em `/admin/form-builder`; o formulário do cliente
renderiza dinamicamente a partir de `custom_field_definitions` (ordenado por `position`).

---

## 3. Painel financeiro

```sql
create type invoice_status as enum ('draft','sent','paid','overdue','void');

-- Plano/assinatura no cliente
alter table clients
  add column plan_name text,
  add column monthly_amount numeric(12,2),
  add column currency text not null default 'BRL';

create table invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  number text,                          -- sua numeração
  amount numeric(12,2) not null,
  currency text not null default 'BRL',
  status invoice_status not null default 'draft',
  reference_period text,                -- '2026-07'
  issue_date date not null default current_date,
  due_date date not null,
  paid_at timestamptz,
  external_ref text,                    -- id no provedor (Asaas/Stripe/MP)
  notes text,
  created_at timestamptz not null default now(),
  unique (client_id, reference_period)  -- 1 fatura por ciclo por cliente
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  method text,                          -- pix | boleto | cartao
  paid_at timestamptz not null default now(),
  external_ref text unique,             -- idempotência do webhook
  created_at timestamptz not null default now()
);

-- Despesas (opcional, para ver LUCRO, não só receita)
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
```

Visão do dashboard (admin):

```sql
create or replace view financial_overview with (security_invoker = on) as
select
  (select coalesce(sum(monthly_amount),0) from clients where is_active)                       as mrr,
  (select coalesce(sum(amount),0) from invoices
     where status='paid' and date_trunc('month', paid_at)=date_trunc('month', now()))         as receita_mes,
  (select coalesce(sum(amount),0) from invoices where status in ('sent','overdue'))           as a_receber,
  (select coalesce(sum(amount),0) from invoices where status='overdue')                       as em_atraso,
  (select coalesce(sum(amount),0) from expenses
     where date_trunc('month', incurred_on)=date_trunc('month', now()))                       as despesas_mes;
-- lucro_mes = receita_mes - despesas_mes (calcule na aplicação)
```

Geração automática de faturas + atraso (estende o cron de lembrete do v1):

```
DIÁRIO:
  para cada cliente ativo com monthly_amount:
     periodo = ano-mês atual
     se NÃO existe invoice(client, reference_period=periodo):
        criar invoice(amount=monthly_amount, due_date=dia billing_day, status='sent')
  marcar como 'overdue': invoices com due_date < hoje e status='sent'
  para vencer em X dias (payment_reminder_days_before): enviar e-mail + logar (notifications_log)
```

Webhook do provedor (rota de API no servidor, valida assinatura do provedor):
```
ao receber 'payment.confirmed':
  achar invoice por external_ref
  inserir payment(external_ref do evento)   -- unique evita duplicar
  marcar invoice.status='paid', paid_at=now()
```

---

## 4. RLS das novas tabelas

```sql
alter table request_statuses          enable row level security;
alter table custom_field_definitions  enable row level security;
alter table invoices                  enable row level security;
alter table payments                  enable row level security;
alter table expenses                  enable row level security;

-- Statuses e definições de campo: todos LEEM (render do kanban/form); admin gerencia
create policy rs_read       on request_statuses          for select using (true);
create policy rs_admin      on request_statuses          for all using (is_admin()) with check (is_admin());
create policy cfd_read      on custom_field_definitions  for select using (true);
create policy cfd_admin     on custom_field_definitions  for all using (is_admin()) with check (is_admin());

-- Faturas: admin tudo; cliente lê as DELE
create policy inv_admin     on invoices  for all using (is_admin()) with check (is_admin());
create policy inv_client    on invoices  for select using (client_id = current_client_id());

-- Pagamentos: admin tudo; cliente lê via fatura dele
create policy pay_admin     on payments  for all using (is_admin()) with check (is_admin());
create policy pay_client    on payments  for select using (
  exists (select 1 from invoices i where i.id = invoice_id and i.client_id = current_client_id()));

-- Despesas: SÓ admin (dado interno, cliente nunca vê)
create policy exp_admin     on expenses  for all using (is_admin()) with check (is_admin());
```

> Reteste o isolamento depois desta versão: logado como cliente, tente abrir a
> fatura de OUTRO cliente e a tabela de despesas. Ambas devem dar vazio/negado.

---

## 5. Features sugeridas (roadmap priorizado)

Marcação: **[build]** construir · **[buy]** integrar provedor · valor↑/esforço.

### Fazer cedo (alto valor, específico de studio)
- **Aprovação de entregáveis** [build] — cliente aprova ou "pede ajuste" no pedido, com versões (v1, v2, v3). É *a* feature de portal de design. Valor altíssimo, esforço médio.
- **Cobrança real + webhook** [buy] — Asaas/Mercado Pago/Stripe para PIX, boleto e cartão. Transforma o financeiro de planilha em automático.
- **Nota fiscal (NFS-e)** [buy] — via Asaas/eNotas/NFe.io. É legal/fiscal; nunca construir.
- **Time tracking por pedido** [build] — horas reais → cruza com o financeiro e revela **rentabilidade por cliente** (quem dá lucro, quem dá prejuízo). Muda como você precifica.

### Depois (engajamento e operação)
- **Central de notificações in-app + push** [build] — agora que é PWA, push faz sentido (e-mail continua de fallback).
- **Templates de pedido recorrente** [build] — "pacote mensal de social" pré-preenchido.
- **Biblioteca de marca por cliente** [build] — logos, fontes, guidelines no portal dele.
- **Relatórios/export CSV e PDF** [build] — financeiro e entrega, para fechamento e para o cliente.
- **Visão de capacidade do studio** [build] — quantos pedidos ativos vs. sua capacidade; evita aceitar demanda demais e estourar prazo.

### Quando o time crescer (não antes — YAGNI)
- **Papel "designer/colaborador"** [build] — acesso parcial às tarefas, sem ver financeiro. Só vale quando entrar a 2ª pessoa.
- **Multi-usuário por cliente** [build] — vários contatos da mesma empresa-cliente.
- **CSAT pós-entrega** [build] — nota + comentário ao concluir.
- **Audit log** [build] — quem mudou o quê; bom para confiança e suporte.

**Princípio do roadmap:** rentabilidade (time tracking + financeiro) e aprovação de
entregáveis dão mais retorno que qualquer enfeite. Comece por elas. Não construa o
que é YAGNI ("você não vai precisar disso ainda") só porque é legal.

---

## 6. Milestones (ordem)

1. **Kanban editável** — tabela de status + migração + trigger por categoria + tela de colunas. Reteste "1 ativa".
2. **Campos personalizados** — definições + JSONB + RPC validando + form-builder + render dinâmico.
3. **Financeiro base** — planos no cliente, faturas, despesas, view, geração automática mensal. **Reteste isolamento.**
4. **Cobrança real** [buy] — integra provedor + webhook idempotente.
5. **Nota fiscal** [buy] — integra emissor.
6. **Aprovação de entregáveis + time tracking** — as duas features de maior retorno.
7. Daí em diante, conforme o roadmap.

> Regra de ouro continua: cada milestone sobe funcionando antes do próximo, e a
> RLS é retestada toda vez que você adiciona tabela com dado de cliente.
