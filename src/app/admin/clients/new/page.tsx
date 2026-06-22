"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { createClientWithUser, type ActionState } from "../actions";

export default function NewClientPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createClientWithUser,
    null
  );

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <Breadcrumbs items={[
        { label: "Clientes", href: "/admin/clients" },
        { label: "Novo Cliente" },
      ]} />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
          </svg>
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Novo Cliente</h1>
          <p className="text-[13px] text-gray-500">Cadastre um novo cliente no portal</p>
        </div>
      </div>

      <form action={formAction} className="mt-8 space-y-5">
        {state?.error && (
          <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700 animate-shake">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {state.error}
          </div>
        )}

        <fieldset className="rounded-xl border border-gray-200/80 bg-white p-5">
          <legend className="px-2 text-[13px] font-semibold text-gray-900">Dados do cliente</legend>
          <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-[13px] font-medium text-gray-600">
                Nome <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-[13px] font-medium text-gray-600">
                E-mail <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-[13px] font-medium text-gray-600">
                Telefone
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[13px] font-medium text-gray-600">
                Senha inicial <span className="text-red-400">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <label htmlFor="billing_day" className="block text-[13px] font-medium text-gray-600">
                Dia de cobrança
              </label>
              <input
                id="billing_day"
                name="billing_day"
                type="number"
                min={1}
                max={31}
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <label htmlFor="monthly_request_limit" className="block text-[13px] font-medium text-gray-600">
                Limite mensal de pedidos
              </label>
              <input
                id="monthly_request_limit"
                name="monthly_request_limit"
                type="number"
                min={1}
                defaultValue={1}
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-gray-200/80 bg-white p-5">
          <legend className="px-2 text-[13px] font-semibold text-gray-900">Observações</legend>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Notas internas sobre o cliente..."
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] leading-relaxed transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
          />
        </fieldset>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover hover:shadow active:bg-brand-active active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {pending ? "Cadastrando..." : "Cadastrar Cliente"}
          </button>
          <Link
            href="/admin/clients"
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
