import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RequestDetail } from "@/components/request-detail";

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("requests")
    .select(
      "*, clients(name), request_types(name)"
    )
    .eq("id", id)
    .single();

  if (!request) notFound();

  const { data: attachments } = await supabase
    .from("request_attachments")
    .select("id, filename, storage_path, created_at, uploaded_by")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const { data: comments } = await supabase
    .from("request_comments")
    .select("id, body, created_at, author_id, profiles(full_name, role)")
    .eq("request_id", id)
    .order("created_at", { ascending: true });

  const { data: history } = await supabase
    .from("request_status_history")
    .select("id, from_status, to_status, changed_at")
    .eq("request_id", id)
    .order("changed_at", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <RequestDetail
      request={{
        ...request,
        client_name:
          (request.clients as unknown as { name: string } | null)?.name ?? null,
        type_name:
          (request.request_types as unknown as { name: string } | null)?.name ??
          null,
      }}
      attachments={attachments ?? []}
      comments={
        comments?.map((c) => ({
          ...c,
          author_name:
            (c.profiles as unknown as { full_name: string; role: string } | null)
              ?.full_name ?? "Usuário",
          author_role:
            (c.profiles as unknown as { full_name: string; role: string } | null)
              ?.role ?? "client",
        })) ?? []
      }
      history={history ?? []}
      currentUserId={user?.id ?? ""}
      isAdmin
    />
  );
}
