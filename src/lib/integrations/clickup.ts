import type {
  IntegrationAdapter,
  IntegrationConfig,
  ExternalTask,
} from "./types";

const API = "https://api.clickup.com/api/v2";

function headers(token: string) {
  return { Authorization: token, "Content-Type": "application/json" };
}

export const clickupAdapter: IntegrationAdapter = {
  async fetchTasks(token, listId, _config, since) {
    const params = new URLSearchParams({
      include_closed: "true",
      subtasks: "false",
    });
    if (since) params.set("date_updated_gt", since.getTime().toString());

    const res = await fetch(`${API}/list/${listId}/task?${params}`, {
      headers: headers(token),
    });
    if (!res.ok) throw new Error(`ClickUp: ${res.status} ${await res.text()}`);
    const data = await res.json();

    return ((data.tasks ?? []) as Record<string, unknown>[]).map(
      (t: Record<string, unknown>) => ({
        external_id: t.id as string,
        title: t.name as string,
        description: (t.description as string) || null,
        status_name:
          (t.status as Record<string, string>)?.status ?? null,
        external_url: (t.url as string) || null,
      })
    );
  },

  async createTask(token, listId, _config, title, description, statusName) {
    const body: Record<string, unknown> = { name: title };
    if (description) body.description = description;
    if (statusName) body.status = statusName;

    const res = await fetch(`${API}/list/${listId}/task`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`ClickUp create: ${res.status}`);
    const task = await res.json();
    return {
      external_id: task.id,
      external_url: task.url ?? null,
    };
  },

  async updateTaskStatus(token, taskId, _config, statusName) {
    const res = await fetch(`${API}/task/${taskId}`, {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify({ status: statusName }),
    });
    if (!res.ok) throw new Error(`ClickUp update: ${res.status}`);
  },

  parseWebhookEvent(body: unknown) {
    const d = body as Record<string, unknown>;
    if (!d?.event || !d?.task_id) return null;

    const items = d.history_items as Record<string, Record<string, string>>[];

    if (d.event === "taskCreated") {
      return {
        event_type: "created" as const,
        task: {
          external_id: d.task_id as string,
          title: items?.[0]?.after?.name || "Nova tarefa",
          description: null,
          status_name: items?.[0]?.after?.status ?? null,
          external_url: null,
        },
      };
    }

    if (d.event === "taskStatusUpdated") {
      return {
        event_type: "updated" as const,
        task: {
          external_id: d.task_id as string,
          title: "",
          description: null,
          status_name: items?.[0]?.after?.status ?? null,
          external_url: null,
        },
      };
    }

    return null;
  },
};
