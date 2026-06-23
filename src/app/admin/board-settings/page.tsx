import { requireAdmin } from "@/lib/auth-guard";
import { BoardSettingsView } from "./board-settings-view";

export default async function BoardSettingsPage() {
  const { supabase } = await requireAdmin();

  const { data: statuses } = await supabase
    .from("request_statuses")
    .select("*")
    .order("position");

  return <BoardSettingsView statuses={statuses ?? []} />;
}
