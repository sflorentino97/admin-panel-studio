"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createField(formData: FormData) {
  const key = (formData.get("key") as string).trim();
  const label = (formData.get("label") as string).trim();
  const fieldType = formData.get("field_type") as string;
  const isRequired = formData.get("is_required") === "on";
  const optionsRaw = (formData.get("options") as string || "").trim();

  if (!key || !label || !fieldType) return { error: "Key, label e tipo são obrigatórios." };
  if (!/^[a-z][a-z0-9_]*$/.test(key)) return { error: "Key deve ser snake_case (ex: cor_preferida)." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const options = ["select", "multiselect"].includes(fieldType) && optionsRaw
    ? optionsRaw.split("\n").map(o => o.trim()).filter(Boolean)
    : null;

  const { data: maxPos } = await supabase
    .from("custom_field_definitions")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const { error } = await supabase.from("custom_field_definitions").insert({
    key,
    label,
    field_type: fieldType,
    is_required: isRequired,
    options,
    position: (maxPos?.position ?? -1) + 1,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/form-builder");
  return {};
}

export async function updateField(formData: FormData) {
  const id = formData.get("id") as string;
  const label = (formData.get("label") as string).trim();
  const isRequired = formData.get("is_required") === "on";
  const isActive = formData.get("is_active") !== "off";
  const optionsRaw = (formData.get("options") as string || "").trim();
  const fieldType = formData.get("field_type") as string;

  if (!id || !label) return { error: "ID e label são obrigatórios." };

  const supabase = await createClient();

  const options = ["select", "multiselect"].includes(fieldType) && optionsRaw
    ? optionsRaw.split("\n").map(o => o.trim()).filter(Boolean)
    : null;

  const { error } = await supabase
    .from("custom_field_definitions")
    .update({ label, is_required: isRequired, is_active: isActive, options })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/form-builder");
  return {};
}

export async function deleteField(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("custom_field_definitions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/form-builder");
  return {};
}

export async function reorderFields(orderedIds: string[]) {
  const supabase = await createClient();
  const updates = orderedIds.map((id, i) =>
    supabase.from("custom_field_definitions").update({ position: i }).eq("id", id)
  );
  await Promise.all(updates);
  revalidatePath("/admin/form-builder");
  return {};
}
