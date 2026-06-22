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
    .select("role, full_name, client_id")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");

  return (
    <div className="min-h-dvh bg-[#f8f8f8]">
      <Sidebar
        userName={profile?.full_name ?? user.email ?? "Cliente"}
        role="client"
      />
      <main className="lg:pl-[248px]">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
