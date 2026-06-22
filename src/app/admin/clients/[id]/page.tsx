import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumbs } from "@/components/breadcrumbs";
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
      <Breadcrumbs items={[
        { label: "Clientes", href: "/admin/clients" },
        { label: client.name },
      ]} />

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          {linkedProfile && (
            <p className="text-sm text-gray-500">
              Usuário: {linkedProfile.full_name ?? linkedProfile.id}
            </p>
          )}
        </div>
      </div>

      <ClientEditForm client={client} />
    </div>
  );
}
