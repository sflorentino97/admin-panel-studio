"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: boolean } | null;

export async function createStatus(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = (formData.get("name") as string)?.trim();
  const category = formData.get("category") as string;
  const color = (formData.get("color") as string) || "#9ca3af";
  const wipLimit = formData.get("wip_limit") as string;

  if (!name || !category) {
    return { error: "Nome e categoria são obrigatórios." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: maxPos } = await supabase
    .from("request_statuses")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from("request_statuses").insert({
    name,
    category,
    color,
    wip_limit: wipLimit ? parseInt(wipLimit) : null,
    position: (maxPos?.position ?? -1) + 1,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/board-settings");
  revalidatePath("/admin/requests");
  return { success: true };
}

export async function updateStatus(
  statusId: string,
  data: { name?: string; color?: string; wip_limit?: number | null; position?: number }
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("request_statuses")
    .update(data)
    .eq("id", statusId);

  if (error) return { error: error.message };

  revalidatePath("/admin/board-settings");
  revalidatePath("/admin/requests");
  return {};
}

export async function reorderStatuses(
  orderedIds: string[]
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("request_statuses")
      .update({ position: i })
      .eq("id", orderedIds[i]);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/board-settings");
  revalidatePath("/admin/requests");
  return {};
}

export async function deleteStatus(
  statusId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { count } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("status_id", statusId);

  if (count && count > 0) {
    return { error: `Existem ${count} demanda(s) nesta coluna. Mova-as antes de excluir.` };
  }

  const { error } = await supabase
    .from("request_statuses")
    .delete()
    .eq("id", statusId);

  if (error) return { error: error.message };

  revalidatePath("/admin/board-settings");
  revalidatePath("/admin/requests");
  return {};
}
