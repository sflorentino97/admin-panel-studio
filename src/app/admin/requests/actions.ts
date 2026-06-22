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

  const { error } = await supabase.from("requests").insert({
    client_id: clientId,
    title,
    description,
    type_id: typeId || null,
    status: "queued",
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/requests");
  redirect("/admin/requests");
}

export async function updateRequestStatus(
  requestId: string,
  newStatus: string
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
  if (profile?.role !== "admin") return { error: "Acesso negado." };

  const { error } = await supabase
    .from("requests")
    .update({ status: newStatus })
    .eq("id", requestId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/requests");
  revalidatePath("/admin");
  return {};
}
