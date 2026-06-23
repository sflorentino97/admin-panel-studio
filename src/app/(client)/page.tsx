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

  const [clientResult, requestsResult, statusesResult] = await Promise.all([
    clientId
      ? supabase.from("clients").select("name, billing_day, contract_path").eq("id", clientId).single()
      : { data: null },
    clientId
      ? supabase.from("requests")
          .select("id, title, status_id, priority, due_date, created_at, started_at, completed_at, request_types(name), request_statuses(id, name, category, color)")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
      : { data: null },
    supabase.from("request_statuses").select("id, name, category, color, position, wip_limit, is_active").eq("is_active", true).order("position"),
  ]);

  const mappedRequests = requestsResult.data?.map((r) => {
    const st = r.request_statuses as unknown as { id: string; name: string; category: string; color: string } | null;
    return {
      ...r,
      status_name: st?.name ?? "—",
      status_color: st?.color ?? "#9ca3af",
      status_category: st?.category ?? "backlog",
      type_name: (r.request_types as unknown as { name: string } | null)?.name ?? undefined,
    };
  }) ?? [];

  return (
    <ClientDashboardView
      client={clientResult.data}
      requests={mappedRequests}
      statuses={statusesResult.data ?? []}
    />
  );
}
