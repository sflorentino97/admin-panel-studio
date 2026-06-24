import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Integration,
  Platform,
  IntegrationAdapter,
  IntegrationConfig,
  StatusMapping,
  SyncResult,
} from "./types";
import { notionAdapter } from "./notion";
import { clickupAdapter } from "./clickup";
import { asanaAdapter } from "./asana";

const adapters: Record<Platform, IntegrationAdapter> = {
  notion: notionAdapter,
  clickup: clickupAdapter,
  asana: asanaAdapter,
};

export function getAdapter(platform: Platform): IntegrationAdapter {
  return adapters[platform];
}

export async function syncInbound(
  supabase: SupabaseClient,
  integration: Integration
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, errors: [] };
  const adapter = getAdapter(integration.platform);
  const mapping = integration.status_mapping;

  try {
    const since = integration.last_synced_at
      ? new Date(integration.last_synced_at)
      : undefined;

    const tasks = await adapter.fetchTasks(
      integration.access_token,
      integration.external_resource_id,
      integration.config,
      since
    );

    for (const task of tasks) {
      try {
        const { data: existingLink } = await supabase
          .from("request_external_links")
          .select("id, request_id")
          .eq("integration_id", integration.id)
          .eq("external_id", task.external_id)
          .maybeSingle();

        if (existingLink) {
          const updates: Record<string, unknown> = {};
          if (task.title) updates.title = task.title;
          if (task.description !== null) updates.description = task.description;
          if (task.status_name && mapping.inbound[task.status_name]) {
            updates.status_id = mapping.inbound[task.status_name];
          }

          if (Object.keys(updates).length > 0) {
            await supabase
              .from("requests")
              .update(updates)
              .eq("id", existingLink.request_id);
            await supabase
              .from("request_external_links")
              .update({ last_synced_at: new Date().toISOString() })
              .eq("id", existingLink.id);
            result.updated++;
          }
        } else {
          let statusId =
            task.status_name && mapping.inbound[task.status_name]
              ? mapping.inbound[task.status_name]
              : null;

          if (!statusId) {
            const { data: def } = await supabase
              .from("request_statuses")
              .select("id")
              .eq("category", "backlog")
              .eq("is_active", true)
              .order("position")
              .limit(1)
              .single();
            statusId = def?.id ?? null;
          }
          if (!statusId) {
            result.errors.push(`Sem status padrão para ${task.external_id}`);
            continue;
          }

          const { data: req, error } = await supabase
            .from("requests")
            .insert({
              client_id: integration.client_id,
              title: task.title,
              description: task.description,
              status_id: statusId,
            })
            .select("id")
            .single();

          if (error) {
            result.errors.push(`Erro ao criar: ${error.message}`);
            continue;
          }

          await supabase.from("request_external_links").insert({
            request_id: req.id,
            integration_id: integration.id,
            external_id: task.external_id,
            external_url: task.external_url,
            last_synced_at: new Date().toISOString(),
          });
          result.created++;
        }
      } catch (err) {
        result.errors.push(
          `Tarefa ${task.external_id}: ${(err as Error).message}`
        );
      }
    }

    await supabase
      .from("client_integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", integration.id);
  } catch (err) {
    result.errors.push(`Sync: ${(err as Error).message}`);
  }

  return result;
}

export async function syncOutbound(
  supabase: SupabaseClient,
  requestId: string,
  newStatusId: string
): Promise<void> {
  const { data: links } = await supabase
    .from("request_external_links")
    .select("id, external_id, integration_id")
    .eq("request_id", requestId);

  if (!links || links.length === 0) return;

  for (const link of links) {
    try {
      const { data: integration } = await supabase
        .from("client_integrations")
        .select("*")
        .eq("id", link.integration_id)
        .eq("sync_enabled", true)
        .single();

      if (!integration) continue;

      const mapping = integration.status_mapping as StatusMapping;
      const extStatus = mapping.outbound[newStatusId];
      if (!extStatus) continue;

      const adapter = getAdapter(integration.platform as Platform);
      await adapter.updateTaskStatus(
        integration.access_token,
        link.external_id,
        integration.config as IntegrationConfig,
        extStatus
      );

      await supabase
        .from("request_external_links")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", link.id);
    } catch (err) {
      console.error(`Outbound sync ${link.id}:`, (err as Error).message);
    }
  }
}

export async function handleWebhookEvent(
  supabase: SupabaseClient,
  integration: Integration,
  eventBody: unknown
): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, errors: [] };
  const adapter = getAdapter(integration.platform);
  const mapping = integration.status_mapping;

  const event = adapter.parseWebhookEvent(eventBody);
  if (!event) return result;

  try {
    let task = event.task;

    // Fetch full task if webhook payload is incomplete
    if (!task.title || !task.status_name) {
      try {
        const tasks = await adapter.fetchTasks(
          integration.access_token,
          integration.external_resource_id,
          integration.config
        );
        const full = tasks.find((t) => t.external_id === task.external_id);
        if (full) task = full;
      } catch {
        // Use partial data
      }
    }

    const { data: existingLink } = await supabase
      .from("request_external_links")
      .select("id, request_id, last_synced_at")
      .eq("integration_id", integration.id)
      .eq("external_id", task.external_id)
      .maybeSingle();

    // Debounce: skip if synced in last 15s (prevents outbound→inbound loop)
    if (existingLink?.last_synced_at) {
      const gap = Date.now() - new Date(existingLink.last_synced_at).getTime();
      if (gap < 15_000) return result;
    }

    if (event.event_type === "created" && !existingLink) {
      let statusId =
        task.status_name && mapping.inbound[task.status_name]
          ? mapping.inbound[task.status_name]
          : null;

      if (!statusId) {
        const { data: def } = await supabase
          .from("request_statuses")
          .select("id")
          .eq("category", "backlog")
          .eq("is_active", true)
          .order("position")
          .limit(1)
          .single();
        statusId = def?.id ?? null;
      }
      if (!statusId) {
        result.errors.push("Sem status padrão");
        return result;
      }

      const { data: req, error } = await supabase
        .from("requests")
        .insert({
          client_id: integration.client_id,
          title: task.title || "Nova tarefa (externa)",
          description: task.description,
          status_id: statusId,
        })
        .select("id")
        .single();

      if (error) {
        result.errors.push(error.message);
        return result;
      }

      await supabase.from("request_external_links").insert({
        request_id: req.id,
        integration_id: integration.id,
        external_id: task.external_id,
        external_url: task.external_url,
        last_synced_at: new Date().toISOString(),
      });
      result.created++;
    } else if (event.event_type === "updated" && existingLink) {
      const updates: Record<string, unknown> = {};
      if (task.title) updates.title = task.title;
      if (task.status_name && mapping.inbound[task.status_name]) {
        updates.status_id = mapping.inbound[task.status_name];
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from("requests")
          .update(updates)
          .eq("id", existingLink.request_id);
        await supabase
          .from("request_external_links")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", existingLink.id);
        result.updated++;
      }
    }
  } catch (err) {
    result.errors.push((err as Error).message);
  }

  return result;
}
