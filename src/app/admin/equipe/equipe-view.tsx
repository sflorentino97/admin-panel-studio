"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createTeamMember,
  updateTeamMemberRole,
  deactivateTeamMember,
  reactivateTeamMember,
  type ActionState,
} from "./actions";

type Member = {
  id: string;
  role: string;
  full_name: string | null;
  email: string;
  created_at: string;
  is_banned: boolean;
};

export function EquipeView({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    async (prev, formData) => {
      const result = await createTeamMember(prev, formData);
      if (result?.success) setShowForm(false);
      return result;
    },
    null
  );

  const admins = members.filter((m) => m.role === "admin");
  const teamMembers = members.filter((m) => m.role === "member");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">
            Equipe
          </h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            {members.length} membro{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover hover:shadow active:bg-brand-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Novo Membro
        </button>
      </div>

      {showForm && (
        <div className="mt-6 rounded-xl border border-gray-200/80 bg-white p-5 animate-fade-in">
          <h2 className="text-[15px] font-semibold text-gray-900">
            Adicionar membro
          </h2>
          <form action={formAction} className="mt-4 space-y-4">
            {state?.error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700"
              >
                <svg
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                {state.error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-[13px] font-medium text-gray-600"
                >
                  Nome <span className="text-red-400">*</span>
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
              <div>
                <label
                  htmlFor="member_email"
                  className="block text-[13px] font-medium text-gray-600"
                >
                  E-mail <span className="text-red-400">*</span>
                </label>
                <input
                  id="member_email"
                  name="email"
                  type="email"
                  required
                  className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
              <div>
                <label
                  htmlFor="member_password"
                  className="block text-[13px] font-medium text-gray-600"
                >
                  Senha <span className="text-red-400">*</span>
                </label>
                <input
                  id="member_password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover active:bg-brand-active disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {pending ? "Adicionando..." : "Adicionar"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {admins.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
            Administradores
          </h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200/80 bg-white">
            <ul className="divide-y divide-gray-100">
              {admins.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isCurrentUser={m.id === currentUserId}
                />
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-[13px] font-semibold text-gray-500 uppercase tracking-wider">
          Membros da equipe
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200/80 bg-white">
          {teamMembers.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {teamMembers.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  isCurrentUser={m.id === currentUserId}
                />
              ))}
            </ul>
          ) : (
            <div className="px-4 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                  />
                </svg>
              </div>
              <p className="mt-3 text-[13px] font-medium text-gray-900">
                Nenhum membro
              </p>
              <p className="mt-1 text-[12px] text-gray-400">
                Adicione designers e colaboradores à sua equipe
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MemberRow({
  member,
  isCurrentUser,
}: {
  member: Member;
  isCurrentUser: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleAction(action: () => Promise<ActionState>) {
    startTransition(async () => {
      setFeedback(null);
      const result = await action();
      if (result?.error) setFeedback(result.error);
      if (result?.success) setFeedback(result.success);
    });
  }

  return (
    <li className="flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-[13px] font-semibold text-white">
          {(member.full_name ?? member.email).charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-[13px] font-medium text-gray-900">
              {member.full_name ?? "Sem nome"}
            </p>
            {isCurrentUser && (
              <span className="inline-flex items-center rounded-md bg-brand-light px-1.5 py-0.5 text-[10px] font-medium text-brand">
                Você
              </span>
            )}
            {member.is_banned && (
              <span className="inline-flex items-center rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                Desativado
              </span>
            )}
          </div>
          <p className="truncate text-[12px] text-gray-400">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        {feedback && (
          <span
            className={`text-[12px] font-medium ${
              feedback.includes("Erro") || feedback.includes("não")
                ? "text-red-600"
                : "text-emerald-600"
            }`}
          >
            {feedback}
          </span>
        )}

        {!isCurrentUser && (
          <>
            {member.role === "member" && !member.is_banned && (
              <button
                onClick={() =>
                  handleAction(() =>
                    updateTeamMemberRole(member.id, "admin")
                  )
                }
                disabled={isPending}
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                Promover a Admin
              </button>
            )}
            {member.role === "admin" && (
              <button
                onClick={() =>
                  handleAction(() =>
                    updateTeamMemberRole(member.id, "member")
                  )
                }
                disabled={isPending}
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                Rebaixar a Membro
              </button>
            )}
            {member.is_banned ? (
              <button
                onClick={() =>
                  handleAction(() => reactivateTeamMember(member.id))
                }
                disabled={isPending}
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
              >
                Reativar
              </button>
            ) : (
              <button
                onClick={() =>
                  handleAction(() => deactivateTeamMember(member.id))
                }
                disabled={isPending}
                className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                Desativar
              </button>
            )}
          </>
        )}

        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ${
            member.role === "admin"
              ? "bg-purple-50 text-purple-700"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {member.role === "admin" ? "Admin" : "Membro"}
        </span>
      </div>
    </li>
  );
}
