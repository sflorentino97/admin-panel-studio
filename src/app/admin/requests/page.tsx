import { createClient } from "@/lib/supabase/server";
import { AdminRequestsView } from "./requests-view";

export default async function RequestsPage() {
  const supabase = await createClient();

  const [{ data: requests }, { data: clients }, { data: statuses }] = await Promise.all([
    supabase
      .from("requests")
      .select("id, title, status_id, priority, due_date, created_at, started_at, completed_at, client_id, clients(name), request_types(name), request_statuses(id, name, category, color, position)")
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("request_statuses")
      .select("id, name, category, color, position, wip_limit, is_active")
      .eq("is_active", true)
      .order("position"),
  ]);

  const mapped =
    requests?.map((r) => {
      const st = r.request_statuses as unknown as { id: string; name: string; category: string; color: string; position: number } | null;
      return {
        id: r.id,
        title: r.title,
        status_id: r.status_id,
        status_name: st?.name ?? "—",
        status_color: st?.color ?? "#9ca3af",
        status_category: st?.category ?? "backlog",
        priority: r.priority,
        due_date: r.due_date,
        created_at: r.created_at,
        started_at: r.started_at,
        completed_at: r.completed_at,
        client_id: r.client_id,
        client_name: (r.clients as unknown as { name: string } | null)?.name ?? undefined,
        type_name: (r.request_types as unknown as { name: string } | null)?.name ?? undefined,
      };
    }) ?? [];

  return (
    <AdminRequestsView
      requests={mapped}
      clients={clients ?? []}
      statuses={statuses ?? []}
    />
  );
}
