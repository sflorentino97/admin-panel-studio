import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientEditForm } from "./client-edit-form";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: linkedProfile } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("client_id", id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
      {linkedProfile && (
        <p className="mt-1 text-sm text-gray-500">
          Usuário vinculado: {linkedProfile.full_name ?? linkedProfile.id}
        </p>
      )}
      <ClientEditForm client={client} />
    </div>
  );
}
