"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncInbound, getAdapter } from "@/lib/integrations/sync";
import type { Integration, IntegrationConfig } from "@/lib/integrations/types";

export async function saveIntegration(
  clientId: string,
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { error: "Acesso negado." };

  const integrationId = (formData.get("integration_id") as string) || null;
  const platform = formData.get("platform") as string;
  const accessToken = (formData.get("access_token") as string)?.trim();
  const resourceId = (formData.get("external_resource_id") as string)?.trim();
  const syncEnabled = formData.has("sync_enabled");

  if (!platform || !accessToken || !resourceId) {
    return { error: "Plataforma, token e ID do recurso são obrigatórios." };
  }

  const config: IntegrationConfig = {};
  if (platform === "notion") {
    config.title_property =
      (formData.get("title_property") as string)?.trim() || "Name";
    config.status_property =
      (formData.get("status_property") as string)?.trim() || "Status";
    config.description_property =
      (formData.get("description_property") as string)?.trim() || undefined;
  }

  const outbound: Record<string, string> = {};
  const inbound: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("map_") && value) {
      const statusId = key.slice(4);
      const extName = (value as string).trim();
      if (extName) {
        outbound[statusId] = extName;
        inbound[extName] = statusId;
      }
    }
  }

  const row = {
    client_id: clientId,
    platform,
    access_token: accessToken,
    external_resource_id: resourceId,
    status_mapping: { outbound, inbound },
    sync_enabled: syncEnabled,
    config,
    updated_at: new Date().toISOString(),
  };

  if (integrationId) {
    const { error } = await supabase
      .from("client_integrations")
      .update(row)
      .eq("id", integrationId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("client_integrations")
      .insert(row);
    if (error) {
      if (error.code === "23505") {
        return { error: "Este cliente já tem uma integração com essa plataforma." };
      }
      return { error: error.message };
    }
  }

  revalidatePath(`/admin/clients/${clientId}/integrations`);
  return { success: true };
}

export async function deleteIntegration(
  clientId: string,
  integrationId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("client_integrations")
    .delete()
    .eq("id", integrationId)
    .eq("client_id", clientId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/clients/${clientId}/integrations`);
  return {};
}

export async function syncNow(
  integrationId: string
): Promise<{ error?: string; created?: number; updated?: number; errors?: string[] }> {
  const adminClient = createAdminClient();

  const { data: integration } = await adminClient
    .from("client_integrations")
    .select("*")
    .eq("id", integrationId)
    .single();

  if (!integration) return { error: "Integração não encontrada." };

  const result = await syncInbound(
    adminClient,
    integration as unknown as Integration
  );

  revalidatePath(`/admin/clients/${integration.client_id}/integrations`);
  revalidatePath("/admin/requests");

  return result;
}

export async function testConnection(
  platform: string,
  token: string,
  resourceId: string,
  config: IntegrationConfig
): Promise<{ error?: string; taskCount?: number; statuses?: string[] }> {
  try {
    const adapter = getAdapter(platform as "notion" | "clickup" | "asana");
    const tasks = await adapter.fetchTasks(token, resourceId, config);
    const statuses = [
      ...new Set(tasks.map((t) => t.status_name).filter(Boolean) as string[]),
    ];
    return { taskCount: tasks.length, statuses };
  } catch (err) {
    return { error: (err as Error).message };
  }
}
