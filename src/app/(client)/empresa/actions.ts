"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateCompanyInfo(formData: FormData) {
  const cnpj = (formData.get("cnpj") as string)?.trim() || null;
  const razaoSocial = (formData.get("razao_social") as string)?.trim() || null;
  const nomeFantasia = (formData.get("nome_fantasia") as string)?.trim() || null;
  const endereco = (formData.get("endereco") as string)?.trim() || null;
  const inscricaoEstadual = (formData.get("inscricao_estadual") as string)?.trim() || null;
  const inscricaoMunicipal = (formData.get("inscricao_municipal") as string)?.trim() || null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.rpc("update_my_company_info", {
    p_cnpj: cnpj,
    p_razao_social: razaoSocial,
    p_nome_fantasia: nomeFantasia,
    p_endereco: endereco,
    p_inscricao_estadual: inscricaoEstadual,
    p_inscricao_municipal: inscricaoMunicipal,
  });

  if (error) return { error: error.message };

  revalidatePath("/empresa");
  return { success: true };
}
