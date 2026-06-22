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
        .select("name, billing_day, monthly_request_limit, contract_path")
        .eq("id", clientId)
        .single()
    : { data: null };

  const { data: requests } = clientId
    ? await supabase
        .from("requests")
        .select("id, title, status, priority, due_date, created_at, started_at, completed_at, request_types(name)")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
    : { data: null };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: usedThisMonth } = clientId
    ? await supabase
        .from("requests")
        .select("*", { count: "exact", head: true })
        .eq("client_id", clientId)
        .gte("created_at", monthStart)
    : { count: 0 };

  const mappedRequests = requests?.map((r) => ({
    ...r,
    type_name: (r.request_types as unknown as { name: string } | null)?.name ?? undefined,
  })) ?? [];

  return (
    <ClientDashboardView
      client={client}
      requests={mappedRequests}
      usedThisMonth={usedThisMonth ?? 0}
    />
  );
}
