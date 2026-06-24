"use client";

import { useState, useTransition } from "react";
import {
  saveIntegration,
  deleteIntegration,
  syncNow,
  testConnection,
} from "./actions";

type IntegrationRow = {
  id: string;
  platform: string;
  access_token: string;
  external_resource_id: string;
  status_mapping: {
    outbound: Record<string, string>;
    inbound: Record<string, string>;
  };
  sync_enabled: boolean;
  last_synced_at: string | null;
  config: Record<string, string>;
  webhook_secret: string;
};

type Status = {
  id: string;
  name: string;
  category: string;
  color: string;
  position: number;
};

const platformMeta: Record<
  string,
  { label: string; icon: string; color: string; resourceLabel: string; resourceHint: string }
> = {
  notion: {
    label: "Notion",
    icon: "N",
    color: "bg-gray-900 text-white",
    resourceLabel: "Database ID",
    resourceHint: "Cole o ID do banco de dados Notion (32 caracteres hex da URL)",
  },
  clickup: {
    label: "ClickUp",
    icon: "C",
    color: "bg-purple-600 text-white",
    resourceLabel: "List ID",
    resourceHint: "ID da lista do ClickUp (número encontrado na URL)",
  },
  asana: {
    label: "Asana",
    icon: "A",
    color: "bg-orange-500 text-white",
    resourceLabel: "Project GID",
    resourceHint: "GID do projeto Asana (número na URL do projeto)",
  },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}

export function IntegrationManager({
  clientId,
  integrations: initial,
  statuses,
  baseUrl,
}: {
  clientId: string;
  integrations: IntegrationRow[];
  statuses: Status[];
  baseUrl: string;
}) {
  const [integrations, setIntegrations] = useState(initial);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    taskCount?: number;
    statuses?: string[];
    error?: string;
  } | null>(null);

  const usedPlatforms = new Set(integrations.map((i) => i.platform));
  const availablePlatforms = ["notion", "clickup", "asana"].filter(
    (p) => !usedPlatforms.has(p)
  );

  function handleSave(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await saveIntegration(clientId, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("Integração salva com sucesso!");
        setEditing(null);
        setAdding(false);
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  function handleDelete(integrationId: string) {
    if (!confirm("Tem certeza? Os links externos serão removidos.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteIntegration(clientId, integrationId);
      if (result.error) setError(result.error);
    });
  }

  function handleSync(integrationId: string) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await syncNow(integrationId);
      if (result.error) {
        setError(result.error);
      } else {
        const parts = [];
        if (result.created) parts.push(`${result.created} criada(s)`);
        if (result.updated) parts.push(`${result.updated} atualizada(s)`);
        if (result.errors?.length)
          parts.push(`${result.errors.length} erro(s)`);
        setSuccess(
          parts.length > 0 ? `Sync: ${parts.join(", ")}` : "Nada para sincronizar"
        );
        setTimeout(() => setSuccess(null), 5000);
      }
    });
  }

  function handleTest(formData: FormData) {
    setTestResult(null);
    const platform = formData.get("platform") as string;
    const token = (formData.get("access_token") as string)?.trim();
    const resourceId = (formData.get("external_resource_id") as string)?.trim();
    const config: Record<string, string> = {};
    if (platform === "notion") {
      config.title_property =
        (formData.get("title_property") as string)?.trim() || "Name";
      config.status_property =
        (formData.get("status_property") as string)?.trim() || "Status";
    }

    startTransition(async () => {
      const result = await testConnection(platform, token, resourceId, config);
      setTestResult(result);
    });
  }

  return (
    <div className="mt-6 space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-700">
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
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
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
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {success}
        </div>
      )}

      {/* Existing integrations */}
      {integrations.map((integ) => {
        const meta = platformMeta[integ.platform];
        const isEditing = editing === integ.id;

        if (isEditing) {
          return (
            <IntegrationForm
              key={integ.id}
              clientId={clientId}
              statuses={statuses}
              baseUrl={baseUrl}
              integration={integ}
              onSave={handleSave}
              onTest={handleTest}
              onCancel={() => {
                setEditing(null);
                setTestResult(null);
              }}
              isPending={isPending}
              testResult={testResult}
            />
          );
        }

        return (
          <div
            key={integ.id}
            className="rounded-xl border border-gray-200/80 bg-white p-5 transition-all hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-[14px] font-bold ${meta.color}`}
                >
                  {meta.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-gray-900">
                      {meta.label}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        integ.sync_enabled
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {integ.sync_enabled ? "Ativo" : "Pausado"}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-400">
                    {meta.resourceLabel}: {integ.external_resource_id}
                    {integ.last_synced_at && (
                      <> &middot; Sync: {timeAgo(integ.last_synced_at)}</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Status mapping preview */}
            {Object.keys(integ.status_mapping.outbound).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {statuses
                  .filter((s) => integ.status_mapping.outbound[s.id])
                  .map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-[11px]"
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      <span className="text-gray-600">{s.name}</span>
                      <span className="text-gray-300">&rarr;</span>
                      <span className="font-medium text-gray-700">
                        {integ.status_mapping.outbound[s.id]}
                      </span>
                    </span>
                  ))}
              </div>
            )}

            {/* Webhook URL */}
            {integ.platform !== "notion" && (
              <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-medium text-gray-500">
                  Webhook URL (configure no {meta.label}):
                </p>
                <code className="mt-0.5 block text-[11px] text-gray-700 break-all select-all">
                  {baseUrl}/api/webhooks/{integ.platform}/{integ.id}
                </code>
              </div>
            )}

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSync(integ.id)}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-[12px] font-medium text-white transition-all hover:bg-gray-800 disabled:opacity-50"
              >
                <svg
                  className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                  />
                </svg>
                Sincronizar Agora
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(integ.id);
                  setTestResult(null);
                }}
                className="rounded-lg px-3 py-2 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => handleDelete(integ.id)}
                className="rounded-lg px-3 py-2 text-[12px] font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                Remover
              </button>
            </div>
          </div>
        );
      })}

      {/* Add new */}
      {adding ? (
        <IntegrationForm
          clientId={clientId}
          statuses={statuses}
          baseUrl={baseUrl}
          availablePlatforms={availablePlatforms}
          onSave={handleSave}
          onTest={handleTest}
          onCancel={() => {
            setAdding(false);
            setTestResult(null);
          }}
          isPending={isPending}
          testResult={testResult}
        />
      ) : (
        availablePlatforms.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setEditing(null);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-white py-5 text-[13px] font-medium text-gray-500 transition-all hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
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
            Nova Integração
          </button>
        )
      )}

      {integrations.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
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
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
              />
            </svg>
          </div>
          <p className="mt-3 text-[13px] font-medium text-gray-900">
            Nenhuma integração
          </p>
          <p className="mt-1 max-w-xs text-center text-[12px] text-gray-400">
            Conecte o Notion, ClickUp ou Asana do cliente para sincronizar
            tarefas automaticamente
          </p>
        </div>
      )}
    </div>
  );
}

