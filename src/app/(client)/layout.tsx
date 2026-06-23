import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";

export default async function ClientLayout({
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
    .select("role, full_name, client_id, avatar_path")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin" || profile?.role === "member") redirect("/admin");

  let avatarUrl: string | null = null;
  if (profile?.avatar_path) {
    const { data } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_path, 60 * 60);
    avatarUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="min-h-dvh bg-[#f8f8f8]">
      <Sidebar
        userName={profile?.full_name ?? user.email ?? "Cliente"}
        role="client"
        avatarUrl={avatarUrl}
      />
      <main className="lg:pl-[248px]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
