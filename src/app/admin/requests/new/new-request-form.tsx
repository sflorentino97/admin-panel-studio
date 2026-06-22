"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { REQUEST_FORMATS } from "@/lib/formats";
import { createRequest, type ActionState } from "../actions";

export function NewRequestForm({
  clients,
  types,
}: {
  clients: { id: string; name: string }[];
  types: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createRequest,
    null
  );

  return (
    <>
      <Breadcrumbs items={[
        { label: "Demandas", href: "/admin/requests" },
        { label: "Nova Demanda" },
      ]} />

      <h1 className="text-xl font-bold text-gray-900">Nova Demanda</h1>

      <form action={formAction} className="mt-6 space-y-6">
        {state?.error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {state.error}
          </div>
        )}

        {/* Seção: Informações básicas */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <legend className="px-2 text-sm font-semibold text-gray-700">Informações básicas</legend>
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-600">Cliente *</label>
              <select id="client_id" name="client_id" required className="mt-1.5 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="">Selecione...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {types.length > 0 && (
              <div>
                <label htmlFor="type_id" className="block text-sm font-medium text-gray-600">Tipo</label>
                <select id="type_id" name="type_id" className="mt-1.5 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                  <option value="">Nenhum</option>
                  {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-600">Título *</label>
              <input id="title" name="title" type="text" required placeholder="Ex: Criar banner para campanha de julho" className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-600">Prioridade</label>
              <select id="priority" name="priority" className="mt-1.5 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option value="0">Normal</option>
                <option value="1">Média</option>
                <option value="2">Alta</option>
                <option value="3">Urgente</option>
              </select>
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-600">Prazo</label>
              <input id="due_date" name="due_date" type="date" className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-600">Descrição</label>
              <textarea id="description" name="description" rows={3} placeholder="Descreva os detalhes da demanda..." className="mt-1.5 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
        </fieldset>

        {/* Seção: Formato */}
        <fieldset className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <legend className="px-2 text-sm font-semibold text-gray-700">Formato</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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

        {/* Seção: Links e informações */}
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
            {pending ? "Criando..." : "Criar Demanda"}
          </button>
          <Link href="/admin/requests" className="rounded-md px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
