"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/clients", label: "Clientes" },
  { href: "/admin/requests", label: "Demandas" },
];

export function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-gray-900">Studio</span>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium ${
                (link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href))
                  ? "text-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
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