function IntegrationForm({
  clientId,
  statuses,
  baseUrl,
  integration,
  availablePlatforms,
  onSave,
  onTest,
  onCancel,
  isPending,
  testResult,
}: {
  clientId: string;
  statuses: Status[];
  baseUrl: string;
  integration?: IntegrationRow;
  availablePlatforms?: string[];
  onSave: (formData: FormData) => void;
  onTest: (formData: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
  testResult: {
    taskCount?: number;
    statuses?: string[];
    error?: string;
  } | null;
}) {
  const [platform, setPlatform] = useState(
    integration?.platform || availablePlatforms?.[0] || "notion"
  );
  const meta = platformMeta[platform];
  const isEdit = !!integration;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(new FormData(e.currentTarget));
      }}
      className="rounded-xl border border-brand/20 bg-white p-5 animate-scale-in"
    >
      <h3 className="text-[15px] font-semibold text-gray-900">
        {isEdit ? `Editar ${meta.label}` : "Nova Integração"}
      </h3>

      {integration && (
        <input type="hidden" name="integration_id" value={integration.id} />
      )}

      <div className="mt-4 space-y-4">
        {/* Platform select */}
        {!isEdit ? (
          <div>
            <label className="block text-[13px] font-medium text-gray-600">
              Plataforma <span className="text-red-400">*</span>
            </label>
            <div className="mt-1.5 flex gap-2">
              {(availablePlatforms ?? []).map((p) => {
                const m = platformMeta[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-[13px] font-medium transition-all ${
                      platform === p
                        ? "border-brand bg-brand-50/30 text-brand"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded text-[11px] font-bold ${m.color}`}
                    >
                      {m.icon}
                    </span>
                    {m.label}
                  </button>
                );
              })}
            </div>
            <input type="hidden" name="platform" value={platform} />
          </div>
        ) : (
          <input type="hidden" name="platform" value={platform} />
        )}

        {/* Token */}
        <div>
          <label
            htmlFor="access_token"
            className="block text-[13px] font-medium text-gray-600"
          >
            Token de Acesso <span className="text-red-400">*</span>
          </label>
          <input
            id="access_token"
            name="access_token"
            type="password"
            required
            defaultValue={integration?.access_token}
            placeholder="Chave de API ou token de acesso"
            className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
        </div>

        {/* Resource ID */}
        <div>
          <label
            htmlFor="external_resource_id"
            className="block text-[13px] font-medium text-gray-600"
          >
            {meta.resourceLabel} <span className="text-red-400">*</span>
          </label>
          <input
            id="external_resource_id"
            name="external_resource_id"
            type="text"
            required
            defaultValue={integration?.external_resource_id}
            placeholder={meta.resourceHint}
            className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          />
          <p className="mt-1 text-[11px] text-gray-400">{meta.resourceHint}</p>
        </div>

        {/* Notion-specific config */}
        {platform === "notion" && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500">
                Propriedade Título
              </label>
              <input
                name="title_property"
                type="text"
                defaultValue={integration?.config?.title_property || "Name"}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[12px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500">
                Propriedade Status
              </label>
              <input
                name="status_property"
                type="text"
                defaultValue={integration?.config?.status_property || "Status"}
                className="mt-1 block w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[12px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500">
                Propriedade Descrição
              </label>
              <input
                name="description_property"
                type="text"
                defaultValue={integration?.config?.description_property || ""}
                placeholder="(opcional)"
                className="mt-1 block w-full rounded-lg border border-gray-200 px-2.5 py-2 text-[12px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
          </div>
        )}

        {/* Test connection */}
        <div>
          <button
            type="button"
            disabled={isPending}
            onClick={(e) => {
              const form = (e.target as HTMLElement).closest("form")!;
              onTest(new FormData(form));
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788"
              />
            </svg>
            Testar Conexão
          </button>

          {testResult && (
            <div
              className={`mt-2 rounded-lg px-3 py-2 text-[12px] ${
                testResult.error
                  ? "bg-red-50 text-red-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {testResult.error ? (
                <p>Erro: {testResult.error}</p>
              ) : (
                <div>
                  <p className="font-medium">
                    Conectado! {testResult.taskCount} tarefa(s) encontrada(s).
                  </p>
                  {testResult.statuses && testResult.statuses.length > 0 && (
                    <p className="mt-1">
                      Status encontrados:{" "}
                      <span className="font-medium">
                        {testResult.statuses.join(", ")}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status mapping */}
        <div>
          <h4 className="text-[13px] font-medium text-gray-700">
            Mapeamento de Status
          </h4>
          <p className="mt-0.5 text-[11px] text-gray-400">
            Associe cada status interno ao nome do status na plataforma externa
          </p>
          <div className="mt-2 space-y-1.5">
            {statuses
              .filter((s) => s.category !== "cancelled")
              .map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className="flex w-1/2 items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-[12px] font-medium text-gray-700">
                      {s.name}
                    </span>
                  </div>
                  <svg
                    className="h-3.5 w-3.5 flex-shrink-0 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                  <input
                    name={`map_${s.id}`}
                    type="text"
                    defaultValue={
                      integration?.status_mapping?.outbound?.[s.id] || ""
                    }
                    placeholder={`Status no ${meta.label}`}
                    className="w-1/2 rounded-lg border border-gray-200 px-2.5 py-2 text-[12px] transition-all focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Sync enabled */}
        <div className="flex items-center gap-2.5">
          <input
            id="sync_enabled"
            name="sync_enabled"
            type="checkbox"
            defaultChecked={integration?.sync_enabled ?? true}
            className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30"
          />
          <label
            htmlFor="sync_enabled"
            className="text-[13px] font-medium text-gray-700"
          >
            Sincronização ativa
          </label>
        </div>

        {/* Webhook URL info */}
        {platform !== "notion" && !isEdit && (
          <div className="rounded-lg bg-blue-50 px-3 py-2.5 text-[12px] text-blue-700">
            <p className="font-medium">Após salvar:</p>
            <p className="mt-0.5">
              Configure o webhook no {meta.label} apontando para a URL que será
              exibida. Isso permite receber tarefas criadas pelo cliente em tempo
              real.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-brand px-4 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-brand-hover active:bg-brand-active disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2.5 text-[13px] font-medium text-gray-500 transition-colors hover:bg-gray-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
