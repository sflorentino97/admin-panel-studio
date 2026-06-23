"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const fullName = (formData.get("full_name") as string)?.trim();
  const jobTitle = (formData.get("job_title") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const bio = (formData.get("bio") as string)?.trim() || null;

  if (!fullName) return { error: "Nome é obrigatório." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, job_title: jobTitle, phone, bio })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/admin/perfil");
  revalidatePath("/perfil");
  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "Nenhum arquivo selecionado." };

  if (file.size > 2 * 1024 * 1024) return { error: "Arquivo muito grande (máx. 2MB)." };

  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return { error: "Formato inválido. Use JPG, PNG ou WebP." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const ext = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(storagePath, file, { upsert: true });

  if (uploadError) return { error: `Erro no upload: ${uploadError.message}` };

  const { error: dbError } = await supabase
    .from("profiles")
    .update({ avatar_path: storagePath })
    .eq("id", user.id);

  if (dbError) return { error: dbError.message };

  revalidatePath("/admin/perfil");
  revalidatePath("/perfil");
  return { success: true };
}

export async function getAvatarUrl(avatarPath: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("avatars")
    .createSignedUrl(avatarPath, 60 * 60);
  return data?.signedUrl ?? null;
}
