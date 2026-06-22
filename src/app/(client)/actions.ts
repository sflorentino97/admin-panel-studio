"use server";

import { createClient } from "@/lib/supabase/server";

export async function getMyContractUrl() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("contract_path")
    .eq("id", profile.client_id)
    .single();

  if (!client?.contract_path) return null;

  const { data } = await supabase.storage
    .from("contracts")
    .createSignedUrl(client.contract_path, 60 * 5);

  return data?.signedUrl ?? null;
}
