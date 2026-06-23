"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateClient, uploadContract, getContractUrl, type ActionState } from "../actions";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  billing_day: number | null;
  monthly_request_limit: number;
  is_active: boolean;
  notes: string | null;
  contract_path: string | null;
  plan_name: string | null;
  monthly_amount: number | null;
};

export function ClientEditForm({ client }: { client: Client }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateClient,
    null
  );

  return (
  <>
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="client_id" value={client.id} />

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
              defaultValue={client.name}
              className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-gray-600">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={client.email}
              disabled
              className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] text-gray-500"
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
              defaultValue={client.phone ?? ""}
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
              defaultValue={client.billing_day ?? ""}
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
              defaultValue={client.monthly_request_limit}
              className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div>
            <label htmlFor="plan_name" className="block text-[13px] font-medium text-gray-600">
              Plano
            </label>
            <input
              id="plan_name"
              name="plan_name"
              type="text"
              defaultValue={client.plan_name ?? ""}
              placeholder="Ex: Básico, Premium"
              className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div>
            <label htmlFor="monthly_amount" className="block text-[13px] font-medium text-gray-600">
              Valor mensal (R$)
            </label>
            <input
              id="monthly_amount"
              name="monthly_amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={client.monthly_amount ?? ""}
              placeholder="0,00"
              className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-6">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              defaultChecked={client.is_active}
              className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30"
            />
            <label htmlFor="is_active" className="text-[13px] font-medium text-gray-700">
              Cliente ativo
            </label>
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-xl border border-gray-200/80 bg-white p-5">
        <legend className="px-2 text-[13px] font-semibold text-gray-900">Observações</legend>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={client.notes ?? ""}
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
          {pending ? "Salvando..." : "Salvar Alterações"}
        </button>
        <Link
          href="/admin/clients"
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
        >
          Voltar
        </Link>
      </div>
    </form>

    <ContractSection clientId={client.id} contractPath={client.contract_path} />
  </>
  );
}

function ContractSection({ clientId, contractPath }: { clientId: string; contractPath: string | null }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(contractPath);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setUploading(true);
    const formData = new FormData(e.currentTarget);
    const result = await uploadContract(clientId, formData);
    setUploading(false);
    if (result.error) {
      setError(result.error);
    } else {
      const file = formData.get("file") as File;
      const ext = file.name.split(".").pop() ?? "pdf";
      setCurrentPath(`${clientId}/contrato.${ext}`);
    }
  }

  async function handleDownload() {
    if (!currentPath) return;
    const url = await getContractUrl(currentPath);
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="mt-8 rounded-xl border border-gray-200/80 bg-white p-5">
      <h2 className="text-[15px] font-semibold text-gray-900">Contrato</h2>

      {currentPath && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-[13px] text-gray-600">Contrato enviado</span>
          <button
            type="button"
            onClick={handleDownload}
            className="text-[13px] font-medium text-brand hover:text-brand-hover transition-colors"
          >
            Baixar
          </button>
        </div>
      )}

      <form onSubmit={handleUpload} className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="contract-file" className="block text-[13px] font-medium text-gray-600">
            {currentPath ? "Substituir contrato" : "Enviar contrato"}
          </label>
          <input
            id="contract-file"
            name="file"
            type="file"
            accept=".pdf,.doc,.docx"
            required
            className="mt-1.5 block w-full text-[13px] text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-light file:px-3 file:py-2 file:text-[13px] file:font-medium file:text-brand hover:file:bg-brand-50"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-hover active:bg-brand-active disabled:opacity-50"
        >
          {uploading ? "Enviando..." : "Enviar"}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-2 text-[13px] text-red-600">{error}</p>
      )}
    </div>
  );
}
