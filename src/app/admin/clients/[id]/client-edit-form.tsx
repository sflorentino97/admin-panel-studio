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
};

export function ClientEditForm({ client }: { client: Client }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    updateClient,
    null
  );

  return (
  <>
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="client_id" value={client.id} />

      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nome *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={client.name}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={client.email}
            disabled
            className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Telefone
          </label>
          <input
            id="phone"
            name="phone"
            type="text"
            defaultValue={client.phone ?? ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="billing_day" className="block text-sm font-medium text-gray-700">
            Dia de cobrança
          </label>
          <input
            id="billing_day"
            name="billing_day"
            type="number"
            min={1}
            max={31}
            defaultValue={client.billing_day ?? ""}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="monthly_request_limit" className="block text-sm font-medium text-gray-700">
            Limite mensal de pedidos
          </label>
          <input
            id="monthly_request_limit"
            name="monthly_request_limit"
            type="number"
            min={1}
            defaultValue={client.monthly_request_limit}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 pt-6">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked={client.is_active}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Cliente ativo
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Observações
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={client.notes ?? ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar Alterações"}
        </button>
        <Link
          href="/admin/clients"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
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
    <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Contrato</h2>

      {currentPath && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-gray-600">Contrato enviado</span>
          <button
            type="button"
            onClick={handleDownload}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Baixar
          </button>
        </div>
      )}

      <form onSubmit={handleUpload} className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="contract-file" className="block text-sm font-medium text-gray-700">
            {currentPath ? "Substituir contrato" : "Enviar contrato"}
          </label>
          <input
            id="contract-file"
            name="file"
            type="file"
            accept=".pdf,.doc,.docx"
            required
            className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? "Enviando..." : "Enviar"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
