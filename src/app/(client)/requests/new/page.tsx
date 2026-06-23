"use client";

import { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { REQUEST_FORMATS } from "@/lib/formats";
import { CustomFieldsRenderer } from "@/components/custom-fields-renderer";
import { submitRequest, type ActionState } from "./actions";
import { createClient } from "@/lib/supabase/client";

type CustomField = {
  id: string;
  key: string;
  label: string;
  field_type: string;
  options: string[] | null;
  is_required: boolean;
};

export default function NewRequestPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    submitRequest,
    null
  );
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("custom_field_definitions")
      .select("id, key, label, field_type, options, is_required")
      .eq("is_active", true)
      .order("position")
      .then(({ data }) => setCustomFields(data ?? []));
  }, []);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <Breadcrumbs items={[
        { label: "Painel", href: "/" },
        { label: "Novo Pedido" },
      ]} />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-light text-brand">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Novo Pedido</h1>
          <p className="text-[13px] text-gray-500">Descreva o que você precisa</p>
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

        {/* Informações básicas */}
        <fieldset className="rounded-xl border border-gray-200/80 bg-white p-5">
          <legend className="px-2 text-[13px] font-semibold text-gray-900">Informações básicas</legend>
          <div className="mt-1 space-y-4">
            <div>
              <label htmlFor="title" className="block text-[13px] font-medium text-gray-600">Título <span className="text-red-400">*</span></label>
              <input id="title" name="title" type="text" required placeholder="Ex: Banner para campanha de julho" className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
            </div>
            <div>
              <label htmlFor="description" className="block text-[13px] font-medium text-gray-600">Descrição</label>
              <textarea id="description" name="description" rows={3} placeholder="Descreva o que você precisa..." className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] leading-relaxed transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
            </div>
          </div>
        </fieldset>

        {/* Formato */}
        <fieldset className="rounded-xl border border-gray-200/80 bg-white p-5">
          <legend className="px-2 text-[13px] font-semibold text-gray-900">Formato</legend>
          <p className="text-[12px] text-gray-400 mb-3">Selecione os formatos necessários</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {REQUEST_FORMATS.map((format) => (
              <label
                key={format}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200/80 px-3 py-2.5 text-[13px] transition-all duration-150 hover:border-gray-300 hover:bg-gray-50/50 has-[:checked]:border-brand/30 has-[:checked]:bg-brand-light/50 has-[:checked]:text-brand active:scale-[0.98]"
              >
                <input type="checkbox" name="formats" value={format} className="h-3.5 w-3.5 rounded border-gray-300 text-brand transition-colors focus:ring-brand/30 focus:ring-offset-0" />
                <span className="text-[12px] font-medium leading-none">{format}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Links e informações */}
        <fieldset className="rounded-xl border border-gray-200/80 bg-white p-5">
          <legend className="px-2 text-[13px] font-semibold text-gray-900">Links e informações</legend>
          <div className="mt-1 space-y-4">
            <div>
              <label htmlFor="drive_link" className="block text-[13px] font-medium text-gray-600">Material finalizado (link Drive)</label>
              <div className="relative mt-1.5">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-6.514a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <input id="drive_link" name="drive_link" type="url" placeholder="https://drive.google.com/..." className="block w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-[13px] transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
              </div>
            </div>
            <div>
              <label htmlFor="extra_info" className="block text-[13px] font-medium text-gray-600">Informações complementares</label>
              <textarea id="extra_info" name="extra_info" rows={3} placeholder="Caso haja informações adicionais..." className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] leading-relaxed transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
            </div>
          </div>
        </fieldset>

        <CustomFieldsRenderer fields={customFields} />

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover hover:shadow active:bg-brand-active active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            {pending ? "Enviando..." : "Enviar Pedido"}
          </button>
          <Link href="/" className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
