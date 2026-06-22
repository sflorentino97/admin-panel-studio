"use client";

import { createClient } from "@/lib/supabase/client";

export function ClientNav({ userName }: { userName: string }) {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <span className="text-lg font-bold text-gray-900">Studio</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{userName}</span>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
