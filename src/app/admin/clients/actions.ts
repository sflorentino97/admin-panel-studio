"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionState = { error?: string } | null;

export async function createClientWithUser(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || null;
  const billingDay = formData.get("billing_day")
    ? Number(formData.get("billing_day"))
    : null;
  const monthlyLimit = Number(formData.get("monthly_request_limit")) || 1;
  const notes = (formData.get("notes") as string) || null;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Nome, e-mail e senha são obrigatórios." };
  }
  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
  }
  if (billingDay !== null && (billingDay < 1 || billingDay > 31)) {
    return { error: "Dia de cobrança deve ser entre 1 e 31." };
  }

  // Verificar que o caller é admin
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

  // 1. Inserir client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name,
      email,
      phone,
      billing_day: billingDay,
      monthly_request_limit: monthlyLimit,
      notes,
    })
    .select("id")
    .single();

  if (clientError) {
    return { error: `Erro ao criar cliente: ${clientError.message}` };
  }

  const adminSupabase = createAdminClient();

  // 2. Criar auth user
  const { data: authData, error: authError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

  if (authError) {
    // Rollback: deletar client
    await supabase.from("clients").delete().eq("id", client.id);
    const msg =
      authError.message === "A user with this email address has already been registered"
        ? "Já existe um usuário com este e-mail."
        : authError.message;
    return { error: msg };
  }

  // 3. Vincular profile ao client
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .update({ client_id: client.id })
    .eq("id", authData.user.id);

  if (profileError) {
    // Rollback: deletar auth user + client
    await adminSupabase.auth.admin.deleteUser(authData.user.id);
    await supabase.from("clients").delete().eq("id", client.id);
    return { error: `Erro ao vincular perfil: ${profileError.message}` };
  }

  revalidatePath("/admin/clients");
  redirect("/admin/clients");
}

export async function updateClient(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const clientId = formData.get("client_id") as string;
  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;
  const billingDay = formData.get("billing_day")
    ? Number(formData.get("billing_day"))
    : null;
  const monthlyLimit = Number(formData.get("monthly_request_limit")) || 1;
  const notes = (formData.get("notes") as string) || null;
  const isActive = formData.get("is_active") === "on";
  const planName = (formData.get("plan_name") as string) || null;
  const monthlyAmountRaw = formData.get("monthly_amount") as string;
  const monthlyAmount = monthlyAmountRaw ? parseFloat(monthlyAmountRaw) : null;

  if (!clientId || !name) {
    return { error: "ID e nome são obrigatórios." };
  }
  if (billingDay !== null && (billingDay < 1 || billingDay > 31)) {
    return { error: "Dia de cobrança deve ser entre 1 e 31." };
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

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      phone,
      billing_day: billingDay,
      monthly_request_limit: monthlyLimit,
      notes,
      is_active: isActive,
      plan_name: planName,
      monthly_amount: monthlyAmount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (error) {
    return { error: `Erro ao atualizar: ${error.message}` };
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/clients/${clientId}`);
}

export async function uploadContract(clientId: string, formData: FormData) {
  const file = formData.get("file") as File | null;
  if (!file) return { error: "Nenhum arquivo selecionado." };

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

  const ext = file.name.split(".").pop() ?? "pdf";
  const storagePath = `${clientId}/contrato.${ext}`;

  // Sobrescrever se já existir
  await supabase.storage.from("contracts").remove([storagePath]);

  const { error: uploadError } = await supabase.storage
    .from("contracts")
    .upload(storagePath, file);

  if (uploadError) return { error: `Erro no upload: ${uploadError.message}` };

  const { error: dbError } = await supabase
    .from("clients")
    .update({ contract_path: storagePath, updated_at: new Date().toISOString() })
    .eq("id", clientId);

  if (dbError) return { error: dbError.message };

  revalidatePath(`/admin/clients/${clientId}`);
  return {};
}

export async function getContractUrl(storagePath: string) {
  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("contracts")
    .createSignedUrl(storagePath, 60 * 5);
  return data?.signedUrl ?? null;
}
