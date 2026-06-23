import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestDetail } from "@/components/request-detail";

export default async function ClientRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [requestResult, attachmentsResult, commentsResult, historyResult, statusesResult, userResult] = await Promise.all([
    supabase.from("requests")
      .select("*, request_types(name), request_statuses(id, name, color, category)")
      .eq("id", id).single(),
    supabase.from("request_attachments")
      .select("id, filename, storage_path, created_at, uploaded_by")
      .eq("request_id", id).order("created_at", { ascending: true }),
    supabase.from("request_comments")
      .select("id, body, created_at, author_id, profiles(full_name, role)")
      .eq("request_id", id).order("created_at", { ascending: true }),
    supabase.from("request_status_history")
      .select("id, to_status_id, from_status_id, changed_at")
      .eq("request_id", id).order("changed_at", { ascending: true }),
    supabase.from("request_statuses")
      .select("id, name, color, category").order("position"),
    supabase.auth.getUser(),
  ]);

  const request = requestResult.data;
  if (!request) notFound();

  const st = request.request_statuses as unknown as { id: string; name: string; color: string; category: string } | null;
  const statusMap = new Map((statusesResult.data ?? []).map(s => [s.id, s]));

  return (
    <RequestDetail
      request={{
        ...request,
        status_name: st?.name ?? "—",
        status_color: st?.color ?? "#9ca3af",
        status_category: st?.category ?? "backlog",
        client_name: null,
        type_name: (request.request_types as unknown as { name: string } | null)?.name ?? null,
      }}
      attachments={attachmentsResult.data ?? []}
      comments={
        commentsResult.data?.map((c) => ({
          ...c,
          author_name: (c.profiles as unknown as { full_name: string; role: string } | null)?.full_name ?? "Usuário",
          author_role: (c.profiles as unknown as { full_name: string; role: string } | null)?.role ?? "client",
        })) ?? []
      }
      history={(historyResult.data ?? []).map(h => ({
        id: h.id,
        changed_at: h.changed_at,
        from_status_name: h.from_status_id ? statusMap.get(h.from_status_id)?.name ?? null : null,
        from_status_color: h.from_status_id ? statusMap.get(h.from_status_id)?.color ?? "#9ca3af" : null,
        to_status_name: statusMap.get(h.to_status_id)?.name ?? "—",
        to_status_color: statusMap.get(h.to_status_id)?.color ?? "#9ca3af",
      }))}
      currentUserId={userResult.data.user?.id ?? ""}
      isAdmin={false}
    />
  );
}
