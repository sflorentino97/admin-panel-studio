"use client";

import { useState, useTransition } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  addComment,
  uploadAttachment,
  getAttachmentUrl,
} from "@/app/admin/requests/[id]/actions";

type Request = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  due_date: string | null;
  client_name: string | null;
  type_name: string | null;
  formats: string[] | null;
  drive_link: string | null;
  extra_info: string | null;
};

type Attachment = {
  id: string;
  filename: string;
  storage_path: string;
  created_at: string;
};

type Comment = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author_name: string;
  author_role: string;
};

type HistoryEntry = {
  id: string;
  from_status: string | null;
  to_status: string;
  changed_at: string;
};

const statusLabels: Record<string, { label: string; color: string; dot: string }> = {
  queued: { label: "Na fila", color: "bg-gray-100 text-gray-700", dot: "bg-gray-400" },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  in_review: { label: "Em revisão", color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  done: { label: "Concluído", color: "bg-green-100 text-green-700", dot: "bg-green-500" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

const priorityLabels: Record<number, { label: string; color: string }> = {
  0: { label: "Normal", color: "text-gray-500" },
  1: { label: "Média", color: "text-yellow-600" },
  2: { label: "Alta", color: "text-orange-600" },
  3: { label: "Urgente", color: "text-red-600" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusLabels[status] ?? {
    label: status,
    color: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: number }) {
  const cfg = priorityLabels[priority] ?? priorityLabels[0];
  if (priority === 0) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v12.59l1.95-2.1a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 111.1-1.02l1.95 2.1V2.75A.75.75 0 0110 2z" clipRule="evenodd" className="rotate-180 origin-center" />
      </svg>
      {cfg.label}
    </span>
  );
}

export function RequestDetail({
  request,
  attachments,
  comments,
  history,
  currentUserId,
  isAdmin,
}: {
  request: Request;
  attachments: Attachment[];
  comments: Comment[];
  history: HistoryEntry[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const breadcrumbs = isAdmin
    ? [
        { label: "Demandas", href: "/admin/requests" },
        { label: request.title },
      ]
    : [
        { label: "Painel", href: "/" },
        { label: request.title },
      ];

  return (
    <div className="mx-auto max-w-3xl">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{request.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
              {request.client_name && (
                <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                  {request.client_name}
                </span>
              )}
              {request.type_name && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
                  {request.type_name}
                </span>
              )}
            </div>
          </div>
          {request.due_date && (
            <div className="flex items-center gap-1 rounded-md bg-gray-50 px-3 py-1.5 text-sm">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span className="text-gray-600">Prazo: {new Date(request.due_date).toLocaleDateString("pt-BR")}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {request.description && (
          <div className="mt-4 rounded-md bg-gray-50 p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {request.description}
            </p>
          </div>
        )}

        {/* Formats */}
        {request.formats && request.formats.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-2">Formatos</p>
            <div className="flex flex-wrap gap-1.5">
              {request.formats.map((f) => (
                <span key={f} className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Drive link & extra info */}
        {(request.drive_link || request.extra_info) && (
          <div className="mt-4 space-y-3">
            {request.drive_link && (
              <div>
                <p className="text-xs font-medium text-gray-500">Material finalizado</p>
                <a href={request.drive_link} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-6.514a4.5 4.5 0 00-6.364 0l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  Abrir no Drive
                </a>
              </div>
            )}
            {request.extra_info && (
              <div>
                <p className="text-xs font-medium text-gray-500">Informações complementares</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{request.extra_info}</p>
              </div>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TimeBox label="Criado" date={request.created_at} icon="clock" />
          <TimeBox label="Iniciado" date={request.started_at} icon="play" />
          <TimeBox label="Concluído" date={request.completed_at} icon="check" />
          {request.started_at && request.completed_at && (
            <div className="rounded-md bg-green-50 p-3">
              <p className="text-xs font-medium text-green-600">Duração</p>
              <p className="mt-1 text-sm font-semibold text-green-900">
                {formatDuration(request.started_at, request.completed_at)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Attachments */}
      <div className="mt-6">
        <SectionHeader title="Anexos" count={attachments.length} icon="paperclip" />
        <AttachmentsList attachments={attachments} requestId={request.id} />
      </div>

      {/* Comments */}
      <div className="mt-6">
        <SectionHeader title="Comentários" count={comments.length} icon="chat" />
        <CommentsList
          comments={comments}
          requestId={request.id}
          currentUserId={currentUserId}
        />
      </div>

      {/* History Timeline */}
      {history.length > 0 && (
        <div className="mt-6">
          <SectionHeader title="Histórico" count={history.length} icon="timeline" />
          <StatusTimeline history={history} />
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title, count, icon }: { title: string; count: number; icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    paperclip: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
      </svg>
    ),
    chat: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    timeline: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-gray-400">{icons[icon]}</span>
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        {count}
      </span>
    </div>
  );
}

function TimeBox({ label, date, icon }: { label: string; date: string | null; icon: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    clock: (
      <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    play: (
      <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    ),
    check: (
      <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="rounded-md bg-gray-50 p-3">
      <div className="flex items-center gap-1">
        {iconMap[icon]}
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {date ? new Date(date).toLocaleDateString("pt-BR") : "-"}
      </p>
    </div>
  );
}

function StatusTimeline({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="p-4">
        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
          <div className="space-y-4">
            {history.map((h, i) => {
              const cfg = statusLabels[h.to_status] ?? { dot: "bg-gray-400" };
              return (
                <div key={h.id} className="relative flex items-start gap-3 pl-0">
                  <div className={`relative z-10 mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ring-4 ring-white ${cfg.dot} ${i === 0 ? "ring-2 ring-blue-100" : ""}`} style={{ marginLeft: "5px" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {h.from_status && (
                        <>
                          <StatusBadge status={h.from_status} />
                          <svg className="h-3 w-3 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </>
                      )}
                      <StatusBadge status={h.to_status} />
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(h.changed_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;
  if (days > 0) return `${days}d ${remainHours}h`;
  return `${hours}h`;
}

function AttachmentsList({
  attachments,
  requestId,
}: {
  attachments: Attachment[];
  requestId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.append("file", file);

    startTransition(async () => {
      const result = await uploadAttachment(requestId, fd);
      if (result.error) setError(result.error);
    });

    e.target.value = "";
  }

  async function handleDownload(storagePath: string, filename: string) {
    const url = await getAttachmentUrl(storagePath);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.click();
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {attachments.length > 0 ? (
        <ul className="divide-y divide-gray-100">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{att.filename}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(att.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDownload(att.storage_path, att.filename)}
                className="ml-3 flex-shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
              >
                Baixar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-gray-400">Nenhum anexo enviado.</p>
      )}

      <div className="border-t border-gray-100 px-4 py-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {isPending ? "Enviando..." : "Anexar arquivo"}
          <input
            type="file"
            className="hidden"
            onChange={handleUpload}
            disabled={isPending}
          />
        </label>
      </div>
    </div>
  );
}

function CommentsList({
  comments,
  requestId,
  currentUserId,
}: {
  comments: Comment[];
  requestId: string;
  currentUserId: string;
}) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await addComment(requestId, body);
      if (result.error) {
        setError(result.error);
      } else {
        setBody("");
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {comments.length > 0 ? (
        <div className="divide-y divide-gray-100 p-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`py-4 first:pt-0 last:pb-0`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    c.author_role === "admin"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {c.author_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {c.author_name}
                  </span>
                  {c.author_role === "admin" && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                      Studio
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 pl-8">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 py-6 text-center text-sm text-gray-400">Nenhum comentário ainda.</p>
      )}

      <form onSubmit={handleSubmit} className="border-t border-gray-100 p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escreva um comentário..."
          rows={3}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </div>
  );
}
