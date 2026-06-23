"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg =
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message;
      setError(msg);
      setLoading(false);
      emailRef.current?.focus();
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      window.location.href =
        profile?.role === "admin" || profile?.role === "member"
          ? "/admin"
          : "/";
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-gray-50 to-brand-50/30 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="rounded-xl border border-gray-200/80 bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center">
              <Image src="/logo-dark.svg" alt="Florentino" width={200} height={34} priority />
            </div>
            <p className="mt-3 text-[13px] text-gray-500">Portal de Clientes</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            {error && (
              <div role="alert" className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700 animate-shake">
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-gray-700">
                E-mail
              </label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] shadow-sm transition-all duration-150 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 focus:ring-offset-0"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-gray-700">
                Senha
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-[13px] shadow-sm transition-all duration-150 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 focus:ring-offset-0"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-gray-400 transition-colors hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover active:bg-brand-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Florentino — Portal de Clientes
        </p>
      </div>
    </div>
  );
}
