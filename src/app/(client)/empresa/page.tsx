import { createClient } from "@/lib/supabase/server";
import { CompanyView } from "./company-view";

export default async function CompanyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("id, name, cnpj, razao_social, nome_fantasia, endereco, inscricao_estadual, inscricao_municipal")
    .eq("id", profile.client_id)
    .single();

  if (!client) return null;

  return <CompanyView company={client} />;
}
