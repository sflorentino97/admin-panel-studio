import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_path")
    .eq("id", user.id)
    .single();

  const role = profile?.role;
  if (role !== "admin" && role !== "member") redirect("/");

  const overdueThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const [avatarResult, statusesResult] = await Promise.all([
    profile?.avatar_path
      ? supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 60 * 60)
      : Promise.resolve({ data: null }),
    supabase.from("request_statuses").select("id, category").eq("is_active", true),
  ]);

  const avatarUrl = avatarResult.data?.signedUrl ?? null;
  const activeIds = (statusesResult.data ?? [])
    .filter(s => s.category === "active" || s.category === "review")
    .map(s => s.id);

  let overdueCount = 0;
  if (activeIds.length > 0) {
    const { count } = await supabase.from("requests")
      .select("*", { count: "exact", head: true })
      .in("status_id", activeIds)
      .not("started_at", "is", null)
      .lt("started_at", overdueThreshold);
    overdueCount = count ?? 0;
  }

  return (
    <div className="min-h-dvh bg-[#f8f8f8]">
      <Sidebar
        userName={profile?.full_name ?? user.email ?? "Admin"}
        role={role}
        avatarUrl={avatarUrl}
        overdueCount={overdueCount}
      />
      <main className="lg:pl-[248px]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
