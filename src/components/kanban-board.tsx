"use client";

import { useState, type DragEvent } from "react";
import Link from "next/link";

export type KanbanRequest = {
  id: string;
  title: string;
  status: string;
  priority?: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  due_date?: string | null;
  client_name?: string;
  type_name?: string;
};

type Column = {
  key: string;
  label: string;
  color: string;
  bgColor: string;
};

const columns: Column[] = [
  { key: "queued", label: "Na fila", color: "border-t-gray-400", bgColor: "bg-gray-50" },
  { key: "in_progress", label: "Em andamento", color: "border-t-blue-500", bgColor: "bg-blue-50/30" },
  { key: "in_review", label: "Em revisão", color: "border-t-yellow-500", bgColor: "bg-yellow-50/30" },
  { key: "done", label: "Concluído", color: "border-t-green-500", bgColor: "bg-green-50/30" },
];

const priorityConfig: Record<number, { border: string; indicator: string; label: string }> = {
  0: { border: "", indicator: "", label: "" },
  1: { border: "border-l-yellow-400", indicator: "bg-yellow-400", label: "Média" },
  2: { border: "border-l-orange-400", indicator: "bg-orange-400", label: "Alta" },
  3: { border: "border-l-red-500", indicator: "bg-red-500", label: "Urgente" },
};

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
}

function isDueSoon(dueDate: string | null | undefined): "overdue" | "soon" | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "soon";
  return null;
}

export function KanbanBoard({
  requests,
  onStatusChange,
  showClientName = false,
  readOnly = false,
  linkPrefix,
}: {
  requests: KanbanRequest[];
  onStatusChange?: (requestId: string, newStatus: string) => void;
  showClientName?: boolean;
  readOnly?: boolean;
  linkPrefix?: string;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  function handleDragStart(e: DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: DragEvent, columnKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnKey);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  function handleDrop(e: DragEvent, columnKey: string) {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedId && onStatusChange) {
      const req = requests.find((r) => r.id === draggedId);
      if (req && req.status !== columnKey) {
        onStatusChange(draggedId, columnKey);
      }
    }
    setDraggedId(null);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => {
        const items = requests.filter((r) => r.status === col.key);
        const isOver = dragOverColumn === col.key;

        return (
          <div
            key={col.key}
            className={`rounded-lg border-t-4 ${col.bgColor} p-3 ${col.color} transition-all ${
              isOver ? "ring-2 ring-blue-300 bg-blue-50/50" : ""
            }`}
            onDragOver={!readOnly ? (e) => handleDragOver(e, col.key) : undefined}
            onDragLeave={!readOnly ? handleDragLeave : undefined}
            onDrop={!readOnly ? (e) => handleDrop(e, col.key) : undefined}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                {col.label}
              </h3>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gray-200/80 px-1.5 text-xs font-medium text-gray-600">
                {items.length}
              </span>
            </div>

            <div className="space-y-2">
              {items.map((req) => {
                const priority = req.priority ?? 0;
                const pCfg = priorityConfig[priority] ?? priorityConfig[0];
                const dueStatus = req.status !== "done" ? isDueSoon(req.due_date) : null;

                return (
                  <div
                    key={req.id}
                    draggable={!readOnly}
                    onDragStart={
                      !readOnly ? (e) => handleDragStart(e, req.id) : undefined
                    }
                    className={`rounded-md border bg-white shadow-sm transition-all ${
                      priority > 0 ? `border-l-2 ${pCfg.border}` : "border-gray-200"
                    } ${
                      !readOnly ? "cursor-grab hover:shadow-md active:cursor-grabbing" : ""
                    } ${draggedId === req.id ? "opacity-40 scale-95" : ""}`}
                  >
                    <div className="p-3">
                      {linkPrefix ? (
                        <Link
                          href={`${linkPrefix}/${req.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {req.title}
                        </Link>
                      ) : (
                        <p className="text-sm font-medium text-gray-900">
                          {req.title}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {showClientName && req.client_name && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                            </svg>
                            {req.client_name}
                          </span>
                        )}
                        {req.type_name && (
                          <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-600">
                            {req.type_name}
                          </span>
                        )}
                        {priority > 0 && (
                          <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                            priority === 3 ? "text-red-600" : priority === 2 ? "text-orange-600" : "text-yellow-600"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${pCfg.indicator}`} />
                            {pCfg.label}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span>{formatDate(req.created_at)}</span>
                        {req.started_at && col.key !== "queued" && (
                          <span>Início: {formatDate(req.started_at)}</span>
                        )}
                        {req.completed_at && col.key === "done" && (
                          <span className="text-green-600 font-medium">
                            {formatDuration(req.started_at, req.completed_at)}
                          </span>
                        )}
                        {dueStatus && req.due_date && (
                          <span className={`inline-flex items-center gap-1 font-medium ${
                            dueStatus === "overdue" ? "text-red-600" : "text-orange-500"
                          }`}>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {dueStatus === "overdue" ? "Atrasado" : `Prazo: ${formatDate(req.due_date)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-gray-200 py-6 text-gray-400">
                  <svg className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                  <p className="text-xs">Vazio</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
