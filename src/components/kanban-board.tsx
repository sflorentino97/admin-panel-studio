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
  dot: string;
};

const columns: Column[] = [
  { key: "queued", label: "Na fila", dot: "bg-gray-400" },
  { key: "in_progress", label: "Em andamento", dot: "bg-blue-500" },
  { key: "in_review", label: "Em revisão", dot: "bg-amber-500" },
  { key: "done", label: "Concluído", dot: "bg-emerald-500" },
];

const priorityConfig: Record<number, { border: string; indicator: string; label: string }> = {
  0: { border: "", indicator: "", label: "" },
  1: { border: "border-l-amber-400", indicator: "bg-amber-400", label: "Média" },
  2: { border: "border-l-orange-500", indicator: "bg-orange-500", label: "Alta" },
  3: { border: "border-l-red-500", indicator: "bg-red-500", label: "Urgente" },
};

function formatDate(date: string | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => {
        const items = requests.filter((r) => r.status === col.key);
        const isOver = dragOverColumn === col.key;

        return (
          <div
            key={col.key}
            className={`rounded-xl bg-gray-50/80 p-2.5 transition-all duration-200 ${
              isOver ? "ring-2 ring-brand/30 bg-brand-50/40" : ""
            }`}
            onDragOver={!readOnly ? (e) => handleDragOver(e, col.key) : undefined}
            onDragLeave={!readOnly ? handleDragLeave : undefined}
            onDrop={!readOnly ? (e) => handleDrop(e, col.key) : undefined}
          >
            <div className="mb-2.5 flex items-center gap-2 px-1.5">
              <span className={`h-2 w-2 rounded-full ${col.dot}`} />
              <h3 className="text-[13px] font-semibold text-gray-700">
                {col.label}
              </h3>
              <span className="ml-auto text-[12px] font-medium tabular-nums text-gray-400">
                {items.length}
              </span>
            </div>

            <div className="space-y-1.5">
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
                    className={`group rounded-lg border bg-white transition-all duration-150 ${
                      priority > 0 ? `border-l-2 ${pCfg.border} border-y-gray-200/80 border-r-gray-200/80` : "border-gray-200/80"
                    } ${
                      !readOnly ? "cursor-grab hover:shadow-md hover:-translate-y-px active:cursor-grabbing active:shadow-sm active:translate-y-0" : "hover:shadow-sm"
                    } ${draggedId === req.id ? "opacity-30 scale-95 rotate-1" : ""}`}
                  >
                    <div className="p-3">
                      {linkPrefix ? (
                        <Link
                          href={`${linkPrefix}/${req.id}`}
                          className="text-[13px] font-medium leading-snug text-gray-900 transition-colors hover:text-brand"
                        >
                          {req.title}
                        </Link>
                      ) : (
                        <p className="text-[13px] font-medium leading-snug text-gray-900">
                          {req.title}
                        </p>
                      )}

                      {(showClientName && req.client_name || req.type_name || priority > 0) && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {showClientName && req.client_name && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                              {req.client_name}
                            </span>
                          )}
                          {req.type_name && (
                            <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[11px] font-medium text-purple-600">
                              {req.type_name}
                            </span>
                          )}
                          {priority > 0 && (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                              priority === 3 ? "text-red-600" : priority === 2 ? "text-orange-600" : "text-amber-600"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${pCfg.indicator}`} />
                              {pCfg.label}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
                        <span>{formatDate(req.created_at)}</span>
                        {req.completed_at && col.key === "done" && (
                          <span className="rounded bg-emerald-50 px-1 py-0.5 text-emerald-600 font-medium">
                            {formatDuration(req.started_at, req.completed_at)}
                          </span>
                        )}
                        {dueStatus && req.due_date && (
                          <span className={`inline-flex items-center gap-0.5 font-medium ${
                            dueStatus === "overdue" ? "text-red-500" : "text-amber-500"
                          }`}>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {dueStatus === "overdue" ? "Atrasado" : formatDate(req.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {items.length === 0 && (
                <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200/80 py-8 text-gray-300">
                  <p className="text-[12px] font-medium">Nenhuma tarefa</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
