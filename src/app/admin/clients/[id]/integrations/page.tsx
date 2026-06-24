import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { IntegrationManager } from "./integration-form";

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: integrations }, { data: statuses }] =
    await Promise.all([
      supabase.from("clients").select("id, name").eq("id", id).single(),
      supabase
        .from("client_integrations")
        .select("*")
        .eq("client_id", id)
        .order("created_at"),
      supabase
        .from("request_statuses")
        .select("id, name, category, color, position")
        .eq("is_active", true)
        .order("position"),
    ]);

  if (!client) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <div className="flex items-center gap-3 text-[13px] text-gray-500">
        <Link
          href={`/admin/clients/${id}`}
          className="transition-colors hover:text-gray-700"
        >
          {client.name}
        </Link>
        <svg
          className="h-3.5 w-3.5 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
        <span className="font-medium text-gray-900">Integrações</span>
      </div>

      <div className="mt-4">
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900">
          Integrações
        </h1>
        <p className="mt-0.5 text-[13px] text-gray-500">
          Conecte o sistema de gestão do cliente para sync bidirecional de
          tarefas
        </p>
      </div>

      <IntegrationManager
        clientId={id}
        integrations={
          (integrations ?? []).map((i) => ({
            id: i.id,
            platform: i.platform,
            access_token: i.access_token,
            external_resource_id: i.external_resource_id,
            status_mapping: i.status_mapping as {
              outbound: Record<string, string>;
              inbound: Record<string, string>;
            },
            sync_enabled: i.sync_enabled,
            last_synced_at: i.last_synced_at,
            config: i.config as Record<string, string>,
            webhook_secret: i.webhook_secret,
          }))
        }
        statuses={statuses ?? []}
        baseUrl={baseUrl}
      />
    </div>
  );
}
