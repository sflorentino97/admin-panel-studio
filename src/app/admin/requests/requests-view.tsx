"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { KanbanBoard, type KanbanRequest } from "@/components/kanban-board";
import { updateRequestStatus } from "./actions";

type RequestItem = KanbanRequest & { priority: number };

const statusLabels: Record<string, { label: string; color: string }> = {
  queued: { label: "Na fila", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-700" },
  in_review: { label: "Em revisão", color: "bg-yellow-100 text-yellow-700" },
  done: { label: "Concluído", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

export function AdminRequestsView({
  requests: initialRequests,
}: {
  requests: RequestItem[];
}) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [requests, setRequests] = useState(initialRequests);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(requestId: string, newStatus: string) {
    setError(null);
    // Optimistic update
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: newStatus } : r))
    );

    startTransition(async () => {
      const result = await updateRequestStatus(requestId, newStatus);
      if (result.error) {
        setError(result.error);
        // Revert
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

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Demandas</h1>
        <div className="flex items-center gap-1 rounded-md border border-gray-200 bg-white p-0.5">
          <button
            onClick={() => setView("kanban")}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              view === "kanban"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded px-3 py-1.5 text-sm font-medium ${
              view === "list"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isPending && (
        <div className="mt-4 text-sm text-gray-500">Atualizando...</div>
      )}

      <div className="mt-6">
        {view === "kanban" ? (
          <KanbanBoard
            requests={requests}
            onStatusChange={handleStatusChange}
            showClientName
            linkPrefix="/admin/requests"
          />
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Título
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.length > 0 ? (
                  requests.map((req) => {
                    const cfg = statusLabels[req.status] ?? {
                      label: req.status,
                      color: "bg-gray-100 text-gray-700",
                    };
                    return (
                      <tr key={req.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                          <Link
                            href={`/admin/requests/${req.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {req.title}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {req.client_name ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${cfg.color}`}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                          {new Date(req.created_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      Nenhuma demanda encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
