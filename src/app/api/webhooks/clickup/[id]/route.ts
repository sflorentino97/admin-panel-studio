import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleWebhookEvent } from "@/lib/integrations/sync";
import type { Integration } from "@/lib/integrations/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.text();

  const supabase = createAdminClient();
  const { data: integration } = await supabase
    .from("client_integrations")
    .select("*")
    .eq("id", id)
    .eq("platform", "clickup")
    .eq("sync_enabled", true)
    .single();

  if (!integration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const signature = request.headers.get("x-signature");
  if (integration.webhook_secret && signature) {
    const expected = crypto
      .createHmac("sha256", integration.webhook_secret)
      .update(body)
      .digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const parsed = JSON.parse(body);
  const result = await handleWebhookEvent(
    supabase,
    integration as unknown as Integration,
    parsed
  );

  return NextResponse.json(result);
}
