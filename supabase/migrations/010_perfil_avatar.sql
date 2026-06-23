-- ============================================================
-- Migration 010: Perfil — avatar, cargo, bio
-- ============================================================

-- 1. Colunas extras no profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_path text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS bio text;

-- 2. Policy: usuário pode atualizar seu próprio perfil (nome, avatar, cargo, bio)
CREATE POLICY profiles_self_update ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
