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
CREATE OR REPLACE VIEW financial_overview WITH (security_invoker = on) AS
SELECT
  (SELECT coalesce(sum(monthly_amount),0)
     FROM clients WHERE is_active)                                                     AS mrr,

  (SELECT coalesce(sum(amount),0) FROM invoices
     WHERE status='paid'
       AND date_trunc('month', paid_at) = date_trunc('month', now()))                  AS receita_mes,

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

  (SELECT coalesce(sum(amount),0) FROM invoices
     WHERE status = 'paid'
       AND paid_at >= date_trunc('month', now()) - interval '1 month'
       AND paid_at < date_trunc('month', now()))                                        AS receita_mes_anterior,

  (SELECT coalesce(sum(amount),0) FROM expenses
     WHERE date_trunc('month', incurred_on) = date_trunc('month', now()) - interval '1 month') AS despesas_mes_anterior;
