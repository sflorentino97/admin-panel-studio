"use client";

import { useState, useTransition } from "react";
import { updateCompanyInfo } from "./actions";

type Company = {
  id: string;
  name: string;
  cnpj: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  endereco: string | null;
  inscricao_estadual: string | null;
  inscricao_municipal: string | null;
};

export function CompanyView({ company }: { company: Company }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateCompanyInfo(formData);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Dados atualizados com sucesso." });
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Minha Empresa</h1>
      <p className="mt-0.5 text-[13px] text-gray-500">Cadastre os dados da sua empresa</p>

      {message && (
        <div className={`mt-4 flex items-center gap-2 rounded-xl px-4 py-3 text-[13px] ${
          message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
        }`}>
          {message.type === "success" ? (
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <fieldset className="rounded-xl border border-gray-200/80 bg-white p-5">
          <legend className="px-2 text-[13px] font-semibold text-gray-900">Dados fiscais</legend>
          <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cnpj" className="block text-[13px] font-medium text-gray-600">CNPJ</label>
              <input
                id="cnpj"
                name="cnpj"
                type="text"
                defaultValue={company.cnpj ?? ""}
                placeholder="00.000.000/0000-00"
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <label htmlFor="razao_social" className="block text-[13px] font-medium text-gray-600">Razão Social</label>
              <input
                id="razao_social"
                name="razao_social"
                type="text"
                defaultValue={company.razao_social ?? ""}
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <label htmlFor="nome_fantasia" className="block text-[13px] font-medium text-gray-600">Nome Fantasia</label>
              <input
                id="nome_fantasia"
                name="nome_fantasia"
                type="text"
                defaultValue={company.nome_fantasia ?? ""}
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <label htmlFor="inscricao_estadual" className="block text-[13px] font-medium text-gray-600">Inscrição Estadual</label>
              <input
                id="inscricao_estadual"
                name="inscricao_estadual"
                type="text"
                defaultValue={company.inscricao_estadual ?? ""}
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>

            <div>
              <label htmlFor="inscricao_municipal" className="block text-[13px] font-medium text-gray-600">Inscrição Municipal</label>
              <input
                id="inscricao_municipal"
                name="inscricao_municipal"
                type="text"
                defaultValue={company.inscricao_municipal ?? ""}
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-gray-200/80 bg-white p-5">
          <legend className="px-2 text-[13px] font-semibold text-gray-900">Endereço</legend>
          <div>
            <label htmlFor="endereco" className="block text-[13px] font-medium text-gray-600">Endereço completo</label>
            <textarea
              id="endereco"
              name="endereco"
              rows={2}
              defaultValue={company.endereco ?? ""}
              placeholder="Rua, número, bairro, cidade - UF, CEP"
              className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] leading-relaxed transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
            />
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover hover:shadow active:bg-brand-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
          {isPending ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
