import { createClient } from "@/lib/supabase/server";
import { ProjectsView } from "./projects-view";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  if (!profile?.client_id) return null;

  const { data: projects } = await supabase
    .from("client_projects")
    .select("*")
    .eq("client_id", profile.client_id)
    .order("created_at", { ascending: false });

  return <ProjectsView projects={projects ?? []} />;
}
