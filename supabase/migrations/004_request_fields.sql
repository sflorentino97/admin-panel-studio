-- Novos campos para demandas
ALTER TABLE requests ADD COLUMN IF NOT EXISTS formats text[];
ALTER TABLE requests ADD COLUMN IF NOT EXISTS drive_link text;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS extra_info text;
