-- ============================================================
-- Migration 011: Responsável nas tarefas + Área do cliente (CNPJ/Projetos)
-- ============================================================

-- 1. Campo assigned_to na tabela requests
ALTER TABLE requests ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id);

-- 2. Campos da empresa no cadastro do cliente
ALTER TABLE clients ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS razao_social text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nome_fantasia text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS endereco text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS inscricao_estadual text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS inscricao_municipal text;

-- 3. Projetos do cliente (os clientes DELE)
CREATE TABLE IF NOT EXISTS client_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_admin_all ON client_projects FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY projects_member_read ON client_projects FOR SELECT
  USING (is_member());

CREATE POLICY projects_client_read ON client_projects FOR SELECT
  USING (client_id = current_client_id());

CREATE POLICY projects_client_insert ON client_projects FOR INSERT
  WITH CHECK (client_id = current_client_id());

CREATE POLICY projects_client_update ON client_projects FOR UPDATE
  USING (client_id = current_client_id())
  WITH CHECK (client_id = current_client_id());

CREATE POLICY projects_client_delete ON client_projects FOR DELETE
  USING (client_id = current_client_id());

-- 4. Função para o cliente atualizar apenas dados da empresa (seguro)
CREATE OR REPLACE FUNCTION update_my_company_info(
  p_cnpj text,
  p_razao_social text,
  p_nome_fantasia text,
  p_endereco text,
  p_inscricao_estadual text,
  p_inscricao_municipal text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client uuid := current_client_id();
BEGIN
  IF v_client IS NULL THEN RAISE EXCEPTION 'Usuário não vinculado a um cliente'; END IF;
  UPDATE clients SET
    cnpj = p_cnpj,
    razao_social = p_razao_social,
    nome_fantasia = p_nome_fantasia,
    endereco = p_endereco,
    inscricao_estadual = p_inscricao_estadual,
    inscricao_municipal = p_inscricao_municipal,
    updated_at = now()
  WHERE id = v_client;
END; $$;

-- 5. Notificar PostgREST sobre mudanças no schema
SELECT pg_notify('pgrst', 'reload schema');
