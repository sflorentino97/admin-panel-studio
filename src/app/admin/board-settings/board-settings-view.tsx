"use client";

import { useState, useTransition, useActionState } from "react";
import type { RequestStatus, StatusCategory } from "@/lib/types";
import { createStatus, updateStatus, reorderStatuses, deleteStatus, type ActionState } from "./actions";

const categoryLabels: Record<StatusCategory, string> = {
  backlog: "Fila",
  active: "Ativo",
  review: "Revisão",
  done: "Concluído",
  cancelled: "Cancelado",
};

const categoryColors: Record<StatusCategory, string> = {
  backlog: "bg-gray-100 text-gray-700",
  active: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-700",
  done: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

const presetColors = [
  "#9ca3af", "#3b82f6", "#f59e0b", "#10b981", "#ef4444",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#84cc16",
];

export function BoardSettingsView({ statuses: initial }: { statuses: RequestStatus[] }) {
  const [statuses, setStatuses] = useState(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const next = [...statuses];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setStatuses(next);
    startTransition(async () => {
      const result = await reorderStatuses(next.map((s) => s.id));
      if (result.error) setError(result.error);
    });
  }

  function handleMoveDown(index: number) {
    if (index === statuses.length - 1) return;
    const next = [...statuses];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setStatuses(next);
    startTransition(async () => {
      const result = await reorderStatuses(next.map((s) => s.id));
      if (result.error) setError(result.error);
    });
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteStatus(id);
      if (result.error) {
        setError(result.error);
      } else {
        setStatuses((prev) => prev.filter((s) => s.id !== id));
      }
    });
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Colunas do Kanban</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            Gerencie as colunas de status do quadro de demandas
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover active:bg-brand-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova Coluna
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700 animate-shake">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {isPending && (
        <div className="mt-3 flex items-center gap-2 text-[13px] text-gray-500">
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" />
          Salvando...
        </div>
      )}

      {showNewForm && (
        <NewStatusForm
          onClose={() => setShowNewForm(false)}
          onCreated={(s) => {
            setStatuses((prev) => [...prev, s]);
            setShowNewForm(false);
          }}
        />
      )}

      {/* Preview */}
      <div className="mt-6 mb-6">
        <p className="text-[12px] font-medium text-gray-500 mb-2">Pré-visualização</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statuses.filter(s => s.is_active).map((s) => (
            <div
              key={s.id}
              className="flex-shrink-0 rounded-lg bg-gray-50/80 px-4 py-2.5 min-w-[120px]"
            >
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[13px] font-semibold text-gray-700">{s.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status list */}
      <div className="space-y-2">
        {statuses.map((status, index) => (
          <div key={status.id}>
            {editingId === status.id ? (
              <EditStatusRow
                status={status}
                onSave={(updated) => {
                  setStatuses((prev) => prev.map((s) => s.id === updated.id ? updated : s));
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-white px-4 py-3 transition-shadow duration-150 hover:shadow-sm">
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0 || isPending}
                    aria-label="Mover para cima"
                    className="flex h-5 w-5 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === statuses.length - 1 || isPending}
                    aria-label="Mover para baixo"
                    className="flex h-5 w-5 items-center justify-center rounded text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                </div>

                {/* Color dot + name */}
                <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900">{status.name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-medium ${categoryColors[status.category]}`}>
                      {categoryLabels[status.category]}
                    </span>
                    {status.wip_limit && (
                      <span className="text-[11px] text-gray-400">
                        Limite: {status.wip_limit} cards
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingId(status.id)}
                    aria-label="Editar"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(status.id)}
                    disabled={isPending}
                    aria-label="Excluir"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {statuses.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-14">
          <p className="text-[13px] font-medium text-gray-900">Nenhuma coluna configurada</p>
          <p className="mt-1 text-[12px] text-gray-400">Crie sua primeira coluna para usar o kanban</p>
        </div>
      )}
    </div>
  );
}

function NewStatusForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (status: RequestStatus) => void;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (_prev, fd) => {
      const result = await createStatus(null, fd);
      if (result?.success) {
        onCreated({
          id: crypto.randomUUID(),
          name: (fd.get("name") as string).trim(),
          category: fd.get("category") as StatusCategory,
          color: (fd.get("color") as string) || "#9ca3af",
          wip_limit: fd.get("wip_limit") ? parseInt(fd.get("wip_limit") as string) : null,
          position: 999,
          is_active: true,
        });
      }
      return result;
    },
    null
  );
  const [selectedColor, setSelectedColor] = useState("#9ca3af");

  return (
    <div className="mt-4 rounded-xl border border-brand/20 bg-brand-50/30 p-5 animate-scale-in">
      <h3 className="text-[14px] font-semibold text-gray-900">Nova coluna</h3>
      <form action={formAction} className="mt-3 space-y-3">
        {state?.error && (
          <div role="alert" className="text-[13px] text-red-600">{state.error}</div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="new-name" className="block text-[13px] font-medium text-gray-600">Nome</label>
            <input id="new-name" name="name" required className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
          </div>
          <div>
            <label htmlFor="new-category" className="block text-[13px] font-medium text-gray-600">Categoria</label>
            <select id="new-category" name="category" required className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10">
              {(Object.entries(categoryLabels) as [StatusCategory, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-600 mb-1.5">Cor</label>
          <input type="hidden" name="color" value={selectedColor} />
          <div className="flex flex-wrap gap-1.5">
            {presetColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedColor(c)}
                className={`h-7 w-7 rounded-lg transition-all ${selectedColor === c ? "ring-2 ring-offset-1 ring-gray-900 scale-110" : "hover:scale-105"}`}
                style={{ backgroundColor: c }}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="new-wip" className="block text-[13px] font-medium text-gray-600">
            Limite de cards <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input id="new-wip" name="wip_limit" type="number" min={1} className="mt-1 block w-32 rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white transition-all duration-150 hover:bg-brand-hover disabled:opacity-50"
          >
            {pending && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
            Criar
          </button>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function EditStatusRow({
  status,
  onSave,
  onCancel,
}: {
  status: RequestStatus;
  onSave: (s: RequestStatus) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(status.name);
  const [color, setColor] = useState(status.color);
  const [wipLimit, setWipLimit] = useState(status.wip_limit?.toString() ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    if (!name.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await updateStatus(status.id, {
        name: name.trim(),
        color,
        wip_limit: wipLimit ? parseInt(wipLimit) : null,
      });
      if (result.error) {
        setError(result.error);
      } else {
        onSave({ ...status, name: name.trim(), color, wip_limit: wipLimit ? parseInt(wipLimit) : null });
      }
    });
  }

  return (
    <div className="rounded-xl border border-brand/20 bg-brand-50/30 p-4 animate-scale-in">
      {error && <p role="alert" className="mb-2 text-[13px] text-red-600">{error}</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-[12px] font-medium text-gray-500">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500 mb-1">Cor</label>
          <div className="flex flex-wrap gap-1">
            {presetColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-md transition-all ${color === c ? "ring-2 ring-offset-1 ring-gray-900 scale-110" : "hover:scale-105"}`}
                style={{ backgroundColor: c }}
                aria-label={`Cor ${c}`}
              />
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-gray-500">Limite WIP</label>
          <input value={wipLimit} onChange={(e) => setWipLimit(e.target.value)} type="number" min={1} placeholder="Sem limite" className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-brand-hover disabled:opacity-50">
          {isPending && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
          Salvar
        </button>
        <button onClick={onCancel} className="rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100">Cancelar</button>
      </div>
    </div>
  );
}
