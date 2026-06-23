import { createClient } from "@/lib/supabase/server";
import { AdminRequestsView } from "./requests-view";

export default async function RequestsPage() {
  const supabase = await createClient();

  const [{ data: requests }, { data: clients }, { data: statuses }, { data: requestTypes }, { data: teamMembers }, { data: { user } }] = await Promise.all([
    supabase
      .from("requests")
      .select("id, title, status_id, priority, due_date, created_at, started_at, completed_at, client_id, assigned_to, clients(name), request_types(name), request_statuses(id, name, category, color, position), assigned_profile:profiles!assigned_to(full_name)")
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
    supabase
      .from("request_types")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "member"])
      .order("full_name"),
    supabase.auth.getUser(),
  ]);

  const mapped =
    requests?.map((r) => {
      const st = r.request_statuses as unknown as { id: string; name: string; category: string; color: string; position: number } | null;
      const assignedProfile = r.assigned_profile as unknown as { full_name: string } | null;
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
        assigned_to: r.assigned_to,
        assigned_to_name: assignedProfile?.full_name ?? null,
      };
    }) ?? [];

  return (
    <AdminRequestsView
      requests={mapped}
      clients={clients ?? []}
      statuses={statuses ?? []}
      requestTypes={requestTypes ?? []}
      teamMembers={teamMembers ?? []}
      currentUserId={user?.id ?? ""}
    />
  );
}
