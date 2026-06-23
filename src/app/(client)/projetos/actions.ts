"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;

  if (!name) return { error: "Nome do projeto é obrigatório." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) return { error: "Usuário não vinculado a um cliente." };

  const { error } = await supabase.from("client_projects").insert({
    client_id: profile.client_id,
    name,
    description,
  });

  if (error) return { error: error.message };

  revalidatePath("/projetos");
  return { success: true };
}

export async function updateProject(projectId: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const isActive = formData.has("is_active");

  if (!name) return { error: "Nome do projeto é obrigatório." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("client_projects")
    .update({ name, description, is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/projetos");
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("client_projects")
    .delete()
    .eq("id", projectId);

  if (error) return { error: error.message };

  revalidatePath("/projetos");
  return { success: true };
}
