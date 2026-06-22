import { createClient } from "@/lib/supabase/server";
import { ClientDashboardView } from "./dashboard-view";

export default async function ClientDashboard() {
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

  const clientId = profile?.client_id;

  const { data: client } = clientId
    ? await supabase
        .from("clients")
        .select("name, billing_day, monthly_request_limit")
        .eq("id", clientId)
        .single()
    : { data: null };

  const { data: requests } = clientId
    ? await supabase
        .from("requests")
        .select("id, title, status, created_at, started_at, completed_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <ClientDashboardView
      client={client}
      requests={requests ?? []}
    />
  );
}
