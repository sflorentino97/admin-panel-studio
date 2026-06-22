import { createClient } from "@/lib/supabase/server";
import { AdminRequestsView } from "./requests-view";

export default async function RequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("requests")
    .select(
      "id, title, status, priority, created_at, started_at, completed_at, client_id, clients(name)"
    )
    .order("created_at", { ascending: false });

  const mapped =
    requests?.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      priority: r.priority,
      created_at: r.created_at,
      started_at: r.started_at,
      completed_at: r.completed_at,
      client_name:
        (r.clients as unknown as { name: string } | null)?.name ?? undefined,
    })) ?? [];

  return <AdminRequestsView requests={mapped} />;
}
