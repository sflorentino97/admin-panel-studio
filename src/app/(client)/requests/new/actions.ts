"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string } | null;

export async function submitRequest(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const formats = formData.getAll("formats") as string[];
  const driveLink = (formData.get("drive_link") as string) || null;
  const extraInfo = (formData.get("extra_info") as string) || null;

  if (!title) {
    return { error: "O título é obrigatório." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) return { error: "Usuário não vinculado a um cliente." };

  const { error } = await supabase.from("requests").insert({
    client_id: profile.client_id,
    title,
    description,
    formats: formats.length > 0 ? formats : null,
    drive_link: driveLink,
    extra_info: extraInfo,
    status: "queued",
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}
