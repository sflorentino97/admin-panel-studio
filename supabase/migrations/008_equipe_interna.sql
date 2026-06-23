-- ============================================================
-- Migration 008: Equipe interna — papel 'member'
-- ============================================================
-- Adiciona o papel 'member' (designer/colaborador) ao enum.
-- Members acessam /admin mas SÓ veem demandas e comentários.
-- Não veem financeiro, clientes (edição), nem configurações.
-- ============================================================

-- 1. Adicionar valor ao enum existente
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'member';

-- 2. Funções auxiliares (ANTES das policies que as usam)
CREATE OR REPLACE FUNCTION is_member() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'member');
$$;

CREATE OR REPLACE FUNCTION is_team() RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'member'));
$$;

-- 3. Atualizar policies para incluir members

-- PROFILES: member pode ler qualquer profile (pra ver nomes em comentários)
DROP POLICY IF EXISTS profiles_self_read ON profiles;
CREATE POLICY profiles_team_read ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin() OR is_member());

-- CLIENTS: member pode ler (pra ver nome do cliente na demanda), mas NÃO editar
CREATE POLICY clients_member_read ON clients FOR SELECT USING (is_member());

-- REQUESTS: member tem acesso total (ler, mover status, criar)
DROP POLICY IF EXISTS requests_admin_all ON requests;
CREATE POLICY requests_team_all ON requests FOR ALL
  USING (is_admin() OR is_member())
  WITH CHECK (is_admin() OR is_member());

-- ATTACHMENTS: member pode ler e enviar
DROP POLICY IF EXISTS att_admin_all ON request_attachments;
CREATE POLICY att_team_all ON request_attachments FOR ALL
  USING (is_admin() OR is_member())
  WITH CHECK (is_admin() OR is_member());

-- COMMENTS: member pode ler e escrever
DROP POLICY IF EXISTS cmt_admin_all ON request_comments;
CREATE POLICY cmt_team_all ON request_comments FOR ALL
  USING (is_admin() OR is_member())
  WITH CHECK (is_admin() OR is_member());

-- STATUS HISTORY: member pode ler e escrever (trigger escreve)
DROP POLICY IF EXISTS hist_admin_all ON request_status_history;
CREATE POLICY hist_team_all ON request_status_history FOR ALL
  USING (is_admin() OR is_member())
  WITH CHECK (is_admin() OR is_member());

-- request_statuses e custom_field_definitions já têm policy
-- rs_read / cfd_read com using(true) — member já pode ler
