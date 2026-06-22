"use client";

import { useState, type DragEvent } from "react";

export type KanbanRequest = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  client_name?: string;
};

type Column = {
  key: string;
  label: string;
  color: string;
};

const columns: Column[] = [
  { key: "queued", label: "Na fila", color: "border-t-gray-400" },
  { key: "in_progress", label: "Em andamento", color: "border-t-blue-500" },
  { key: "in_review", label: "Em revisão", color: "border-t-yellow-500" },
  { key: "done", label: "Concluído", color: "border-t-green-500" },
];

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

export function KanbanBoard({
  requests,
  onStatusChange,
  showClientName = false,
  readOnly = false,
}: {
  requests: KanbanRequest[];
  onStatusChange?: (requestId: string, newStatus: string) => void;
  showClientName?: boolean;
  readOnly?: boolean;
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
            className={`rounded-lg border-t-4 bg-gray-50 p-3 ${col.color} ${
              isOver ? "ring-2 ring-blue-300" : ""
            }`}
            onDragOver={!readOnly ? (e) => handleDragOver(e, col.key) : undefined}
            onDragLeave={!readOnly ? handleDragLeave : undefined}
            onDrop={!readOnly ? (e) => handleDrop(e, col.key) : undefined}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">
                {col.label}
              </h3>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                {items.length}
              </span>
            </div>

            <div className="space-y-2">
              {items.map((req) => (
                <div
                  key={req.id}
                  draggable={!readOnly}
                  onDragStart={
                    !readOnly ? (e) => handleDragStart(e, req.id) : undefined
                  }
                  className={`rounded-md border border-gray-200 bg-white p-3 shadow-sm ${
                    !readOnly ? "cursor-grab active:cursor-grabbing" : ""
                  } ${draggedId === req.id ? "opacity-50" : ""}`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {req.title}
                  </p>
                  {showClientName && req.client_name && (
                    <p className="mt-1 text-xs text-gray-500">
                      {req.client_name}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                    <span>{formatDate(req.created_at)}</span>
                    {req.started_at && col.key !== "queued" && (
                      <span>
                        Início: {formatDate(req.started_at)}
                      </span>
                    )}
                    {req.completed_at && col.key === "done" && (
                      <span>
                        {formatDuration(req.started_at, req.completed_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="py-4 text-center text-xs text-gray-400">
                  Vazio
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
