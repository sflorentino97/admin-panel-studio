"use client";

import { useState } from "react";
import Link from "next/link";
import { KanbanBoard, type KanbanRequest } from "@/components/kanban-board";

type ClientInfo = {
  name: string;
  billing_day: number | null;
  monthly_request_limit: number;
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
}: {
  client: ClientInfo;
  requests: KanbanRequest[];
}) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const activeRequest = requests.find((r) => r.status === "in_progress");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá{client ? `, ${client.name}` : ""}
        </h1>
        <Link
          href="/requests/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo Pedido
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pedido ativo</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {activeRequest ? activeRequest.title : "Nenhum"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Limite mensal</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {client?.monthly_request_limit ?? "-"} pedido(s)
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Dia de cobrança</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {client?.billing_day ? `Dia ${client.billing_day}` : "Não definido"}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Seus pedidos</h2>
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

        {requests.length > 0 ? (
          <div className="mt-4">
            {view === "kanban" ? (
              <KanbanBoard requests={requests} readOnly linkPrefix="/requests" />
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Título
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
                    {requests.map((req) => {
                      const cfg = statusLabels[req.status] ?? {
                        label: req.status,
                        color: "bg-gray-100 text-gray-700",
                      };
                      return (
                        <tr key={req.id}>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                            <Link
                              href={`/requests/${req.id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {req.title}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${cfg.color}`}
                            >
                              {cfg.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                            {new Date(req.created_at).toLocaleDateString(
                              "pt-BR"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            Nenhum pedido encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
