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

  if (!title) {
    return { error: "O título é obrigatório." };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_request", {
    p_title: title,
    p_description: description,
    p_type_id: null,
  });

  if (error) {
    if (error.message.includes("Limite mensal")) {
      return { error: "Você atingiu o limite mensal de pedidos." };
    }
    return { error: error.message };
  }

  revalidatePath("/");
  redirect("/");
}
