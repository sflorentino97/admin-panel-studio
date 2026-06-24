"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { KanbanBoard, type KanbanRequest, type KanbanTeamMember } from "@/components/kanban-board";
import type { RequestStatus } from "@/lib/types";
import { updateRequestStatus, assignRequest } from "./actions";

type RequestItem = KanbanRequest & {
  priority: number;
  due_date?: string | null;
  client_id?: string;
  type_name?: string;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  assigned_to_avatar_url?: string | null;
};

const priorityLabels: Record<number, { label: string; color: string }> = {
  0: { label: "Normal", color: "text-gray-400" },
  1: { label: "Média", color: "text-amber-600" },
  2: { label: "Alta", color: "text-orange-600" },
  3: { label: "Urgente", color: "text-red-600" },
};

export function AdminRequestsView({
  requests: initialRequests,
  clients,
  statuses,
  requestTypes,
  teamMembers,
  currentUserId,
}: {
  requests: RequestItem[];
  clients: { id: string; name: string }[];
  statuses: RequestStatus[];
  requestTypes: { id: string; name: string }[];
  teamMembers: { id: string; full_name: string | null; role: string; avatar_url: string | null }[];
  currentUserId: string;
}) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [requests, setRequests] = useState(initialRequests);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [filterClient, setFilterClient] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleStatusChange(requestId: string, newStatusId: string) {
    setError(null);
    const targetStatus = statuses.find((s) => s.id === newStatusId);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status_id: newStatusId,
              status_name: targetStatus?.name ?? r.status_name,
              status_color: targetStatus?.color ?? r.status_color,
              status_category: targetStatus?.category ?? r.status_category,
            }
          : r
      )
    );

    startTransition(async () => {
      const result = await updateRequestStatus(requestId, newStatusId);
      if (result.error) {
        setError(result.error);
        setRequests((prev) =>
          prev.map((r) => {
            if (r.id !== requestId) return r;
            const orig = initialRequests.find((ir) => ir.id === requestId);
            return orig ?? r;
          })
        );
      }
    });
  }

  function handleAssign(requestId: string, assignedTo: string) {
    setError(null);
    const member = teamMembers.find((m) => m.id === assignedTo);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              assigned_to: assignedTo || null,
              assigned_to_name: member?.full_name ?? null,
              assigned_to_avatar_url: member?.avatar_url ?? null,
            }
          : r
      )
    );

    startTransition(async () => {
      const result = await assignRequest(requestId, assignedTo || null);
      if (result.error) {
        setError(result.error);
        setRequests((prev) =>
          prev.map((r) => {
            if (r.id !== requestId) return r;
            const orig = initialRequests.find((ir) => ir.id === requestId);
            return orig ?? r;
          })
        );
      }
    });
  }

  const filtered = requests.filter((r) => {
    if (filterClient && r.client_id !== filterClient) return false;
    if (filterStatus && r.status_id !== filterStatus) return false;
    if (filterType && r.type_name !== filterType) return false;
    if (filterAssignee && r.assigned_to !== filterAssignee) return false;
    if (myTasksOnly && r.assigned_to !== currentUserId) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const hasFilters = filterClient || filterStatus || filterType || filterAssignee || myTasksOnly || searchQuery;

  const uniqueTypes = [...new Set(requests.map((r) => r.type_name).filter(Boolean))] as string[];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Demandas</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            {filtered.length} demanda{filtered.length !== 1 ? "s" : ""}
            {hasFilters ? " (filtrado)" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/requests/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover hover:shadow active:bg-brand-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova Demanda
          </Link>

          {/* View toggle */}
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
              <span className="hidden sm:inline">Kanban</span>
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
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <label htmlFor="search-requests" className="sr-only">Buscar demandas</label>
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            id="search-requests"
            type="search"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200/80 bg-white py-2 pl-9 pr-3 text-[13px] transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="rounded-lg border border-gray-200/80 bg-white px-3 py-2 text-[13px] text-gray-700 transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        >
          <option value="">Todos os clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200/80 bg-white px-3 py-2 text-[13px] text-gray-700 transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        >
          <option value="">Todos os status</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        {uniqueTypes.length > 0 && (
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-lg border border-gray-200/80 bg-white px-3 py-2 text-[13px] text-gray-700 transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value="">Todos os tipos</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="rounded-lg border border-gray-200/80 bg-white px-3 py-2 text-[13px] text-gray-700 transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        >
          <option value="">Todos os responsáveis</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>{m.full_name ?? m.id}</option>
          ))}
        </select>
        <button
          onClick={() => setMyTasksOnly(!myTasksOnly)}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ${
            myTasksOnly
              ? "bg-brand text-white shadow-sm"
              : "border border-gray-200/80 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
          </svg>
          Minhas
        </button>
        {hasFilters && (
          <button
            onClick={() => { setFilterClient(""); setFilterStatus(""); setFilterType(""); setFilterAssignee(""); setMyTasksOnly(false); setSearchQuery(""); }}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpar
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {isPending && (
        <div className="mt-3 flex items-center gap-2 text-[13px] text-gray-500">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
          Atualizando...
        </div>
      )}

      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-14">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
            </div>
            <p className="mt-3 text-[13px] font-medium text-gray-900">
              {hasFilters ? "Sem resultados" : "Nenhuma demanda"}
            </p>
            <p className="mt-1 text-[12px] text-gray-400">
              {hasFilters ? "Tente ajustar os filtros" : "Crie sua primeira demanda para começar"}
            </p>
          </div>
        ) : view === "kanban" ? (
          <KanbanBoard
            requests={filtered}
            statuses={statuses}
            onStatusChange={handleStatusChange}
            showClientName
            linkPrefix="/admin/requests"
            teamMembers={teamMembers as KanbanTeamMember[]}
            onAssign={handleAssign}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Título</th>
                    <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Cliente</th>
                    <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500 hidden sm:table-cell">Responsável</th>
                    <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500 hidden sm:table-cell">Prioridade</th>
                    <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500 hidden md:table-cell">Tipo</th>
                    <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Criado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((req) => {
                    const pCfg = priorityLabels[req.priority] ?? priorityLabels[0];
                    return (
                      <tr key={req.id} className="transition-colors duration-150 hover:bg-gray-50/60">
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium">
                          <Link href={`/admin/requests/${req.id}`} className="text-gray-900 transition-colors hover:text-brand">
                            {req.title}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-500">
                          {req.client_name ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: req.status_color }} />
                            <span className="text-[12px] font-medium text-gray-600">{req.status_name}</span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 hidden sm:table-cell">
                          <select
                            value={req.assigned_to ?? ""}
                            onChange={(e) => handleAssign(req.id, e.target.value)}
                            className="rounded-md border-0 bg-transparent py-0.5 text-[12px] font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 cursor-pointer"
                          >
                            <option value="">—</option>
                            {teamMembers.map((m) => (
                              <option key={m.id} value={m.id}>{m.full_name ?? m.id}</option>
                            ))}
                          </select>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 hidden sm:table-cell">
                          <span className={`text-[12px] font-medium ${pCfg.color}`}>
                            {pCfg.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-500 hidden md:table-cell">
                          {req.type_name ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-[12px] tabular-nums text-gray-400">
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
