"use client";

import { useState } from "react";
import Link from "next/link";
import { KanbanBoard, type KanbanRequest } from "@/components/kanban-board";
import { getMyContractUrl } from "./actions";

type ClientInfo = {
  name: string;
  billing_day: number | null;
  monthly_request_limit: number;
  contract_path: string | null;
} | null;

const statusLabels: Record<string, { label: string; color: string }> = {
  queued: { label: "Na fila", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-700" },
  in_review: { label: "Em revisão", color: "bg-yellow-100 text-yellow-700" },
  done: { label: "Concluído", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export function ClientDashboardView({
  client,
  requests,
  usedThisMonth,
}: {
  client: ClientInfo;
  requests: KanbanRequest[];
  usedThisMonth: number;
}) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const activeRequest = requests.find((r) => r.status === "in_progress");
  const limit = client?.monthly_request_limit ?? 1;
  const canCreate = usedThisMonth < limit;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Olá{client ? `, ${client.name}` : ""}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">Bem-vindo ao seu painel</p>
        </div>
        <Link
          href="/requests/new"
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors ${
            canCreate
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Pedido
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Active request */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-500">Pedido ativo</p>
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-gray-900">
            {activeRequest ? activeRequest.title : "Nenhum"}
          </p>
        </div>

        {/* Monthly usage */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-500">Uso mensal</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {usedThisMonth} / {limit} pedido{limit !== 1 ? "s" : ""}
          </p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${
                usedThisMonth >= limit ? "bg-red-500" : "bg-blue-500"
              }`}
              style={{ width: `${Math.min((usedThisMonth / limit) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Billing */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-500">Cobrança</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-gray-900">
            {client?.billing_day ? `Dia ${client.billing_day}` : "Não definido"}
          </p>
        </div>

        {/* Contract */}
        <ContractCard hasContract={!!client?.contract_path} />
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Seus pedidos</h2>
          <div className="flex items-center gap-0.5 rounded-md border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setView("kanban")}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "kanban"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                view === "list"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Lista
            </button>
          </div>
        </div>

        {requests.length > 0 ? (
          <div className="mt-4">
            {view === "kanban" ? (
              <KanbanBoard requests={requests} readOnly linkPrefix="/requests" />
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Título</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Criado em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {requests.map((req) => {
                        const cfg = statusLabels[req.status] ?? {
                          label: req.status,
                          color: "bg-gray-100 text-gray-700",
                        };
                        return (
                          <tr key={req.id} className="transition-colors hover:bg-gray-50">
                            <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                              <Link
                                href={`/requests/${req.id}`}
                                className="text-gray-900 hover:text-blue-600 transition-colors"
                              >
                                {req.title}
                              </Link>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                              {new Date(req.created_at).toLocaleDateString("pt-BR")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white py-12">
            <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">Nenhum pedido encontrado.</p>
            <Link
              href="/requests/new"
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Criar seu primeiro pedido
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function ContractCard({ hasContract }: { hasContract: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    const url = await getMyContractUrl();
    setLoading(false);
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-xs font-medium text-gray-500">Contrato</p>
      </div>
      {hasContract ? (
        <button
          onClick={handleDownload}
          disabled={loading}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-800 disabled:opacity-50"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {loading ? "Gerando link..." : "Baixar contrato"}
        </button>
      ) : (
        <p className="mt-2 text-sm text-gray-400">Não disponível</p>
      )}
    </div>
  );
}
