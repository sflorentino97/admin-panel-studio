import { requireAdmin } from "@/lib/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { EquipeView } from "./equipe-view";

export default async function EquipePage() {
  const { user } = await requireAdmin();
  const adminSupabase = createAdminClient();

  const { data: members } = await adminSupabase
    .from("profiles")
    .select("id, role, full_name, created_at")
    .in("role", ["admin", "member"])
    .order("created_at");

  const { data: { users: authUsers } } = await adminSupabase.auth.admin.listUsers();

  const enrichedMembers = (members ?? []).map((m) => {
    const authUser = authUsers?.find((u) => u.id === m.id);
    return {
      ...m,
      email: authUser?.email ?? "—",
      is_banned: !!authUser?.banned_until && new Date(authUser.banned_until) > new Date(),
    };
  });

  return <EquipeView members={enrichedMembers} currentUserId={user.id} />;
}
