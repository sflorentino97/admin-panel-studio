"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addComment(requestId: string, body: string) {
  if (!body.trim()) return { error: "Comentário vazio." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.from("request_comments").insert({
    request_id: requestId,
    author_id: user.id,
    body: body.trim(),
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath(`/requests/${requestId}`);
  return {};
}

export async function uploadAttachment(requestId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "Nenhum arquivo selecionado." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const ext = file.name.split(".").pop() ?? "";
  const storagePath = `${requestId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(storagePath, file);

  if (uploadError) return { error: `Erro no upload: ${uploadError.message}` };

  const { error: dbError } = await supabase
    .from("request_attachments")
    .insert({
      request_id: requestId,
      storage_path: storagePath,
      filename: file.name,
      uploaded_by: user.id,
    });

  if (dbError) return { error: dbError.message };

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath(`/requests/${requestId}`);
  return {};
}

export async function getAttachmentUrl(storagePath: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("attachments")
    .createSignedUrl(storagePath, 60 * 5);

  return data?.signedUrl ?? null;
}
