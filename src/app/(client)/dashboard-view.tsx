"use client";

import { useState } from "react";
import Link from "next/link";
import { KanbanBoard, type KanbanRequest } from "@/components/kanban-board";
import type { RequestStatus } from "@/lib/types";
import { getMyContractUrl } from "./actions";

type ClientInfo = {
  name: string;
  billing_day: number | null;
  contract_path: string | null;
} | null;

export function ClientDashboardView({
  client,
  requests,
  statuses,
}: {
  client: ClientInfo;
  requests: KanbanRequest[];
  statuses: RequestStatus[];
}) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const activeRequest = requests.find((r) => r.status_category === "active");
  const doneCount = requests.filter((r) => r.status_category === "done").length;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">
            Olá{client ? `, ${client.name}` : ""}
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Acompanhe seus pedidos</p>
        </div>
        <Link
          href="/requests/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover hover:shadow active:bg-brand-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Pedido
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200/80 bg-white p-4 transition-shadow duration-150 hover:shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <p className="text-[12px] font-medium text-gray-500">Em andamento</p>
          </div>
          <p className="mt-2 truncate text-[13px] font-semibold text-gray-900">
            {activeRequest ? activeRequest.title : "Nenhum"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-white p-4 transition-shadow duration-150 hover:shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand" />
            <p className="text-[12px] font-medium text-gray-500">Total</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-brand">{requests.length}</p>
        </div>

        <div className="rounded-xl border border-gray-200/80 bg-white p-4 transition-shadow duration-150 hover:shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <p className="text-[12px] font-medium text-gray-500">Concluídos</p>
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-emerald-600">{doneCount}</p>
        </div>

        <ContractCard hasContract={!!client?.contract_path} />
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[15px] font-semibold text-gray-900">Seus pedidos</h2>
          <div className="flex items-center rounded-lg border border-gray-200/80 bg-white p-0.5">
            <button
              onClick={() => setView("kanban")}
              aria-label="Visualização Kanban"
              className={`flex items-center gap-1.5 rounded-md px-3 py-[7px] text-[13px] font-medium transition-all duration-150 ${
                view === "kanban"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
              </svg>
              Kanban
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="Visualização Lista"
              className={`flex items-center gap-1.5 rounded-md px-3 py-[7px] text-[13px] font-medium transition-all duration-150 ${
                view === "list"
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
              Lista
            </button>
          </div>
        </div>

        {requests.length > 0 ? (
          <div className="mt-4">
            {view === "kanban" ? (
              <KanbanBoard requests={requests} statuses={statuses} readOnly linkPrefix="/requests" />
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Título</th>
                        <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Criado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {requests.map((req) => (
                        <tr key={req.id} className="transition-colors duration-150 hover:bg-gray-50/60">
                          <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium">
                            <Link href={`/requests/${req.id}`} className="text-gray-900 hover:text-brand transition-colors">{req.title}</Link>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: req.status_color }} />
                              <span className="text-[12px] font-medium text-gray-600">{req.status_name}</span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[12px] tabular-nums text-gray-400">
                            {new Date(req.created_at).toLocaleDateString("pt-BR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-14">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <p className="mt-3 text-[13px] font-medium text-gray-900">Nenhum pedido</p>
            <p className="mt-1 text-[12px] text-gray-400">Crie seu primeiro pedido para começar</p>
            <Link href="/requests/new" className="mt-3 text-[13px] font-medium text-brand hover:text-brand-hover transition-colors">Criar pedido</Link>
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
    <div className="rounded-xl border border-gray-200/80 bg-white p-4 transition-shadow duration-150 hover:shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-accent" />
        <p className="text-[12px] font-medium text-gray-500">Contrato</p>
      </div>
      {hasContract ? (
        <button onClick={handleDownload} disabled={loading} className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-brand transition-colors hover:text-brand-hover disabled:opacity-50">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          {loading ? "Gerando link..." : "Baixar contrato"}
        </button>
      ) : (
        <p className="mt-2 text-[13px] text-gray-400">Não disponível</p>
      )}
    </div>
  );
}
