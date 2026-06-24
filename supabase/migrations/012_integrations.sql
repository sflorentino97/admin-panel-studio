-- Client integrations with external project management tools (Notion, ClickUp, Asana)
-- Enables bidirectional sync: client creates tasks in their tool → appears here;
-- studio updates status here → syncs back to client's tool.

CREATE TABLE client_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('notion', 'clickup', 'asana')),
  access_token text NOT NULL,
  external_resource_id text NOT NULL,
  status_mapping jsonb NOT NULL DEFAULT '{"outbound":{},"inbound":{}}',
  webhook_secret text DEFAULT encode(gen_random_bytes(32), 'hex'),
  sync_enabled boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz,
  config jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, platform)
);

CREATE TABLE request_external_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  integration_id uuid NOT NULL REFERENCES client_integrations(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  external_url text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(integration_id, external_id)
);

ALTER TABLE client_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_external_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY integrations_admin_all ON client_integrations
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY ext_links_admin_all ON request_external_links
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
