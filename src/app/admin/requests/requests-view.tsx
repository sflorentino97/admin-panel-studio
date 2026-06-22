"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { KanbanBoard, type KanbanRequest } from "@/components/kanban-board";
import { updateRequestStatus } from "./actions";

type RequestItem = KanbanRequest & {
  priority: number;
  due_date?: string | null;
  client_id?: string;
  type_name?: string;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  queued: { label: "Na fila", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-700" },
  in_review: { label: "Em revisão", color: "bg-yellow-100 text-yellow-700" },
  done: { label: "Concluído", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

const priorityLabels: Record<number, { label: string; color: string }> = {
  0: { label: "Normal", color: "text-gray-400" },
  1: { label: "Média", color: "text-yellow-600" },
  2: { label: "Alta", color: "text-orange-600" },
  3: { label: "Urgente", color: "text-red-600" },
};

export function AdminRequestsView({
  requests: initialRequests,
  clients,
}: {
  requests: RequestItem[];
  clients: { id: string; name: string }[];
}) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [requests, setRequests] = useState(initialRequests);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterClient, setFilterClient] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  function handleStatusChange(requestId: string, newStatus: string) {
    setError(null);
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
    );

    startTransition(async () => {
      const result = await updateRequestStatus(requestId, newStatus);
      if (result.error) {
        setError(result.error);
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? { ...r, status: initialRequests.find((ir) => ir.id === requestId)?.status ?? r.status }
              : r
          )
        );
      }
    });
  }

  const filtered = requests.filter((r) => {
    if (filterClient && r.client_id !== filterClient) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const hasFilters = filterClient || filterStatus || searchQuery;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandas</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {filtered.length} demanda{filtered.length !== 1 ? "s" : ""}
            {hasFilters ? " (filtrado)" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/requests/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Nova Demanda
          </Link>
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
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todos os clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          {Object.entries(statusLabels).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        {hasFilters && (
          <button
            onClick={() => { setFilterClient(""); setFilterStatus(""); setSearchQuery(""); }}
            className="rounded-md px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isPending && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          Atualizando...
        </div>
      )}

      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white py-12">
            <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <p className="mt-2 text-sm text-gray-500">
              {hasFilters ? "Nenhuma demanda encontrada com esses filtros." : "Nenhuma demanda encontrada."}
            </p>
          </div>
        ) : view === "kanban" ? (
          <KanbanBoard
            requests={filtered}
            onStatusChange={handleStatusChange}
            showClientName
            linkPrefix="/admin/requests"
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Título</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hidden sm:table-cell">Prioridade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hidden md:table-cell">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Criado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map((req) => {
                    const sCfg = statusLabels[req.status] ?? { label: req.status, color: "bg-gray-100 text-gray-700" };
                    const pCfg = priorityLabels[req.priority] ?? priorityLabels[0];
                    return (
                      <tr key={req.id} className="transition-colors hover:bg-gray-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                          <Link href={`/admin/requests/${req.id}`} className="text-gray-900 hover:text-blue-600 transition-colors">
                            {req.title}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {req.client_name ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${sCfg.color}`}>
                            {sCfg.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 hidden sm:table-cell">
                          <span className={`text-xs font-medium ${pCfg.color}`}>
                            {pCfg.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                          {req.type_name ?? "-"}
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
    </div>
  );
}
