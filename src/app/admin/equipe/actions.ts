"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ActionState = { error?: string; success?: string } | null;

export async function createTeamMember(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const fullName = formData.get("full_name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!fullName || !email || !password) {
    return { error: "Nome, e-mail e senha são obrigatórios." };
  }
  if (password.length < 6) {
    return { error: "A senha deve ter pelo menos 6 caracteres." };
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

  const adminSupabase = createAdminClient();

  const { data: authData, error: authError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (authError) {
    const msg =
      authError.message ===
      "A user with this email address has already been registered"
        ? "Já existe um usuário com este e-mail."
        : authError.message;
    return { error: msg };
  }

  const { error: profileError } = await adminSupabase
    .from("profiles")
    .update({ role: "member", full_name: fullName })
    .eq("id", authData.user.id);

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(authData.user.id);
    return { error: `Erro ao configurar perfil: ${profileError.message}` };
  }

  revalidatePath("/admin/equipe");
  return { success: `${fullName} adicionado à equipe.` };
}

export async function updateTeamMemberRole(
  memberId: string,
  newRole: "member" | "admin"
): Promise<ActionState> {
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

  if (memberId === user.id) {
    return { error: "Você não pode alterar seu próprio papel." };
  }

  const adminSupabase = createAdminClient();
  const { error } = await adminSupabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", memberId);

  if (error) return { error: error.message };

  revalidatePath("/admin/equipe");
  return { success: "Papel atualizado." };
}

export async function deactivateTeamMember(
  memberId: string
): Promise<ActionState> {
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

  if (memberId === user.id) {
    return { error: "Você não pode desativar sua própria conta." };
  }

  const adminSupabase = createAdminClient();

  const { data: targetProfile } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", memberId)
    .single();

  if (!targetProfile || (targetProfile.role !== "member" && targetProfile.role !== "admin")) {
    return { error: "Este usuário não é um membro da equipe." };
  }

  const { error } = await adminSupabase.auth.admin.updateUserById(memberId, {
    ban_duration: "876600h",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/equipe");
  return { success: "Membro desativado." };
}

export async function reactivateTeamMember(
  memberId: string
): Promise<ActionState> {
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

  const adminSupabase = createAdminClient();

  const { error } = await adminSupabase.auth.admin.updateUserById(memberId, {
    ban_duration: "none",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/equipe");
  return { success: "Membro reativado." };
}
