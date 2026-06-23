"use client";

import { useState, useTransition } from "react";
import { createProject, updateProject, deleteProject } from "./actions";

type Project = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
};

export function ProjectsView({ projects: initialProjects }: { projects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;

    startTransition(async () => {
      const result = await createProject(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        form.reset();
      }
    });
  }

  function handleUpdate(projectId: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await updateProject(projectId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  function handleDelete(projectId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteProject(projectId);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Projetos</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Gerencie os projetos da sua empresa</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover hover:shadow active:bg-brand-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Projeto
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mt-4 rounded-xl border border-gray-200/80 bg-white p-5 animate-scale-in">
          <h2 className="text-[15px] font-semibold text-gray-900">Novo Projeto</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="new-name" className="block text-[13px] font-medium text-gray-600">
                Nome <span className="text-red-400">*</span>
              </label>
              <input
                id="new-name"
                name="name"
                type="text"
                required
                placeholder="Nome do projeto ou cliente"
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
            <div>
              <label htmlFor="new-desc" className="block text-[13px] font-medium text-gray-600">Descrição</label>
              <textarea
                id="new-desc"
                name="description"
                rows={2}
                placeholder="Detalhes do projeto..."
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] leading-relaxed transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white transition-all duration-150 hover:bg-brand-hover active:bg-brand-active disabled:opacity-50"
            >
              {isPending ? "Salvando..." : "Criar"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-4 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-2">
        {projects.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-14">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <p className="mt-3 text-[13px] font-medium text-gray-900">Nenhum projeto</p>
            <p className="mt-1 text-[12px] text-gray-400">Cadastre os projetos da sua empresa</p>
          </div>
        ) : (
          projects.map((project) =>
            editingId === project.id ? (
              <form
                key={project.id}
                onSubmit={(e) => handleUpdate(project.id, e)}
                className="rounded-xl border border-brand/30 bg-white p-5 animate-scale-in"
              >
                <div className="space-y-3">
                  <div>
                    <label htmlFor={`edit-name-${project.id}`} className="block text-[13px] font-medium text-gray-600">
                      Nome <span className="text-red-400">*</span>
                    </label>
                    <input
                      id={`edit-name-${project.id}`}
                      name="name"
                      type="text"
                      required
                      defaultValue={project.name}
                      className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                  </div>
                  <div>
                    <label htmlFor={`edit-desc-${project.id}`} className="block text-[13px] font-medium text-gray-600">Descrição</label>
                    <textarea
                      id={`edit-desc-${project.id}`}
                      name="description"
                      rows={2}
                      defaultValue={project.description ?? ""}
                      className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] leading-relaxed transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input
                      id={`edit-active-${project.id}`}
                      name="is_active"
                      type="checkbox"
                      defaultChecked={project.is_active}
                      className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30"
                    />
                    <label htmlFor={`edit-active-${project.id}`} className="text-[13px] font-medium text-gray-700">
                      Ativo
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white transition-all duration-150 hover:bg-brand-hover active:bg-brand-active disabled:opacity-50"
                  >
                    {isPending ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg px-4 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-xl border border-gray-200/80 bg-white px-5 py-4 transition-all duration-150 hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[14px] font-medium text-gray-900">{project.name}</h3>
                    {!project.is_active && (
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Inativo</span>
                    )}
                  </div>
                  {project.description && (
                    <p className="mt-0.5 truncate text-[13px] text-gray-500">{project.description}</p>
                  )}
                  <p className="mt-1 text-[11px] tabular-nums text-gray-400">
                    Criado em {new Date(project.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-1">
                  <button
                    onClick={() => { setEditingId(project.id); setShowForm(false); }}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Editar projeto"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Tem certeza que deseja excluir este projeto?")) {
                        handleDelete(project.id);
                      }
                    }}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label="Excluir projeto"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
