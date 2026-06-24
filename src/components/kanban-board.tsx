"use client";

import { useState, useRef, useEffect, type DragEvent } from "react";
import Link from "next/link";
import type { RequestStatus } from "@/lib/types";

export type KanbanTeamMember = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type KanbanRequest = {
  id: string;
  title: string;
  status_id: string;
  status_name: string;
  status_color: string;
  status_category: string;
  priority?: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  due_date?: string | null;
  client_name?: string;
  type_name?: string;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  assigned_to_avatar_url?: string | null;
};

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

const clientColors = [
  { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-400" },
  { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-400" },
  { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-400" },
  { bg: "bg-cyan-50", text: "text-cyan-700", dot: "bg-cyan-400" },
  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  { bg: "bg-pink-50", text: "text-pink-700", dot: "bg-pink-400" },
  { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-400" },
  { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-400" },
  { bg: "bg-lime-50", text: "text-lime-700", dot: "bg-lime-400" },
  { bg: "bg-fuchsia-50", text: "text-fuchsia-700", dot: "bg-fuchsia-400" },
];

function getClientColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return clientColors[Math.abs(hash) % clientColors.length];
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

function AssigneeAvatar({
  name,
  avatarUrl,
  size = "sm",
}: {
  name: string | null;
  avatarUrl: string | null;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-6 w-6" : "h-5 w-5";
  const textSize = size === "md" ? "text-[10px]" : "text-[9px]";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? ""}
        className={`${dim} rounded-full object-cover ring-1 ring-white`}
      />
    );
  }

  if (name) {
    return (
      <span
        className={`flex ${dim} items-center justify-center rounded-full bg-gradient-to-br from-brand/80 to-brand-hover text-white ${textSize} font-bold ring-1 ring-white`}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }

  return null;
}

function AssigneeSelector({
  requestId,
  currentAssignee,
  teamMembers,
  onAssign,
  assignedName,
  assignedAvatarUrl,
}: {
  requestId: string;
  currentAssignee: string | null | undefined;
  teamMembers: KanbanTeamMember[];
  onAssign: (requestId: string, assignedTo: string) => void;
  assignedName: string | null | undefined;
  assignedAvatarUrl: string | null | undefined;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(!open);
        }}
        className="flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors hover:bg-gray-100"
        title={currentAssignee ? `Responsável: ${assignedName}` : "Atribuir responsável"}
      >
        {currentAssignee ? (
          <>
            <AssigneeAvatar name={assignedName ?? null} avatarUrl={assignedAvatarUrl ?? null} />
            <span className="text-[11px] text-gray-500 max-w-[60px] truncate">
              {assignedName?.split(" ")[0]}
            </span>
          </>
        ) : (
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-dashed border-gray-300 text-[9px] text-gray-400">
            +
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg animate-scale-in">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAssign(requestId, "");
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition-colors hover:bg-gray-50 ${
              !currentAssignee ? "text-brand font-medium" : "text-gray-500"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[9px] text-gray-400">
              —
            </span>
            Nenhum
          </button>
          {teamMembers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAssign(requestId, m.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-[12px] transition-colors hover:bg-gray-50 ${
                currentAssignee === m.id ? "text-brand font-medium bg-brand-50/30" : "text-gray-700"
              }`}
            >
              <AssigneeAvatar name={m.full_name} avatarUrl={m.avatar_url} size="md" />
              <span className="truncate">{m.full_name ?? "Sem nome"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function KanbanBoard({
  requests,
  statuses,
  onStatusChange,
  showClientName = false,
  readOnly = false,
  linkPrefix,
  teamMembers,
  onAssign,
}: {
  requests: KanbanRequest[];
  statuses: RequestStatus[];
  onStatusChange?: (requestId: string, newStatusId: string) => void;
  showClientName?: boolean;
  readOnly?: boolean;
  linkPrefix?: string;
  teamMembers?: KanbanTeamMember[];
  onAssign?: (requestId: string, assignedTo: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const visibleStatuses = statuses.filter(s => s.is_active && s.category !== "cancelled");

  function handleDragStart(e: DragEvent, id: string) {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: DragEvent, statusId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(statusId);
  }

  function handleDragLeave() {
    setDragOverColumn(null);
  }

  function handleDrop(e: DragEvent, statusId: string) {
    e.preventDefault();
    setDragOverColumn(null);
    if (draggedId && onStatusChange) {
      const req = requests.find((r) => r.id === draggedId);
      if (req && req.status_id !== statusId) {
        onStatusChange(draggedId, statusId);
      }
    }
    setDraggedId(null);
  }

  return (
    <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 sm:pb-0 sm:grid sm:overflow-visible sm:snap-none scrollbar-hide" style={{ gridTemplateColumns: `repeat(${Math.min(visibleStatuses.length, 4)}, minmax(0, 1fr))` }}>
      {visibleStatuses.map((col) => {
        const items = requests.filter((r) => r.status_id === col.id);
        const isOver = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            className={`min-w-[280px] flex-shrink-0 snap-center rounded-xl bg-gray-50/80 p-2.5 transition-all duration-200 sm:min-w-0 sm:flex-shrink ${
              isOver ? "ring-2 ring-brand/30 bg-brand-50/40" : ""
            }`}
            onDragOver={!readOnly ? (e) => handleDragOver(e, col.id) : undefined}
            onDragLeave={!readOnly ? handleDragLeave : undefined}
            onDrop={!readOnly ? (e) => handleDrop(e, col.id) : undefined}
          >
            <div className="mb-2.5 flex items-center gap-2 px-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
              <h3 className="text-[13px] font-semibold text-gray-700">{col.name}</h3>
              <span className="ml-auto text-[12px] font-medium tabular-nums text-gray-400">
                {items.length}
                {col.wip_limit ? `/${col.wip_limit}` : ""}
              </span>
            </div>

            <div className="space-y-1.5">
              {items.map((req) => {
                const priority = req.priority ?? 0;
                const pCfg = priorityConfig[priority] ?? priorityConfig[0];
                const dueStatus = req.status_category !== "done" ? isDueSoon(req.due_date) : null;

                return (
                  <div
                    key={req.id}
                    draggable={!readOnly}
                    onDragStart={!readOnly ? (e) => handleDragStart(e, req.id) : undefined}
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
                        <p className="text-[13px] font-medium leading-snug text-gray-900">{req.title}</p>
                      )}

                      {(showClientName && req.client_name || req.type_name || priority > 0) && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {showClientName && req.client_name && (() => {
                            const cc = getClientColor(req.client_name);
                            return (
                              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${cc.bg} ${cc.text}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} />
                                {req.client_name}
                              </span>
                            );
                          })()}
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
                        {teamMembers && onAssign ? (
                          <AssigneeSelector
                            requestId={req.id}
                            currentAssignee={req.assigned_to}
                            teamMembers={teamMembers}
                            onAssign={onAssign}
                            assignedName={req.assigned_to_name}
                            assignedAvatarUrl={req.assigned_to_avatar_url}
                          />
                        ) : req.assigned_to_name ? (
                          <span className="inline-flex items-center gap-1">
                            <AssigneeAvatar
                              name={req.assigned_to_name}
                              avatarUrl={req.assigned_to_avatar_url ?? null}
                            />
                            <span className="text-gray-500">{req.assigned_to_name.split(" ")[0]}</span>
                          </span>
                        ) : null}
                        <span>{formatDate(req.created_at)}</span>
                        {req.completed_at && req.status_category === "done" && (
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
