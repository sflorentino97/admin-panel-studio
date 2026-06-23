"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | null;

export async function createRequest(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const clientId = formData.get("client_id") as string;
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const typeId = (formData.get("type_id") as string) || null;
  const priority = Number(formData.get("priority")) || 0;
  const dueDate = (formData.get("due_date") as string) || null;
  const formats = formData.getAll("formats") as string[];
  const driveLink = (formData.get("drive_link") as string) || null;
  const extraInfo = (formData.get("extra_info") as string) || null;
  const assignedTo = (formData.get("assigned_to") as string) || null;

  if (!clientId || !title) {
    return { error: "Cliente e título são obrigatórios." };
  }

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

  const { data: defaultStatus } = await supabase
    .from("request_statuses")
    .select("id")
    .eq("category", "backlog")
    .eq("is_active", true)
    .order("position")
    .limit(1)
    .single();

  if (!defaultStatus) return { error: "Nenhum status padrão configurado." };

  const customData: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("custom_")) {
      const fieldKey = key.slice(7);
      if (customData[fieldKey]) {
        const existing = customData[fieldKey];
        customData[fieldKey] = Array.isArray(existing) ? [...existing, value] : [existing, value];
      } else {
        customData[fieldKey] = value;
      }
    }
  }

  const { error } = await supabase.from("requests").insert({
    client_id: clientId,
    title,
    description,
    type_id: typeId || null,
    priority,
    due_date: dueDate || null,
    formats: formats.length > 0 ? formats : null,
    drive_link: driveLink,
    extra_info: extraInfo,
    status_id: defaultStatus.id,
    created_by: user.id,
    assigned_to: assignedTo,
    custom_data: customData,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/requests");
  redirect("/admin/requests");
}

export async function assignRequest(
  requestId: string,
  assignedTo: string | null
): Promise<{ error?: string }> {
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
  if (profile?.role !== "admin" && profile?.role !== "member")
    return { error: "Acesso negado." };

  const { error } = await supabase
    .from("requests")
    .update({ assigned_to: assignedTo || null })
    .eq("id", requestId);

  if (error) return { error: error.message };

  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  return {};
}

export async function updateRequestStatus(
  requestId: string,
  newStatusId: string
): Promise<{ error?: string }> {
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
  if (profile?.role !== "admin" && profile?.role !== "member")
    return { error: "Acesso negado." };

  const { error } = await supabase
    .from("requests")
    .update({ status_id: newStatusId })
    .eq("id", requestId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  return {};
}
