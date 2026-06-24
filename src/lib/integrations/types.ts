export type Platform = "notion" | "clickup" | "asana";

export type StatusMapping = {
  outbound: Record<string, string>;
  inbound: Record<string, string>;
};

export type IntegrationConfig = {
  title_property?: string;
  status_property?: string;
  description_property?: string;
};

export type Integration = {
  id: string;
  client_id: string;
  platform: Platform;
  access_token: string;
  external_resource_id: string;
  status_mapping: StatusMapping;
  webhook_secret: string;
  sync_enabled: boolean;
  last_synced_at: string | null;
  config: IntegrationConfig;
};

export type ExternalTask = {
  external_id: string;
  title: string;
  description: string | null;
  status_name: string | null;
  external_url: string | null;
};

export type SyncResult = {
  created: number;
  updated: number;
  errors: string[];
};

export interface IntegrationAdapter {
  fetchTasks(
    token: string,
    resourceId: string,
    config: IntegrationConfig,
    since?: Date
  ): Promise<ExternalTask[]>;

  createTask(
    token: string,
    resourceId: string,
    config: IntegrationConfig,
    title: string,
    description: string | null,
    statusName: string | null
  ): Promise<{ external_id: string; external_url: string | null }>;

  updateTaskStatus(
    token: string,
    externalId: string,
    config: IntegrationConfig,
    statusName: string
  ): Promise<void>;

  parseWebhookEvent(
    body: unknown
  ): { event_type: "created" | "updated"; task: ExternalTask } | null;
}
