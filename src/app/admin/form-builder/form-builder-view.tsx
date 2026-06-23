"use client";

import { useState, useTransition } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { createField, updateField, deleteField, reorderFields } from "./actions";

type FieldDef = {
  id: string;
  key: string;
  label: string;
  field_type: string;
  options: string[] | null;
  is_required: boolean;
  is_active: boolean;
  position: number;
};

const FIELD_TYPES: { value: string; label: string }[] = [
  { value: "text", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "number", label: "Número" },
  { value: "date", label: "Data" },
  { value: "select", label: "Seleção única" },
  { value: "multiselect", label: "Seleção múltipla" },
  { value: "checkbox", label: "Checkbox" },
  { value: "url", label: "URL" },
];

export function FormBuilderView({ fields: initialFields }: { fields: FieldDef[] }) {
  const [fields, setFields] = useState(initialFields);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  function handleCreate(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createField(fd);
      if (res.error) setError(res.error);
      else setShowNew(false);
    });
  }

  function handleUpdate(fd: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updateField(fd);
      if (res.error) setError(res.error);
      else setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Remover este campo? Dados existentes não serão apagados.")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteField(id);
      if (res.error) setError(res.error);
      else setFields(prev => prev.filter(f => f.id !== id));
    });
  }

  function handleMove(id: string, dir: -1 | 1) {
    const idx = fields.findIndex(f => f.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= fields.length) return;
    const reordered = [...fields];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    setFields(reordered);
    startTransition(async () => {
      await reorderFields(reordered.map(f => f.id));
    });
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <Breadcrumbs items={[{ label: "Formulário" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Campos do formulário</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            Campos personalizados que aparecem ao criar uma demanda
          </p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover active:bg-brand-active"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Campo
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {showNew && (
        <form action={handleCreate} className="mt-6 rounded-xl border border-brand/20 bg-brand-light/30 p-5 space-y-4">
          <h3 className="text-[15px] font-semibold text-gray-900">Novo campo</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[13px] font-medium text-gray-600">Key (snake_case) <span className="text-red-400">*</span></label>
              <input name="key" required placeholder="ex: cor_preferida" className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600">Label <span className="text-red-400">*</span></label>
              <input name="label" required placeholder="ex: Cor preferida" className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600">Tipo <span className="text-red-400">*</span></label>
              <select name="field_type" required className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10">
                {FIELD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" name="is_required" id="new-required" className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30" />
              <label htmlFor="new-required" className="text-[13px] font-medium text-gray-700">Obrigatório</label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[13px] font-medium text-gray-600">Opções (para select/multiselect, uma por linha)</label>
              <textarea name="options" rows={3} placeholder={"Opção A\nOpção B\nOpção C"} className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-hover disabled:opacity-50">
              {isPending ? "Criando..." : "Criar"}
            </button>
            <button type="button" onClick={() => setShowNew(false)} className="rounded-lg px-4 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-2">
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-14">
            <p className="text-[13px] font-medium text-gray-900">Nenhum campo personalizado</p>
            <p className="mt-1 text-[12px] text-gray-400">Crie campos que aparecerão no formulário de demanda</p>
          </div>
        ) : (
          fields.map((field, idx) => (
            <div key={field.id} className={`rounded-xl border bg-white p-4 transition-all ${!field.is_active ? "opacity-50 border-gray-200/50" : "border-gray-200/80"}`}>
              {editingId === field.id ? (
                <form action={handleUpdate} className="space-y-3">
                  <input type="hidden" name="id" value={field.id} />
                  <input type="hidden" name="field_type" value={field.field_type} />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[12px] font-medium text-gray-500">Label</label>
                      <input name="label" defaultValue={field.label} required className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                    </div>
                    <div className="flex items-center gap-4 pt-5">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="is_required" defaultChecked={field.is_required} className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30" />
                        <span className="text-[13px] text-gray-700">Obrigatório</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" name="is_active" defaultChecked={field.is_active} value="on" className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30" />
                        <span className="text-[13px] text-gray-700">Ativo</span>
                      </label>
                    </div>
                    {["select", "multiselect"].includes(field.field_type) && (
                      <div className="sm:col-span-2">
                        <label className="block text-[12px] font-medium text-gray-500">Opções (uma por linha)</label>
                        <textarea name="options" rows={3} defaultValue={field.options?.join("\n") ?? ""} className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={isPending} className="rounded-lg bg-brand px-3 py-1.5 text-[13px] font-medium text-white hover:bg-brand-hover disabled:opacity-50">Salvar</button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-gray-500 hover:bg-gray-100">Cancelar</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => handleMove(field.id, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                      </button>
                      <button onClick={() => handleMove(field.id, 1)} disabled={idx === fields.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-gray-900">{field.label}</span>
                        {field.is_required && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-500">Obrigatório</span>}
                        {!field.is_active && <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">Inativo</span>}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[12px] text-gray-400">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px]">{field.key}</code>
                        <span>{FIELD_TYPES.find(t => t.value === field.field_type)?.label ?? field.field_type}</span>
                        {field.options && <span>· {field.options.length} opções</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingId(field.id)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                    </button>
                    <button onClick={() => handleDelete(field.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
