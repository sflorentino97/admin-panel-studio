-- ============================================================
-- Migration 009: Financeiro avançado — impostos, custos, margem
-- ============================================================

-- 1. Configurações do studio (singleton — sempre 1 registro)
CREATE TABLE studio_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tax_rate_min numeric(5,2) NOT NULL DEFAULT 7.00,
  tax_rate_max numeric(5,2) NOT NULL DEFAULT 14.00,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO studio_settings (tax_rate_min, tax_rate_max) VALUES (7.00, 14.00);

ALTER TABLE studio_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_admin ON studio_settings FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- 2. View financeira enriquecida (substitui a anterior)
-- RECEITA AUTOMÁTICA: cliente ativo + monthly_amount = receita garantida
-- Faturas são opcionais para rastreamento, não para contabilizar receita.
CREATE OR REPLACE VIEW financial_overview WITH (security_invoker = on) AS
SELECT
  -- MRR = soma de todos os clientes ativos com plano
  (SELECT coalesce(sum(monthly_amount),0)
     FROM clients WHERE is_active AND monthly_amount > 0)                               AS mrr,

  -- Receita do mês = MRR (automático dos clientes ativos)
  -- + faturas avulsas pagas (projetos extras, one-off)
  (SELECT coalesce(sum(monthly_amount),0)
     FROM clients WHERE is_active AND monthly_amount > 0)
  +
  (SELECT coalesce(sum(i.amount),0) FROM invoices i
     WHERE i.status = 'paid'
       AND date_trunc('month', i.paid_at) = date_trunc('month', now())
       AND NOT EXISTS (
         SELECT 1 FROM clients c
         WHERE c.id = i.client_id AND c.is_active AND c.monthly_amount > 0
         AND i.reference_period IS NOT NULL
       ))                                                                                AS receita_mes,

  -- Receita recorrente (só clientes ativos)
  (SELECT coalesce(sum(monthly_amount),0)
     FROM clients WHERE is_active AND monthly_amount > 0)                               AS receita_recorrente,

  -- Receita extra (faturas avulsas pagas no mês, excluindo as de recorrência)
  (SELECT coalesce(sum(i.amount),0) FROM invoices i
     WHERE i.status = 'paid'
       AND date_trunc('month', i.paid_at) = date_trunc('month', now())
       AND NOT EXISTS (
         SELECT 1 FROM clients c
         WHERE c.id = i.client_id AND c.is_active AND c.monthly_amount > 0
         AND i.reference_period IS NOT NULL
       ))                                                                                AS receita_extra,

  (SELECT coalesce(sum(amount),0) FROM invoices
     WHERE status IN ('sent','overdue'))                                                AS a_receber,

  (SELECT coalesce(sum(amount),0) FROM invoices
     WHERE status='overdue')                                                            AS em_atraso,

  (SELECT coalesce(sum(amount),0) FROM expenses
     WHERE date_trunc('month', incurred_on) = date_trunc('month', now()))               AS despesas_mes,

  (SELECT coalesce(sum(amount),0) FROM expenses
     WHERE is_recurring
       AND date_trunc('month', incurred_on) = date_trunc('month', now()))               AS custos_operacionais,

  (SELECT coalesce(sum(amount),0) FROM expenses
     WHERE NOT is_recurring
       AND date_trunc('month', incurred_on) = date_trunc('month', now()))               AS despesas_variaveis,

  (SELECT tax_rate_min FROM studio_settings WHERE id = 1)                               AS tax_rate_min,
  (SELECT tax_rate_max FROM studio_settings WHERE id = 1)                               AS tax_rate_max,

  (SELECT count(*) FROM clients WHERE is_active)                                        AS total_clientes_ativos,

  (SELECT count(*) FROM clients WHERE is_active AND monthly_amount > 0)                 AS clientes_com_plano,

  -- Mês anterior: usa mesma lógica de MRR (contagem de ativos naquele mês)
  -- Como não temos snapshot histórico, usamos faturas pagas como proxy
  (SELECT coalesce(sum(amount),0) FROM invoices
     WHERE status = 'paid'
       AND paid_at >= date_trunc('month', now()) - interval '1 month'
       AND paid_at < date_trunc('month', now()))                                        AS receita_mes_anterior,

  (SELECT coalesce(sum(amount),0) FROM expenses
     WHERE date_trunc('month', incurred_on) = date_trunc('month', now()) - interval '1 month') AS despesas_mes_anterior;
