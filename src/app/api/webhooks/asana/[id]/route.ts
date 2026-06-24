import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleWebhookEvent } from "@/lib/integrations/sync";
import type { Integration } from "@/lib/integrations/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Asana webhook handshake
  const hookSecret = request.headers.get("x-hook-secret");
  if (hookSecret) {
    return new NextResponse(null, {
      status: 200,
      headers: { "X-Hook-Secret": hookSecret },
    });
  }

  const body = await request.json();

  const supabase = createAdminClient();
  const { data: integration } = await supabase
    .from("client_integrations")
    .select("*")
    .eq("id", id)
    .eq("platform", "asana")
    .eq("sync_enabled", true)
    .single();

  if (!integration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await handleWebhookEvent(
    supabase,
    integration as unknown as Integration,
    body
  );

  return NextResponse.json(result);
}
