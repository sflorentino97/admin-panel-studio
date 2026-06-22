"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  client_name: string | null;
  type_name: string | null;
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

const statusLabels: Record<string, { label: string; color: string }> = {
  queued: { label: "Na fila", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-700" },
  in_review: { label: "Em revisão", color: "bg-yellow-100 text-yellow-700" },
  done: { label: "Concluído", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusLabels[status] ?? {
    label: status,
    color: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${cfg.color}`}
    >
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
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <Link
          href={isAdmin ? "/admin/requests" : "/"}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Voltar
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <StatusBadge status={request.status} />
            {request.client_name && <span>{request.client_name}</span>}
            {request.type_name && <span>{request.type_name}</span>}
          </div>
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700">Descrição</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
            {request.description}
          </p>
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <TimeBox label="Criado" date={request.created_at} />
        <TimeBox label="Iniciado" date={request.started_at} />
        <TimeBox label="Concluído" date={request.completed_at} />
        {request.started_at && request.completed_at && (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs font-medium text-gray-500">Duração</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatDuration(request.started_at, request.completed_at)}
            </p>
          </div>
        )}
      </div>

      {/* Attachments */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Anexos</h2>
        <AttachmentsList
          attachments={attachments}
          requestId={request.id}
        />
      </div>

      {/* Comments */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Comentários</h2>
        <CommentsList
          comments={comments}
          requestId={request.id}
          currentUserId={currentUserId}
        />
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Histórico</h2>
          <div className="mt-3 space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-2 text-sm text-gray-500"
              >
                <span className="text-xs text-gray-400">
                  {new Date(h.changed_at).toLocaleString("pt-BR")}
                </span>
                {h.from_status && <StatusBadge status={h.from_status} />}
                <span>&rarr;</span>
                <StatusBadge status={h.to_status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TimeBox({ label, date }: { label: string; date: string | null }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {date ? new Date(date).toLocaleDateString("pt-BR") : "-"}
      </p>
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
    <div className="mt-3">
      {error && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {attachments.length > 0 ? (
        <ul className="space-y-2">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-4 py-2"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {att.filename}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(att.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <button
                onClick={() => handleDownload(att.storage_path, att.filename)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Baixar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">Nenhum anexo.</p>
      )}

      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
        {isPending ? "Enviando..." : "Anexar arquivo"}
        <input
          type="file"
          className="hidden"
          onChange={handleUpload}
          disabled={isPending}
        />
      </label>
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
    <div className="mt-3">
      {error && (
        <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-lg p-4 ${
                c.author_id === currentUserId
                  ? "border border-blue-100 bg-blue-50"
                  : "border border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {c.author_name}
                  {c.author_role === "admin" && (
                    <span className="ml-2 rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600">
                      Studio
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Nenhum comentário.</p>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escreva um comentário..."
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
