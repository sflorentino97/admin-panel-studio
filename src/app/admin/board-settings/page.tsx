import { createClient } from "@/lib/supabase/server";
import { BoardSettingsView } from "./board-settings-view";

export default async function BoardSettingsPage() {
  const supabase = await createClient();

  const { data: statuses } = await supabase
    .from("request_statuses")
    .select("*")
    .order("position");

  return <BoardSettingsView statuses={statuses ?? []} />;
}
