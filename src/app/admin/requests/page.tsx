import { createClient } from "@/lib/supabase/server";
import { AdminRequestsView } from "./requests-view";

export default async function RequestsPage() {
  const supabase = await createClient();

  const [{ data: requests }, { data: clients }] = await Promise.all([
    supabase
      .from("requests")
      .select("id, title, status, priority, due_date, created_at, started_at, completed_at, client_id, clients(name), request_types(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  const mapped =
    requests?.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      priority: r.priority,
      due_date: r.due_date,
      created_at: r.created_at,
      started_at: r.started_at,
      completed_at: r.completed_at,
      client_id: r.client_id,
      client_name: (r.clients as unknown as { name: string } | null)?.name ?? undefined,
      type_name: (r.request_types as unknown as { name: string } | null)?.name ?? undefined,
    })) ?? [];

  return (
    <AdminRequestsView
      requests={mapped}
      clients={clients ?? []}
    />
  );
}
