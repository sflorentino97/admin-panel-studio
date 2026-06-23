import { createClient } from "@/lib/supabase/server";
import { ProfileView } from "./profile-view";
import { getAvatarUrl } from "./actions";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, job_title, phone, bio, avatar_path")
    .eq("id", user.id)
    .single();

  const avatarUrl = profile?.avatar_path
    ? await getAvatarUrl(profile.avatar_path)
    : null;

  return (
    <ProfileView
      profile={{
        full_name: profile?.full_name ?? "",
        role: profile?.role ?? "client",
        job_title: profile?.job_title ?? "",
        phone: profile?.phone ?? "",
        bio: profile?.bio ?? "",
        email: user.email ?? "",
      }}
      avatarUrl={avatarUrl}
    />
  );
}
