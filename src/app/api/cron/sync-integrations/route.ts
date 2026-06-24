import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncInbound } from "@/lib/integrations/sync";
import type { Integration } from "@/lib/integrations/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: integrations } = await supabase
    .from("client_integrations")
    .select("*")
    .eq("sync_enabled", true);

  if (!integrations || integrations.length === 0) {
    return NextResponse.json({ message: "No active integrations" });
  }

  const results = [];
  for (const row of integrations) {
    const result = await syncInbound(
      supabase,
      row as unknown as Integration
    );
    results.push({
      integration_id: row.id,
      platform: row.platform,
      ...result,
    });
  }

  return NextResponse.json({ results });
}
