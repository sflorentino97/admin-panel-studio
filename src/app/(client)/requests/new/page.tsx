"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { REQUEST_FORMATS } from "@/lib/formats";
import { submitRequest, type ActionState } from "./actions";

export default function NewRequestPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    submitRequest,
    null
  );

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs items={[
        { label: "Painel", href: "/" },
        { label: "Novo Pedido" },
      ]} />

      <h1 className="text-xl font-bold text-gray-900">Novo Pedido</h1>

      <form action={formAction} className="mt-6 space-y-6">
        {state?.error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {state.error}
          </div>
        )}

        {/* Informações básicas */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <legend className="px-2 text-sm font-semibold text-gray-700">Informações básicas</legend>
          <div className="mt-2 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-600">Título *</label>
              <input id="title" name="title" type="text" required placeholder="Ex: Banner para campanha de julho" className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-600">Descrição</label>
              <textarea id="description" name="description" rows={4} placeholder="Descreva o que você precisa..." className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        </fieldset>

        {/* Formato */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <legend className="px-2 text-sm font-semibold text-gray-700">Formato</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {REQUEST_FORMATS.map((format) => (
              <label
                key={format}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm transition-colors hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 has-[:checked]:text-blue-700"
              >
                <input type="checkbox" name="formats" value={format} className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs font-medium">{format}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Links e informações */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <legend className="px-2 text-sm font-semibold text-gray-700">Links e informações</legend>
          <div className="mt-2 space-y-4">
            <div>
              <label htmlFor="drive_link" className="block text-sm font-medium text-gray-600">Material finalizado (link Drive)</label>
              <input id="drive_link" name="drive_link" type="url" placeholder="https://drive.google.com/..." className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="extra_info" className="block text-sm font-medium text-gray-600">Informações complementares</label>
              <textarea id="extra_info" name="extra_info" rows={3} placeholder="Caso haja informações adicionais..." className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {pending && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {pending ? "Enviando..." : "Enviar Pedido"}
          </button>
          <Link href="/" className="rounded-md px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
