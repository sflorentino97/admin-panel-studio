import type {
  IntegrationAdapter,
  IntegrationConfig,
  ExternalTask,
} from "./types";

const API = "https://app.asana.com/api/1.0";

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

export const asanaAdapter: IntegrationAdapter = {
  async fetchTasks(token, projectGid, _config, since) {
    const params = new URLSearchParams({
      opt_fields:
        "name,notes,memberships.section.name,permalink_url,created_at,modified_at",
    });
    if (since) params.set("modified_since", since.toISOString());

    const res = await fetch(
      `${API}/projects/${projectGid}/tasks?${params}`,
      { headers: headers(token) }
    );
    if (!res.ok) throw new Error(`Asana: ${res.status} ${await res.text()}`);
    const data = await res.json();

    return ((data.data ?? []) as Record<string, unknown>[]).map(
      (t: Record<string, unknown>) => {
        const memberships = t.memberships as {
          section?: { name?: string };
        }[];
        return {
          external_id: t.gid as string,
          title: t.name as string,
          description: (t.notes as string) || null,
          status_name: memberships?.[0]?.section?.name ?? null,
          external_url: (t.permalink_url as string) || null,
        };
      }
    );
  },

  async createTask(token, projectGid, _config, title, description, statusName) {
    const body: Record<string, unknown> = {
      name: title,
      projects: [projectGid],
    };
    if (description) body.notes = description;

    const res = await fetch(`${API}/tasks`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ data: body }),
    });
    if (!res.ok) throw new Error(`Asana create: ${res.status}`);
    const result = await res.json();
    const taskGid = result.data.gid as string;

    if (statusName) {
      const sectionsRes = await fetch(
        `${API}/projects/${projectGid}/sections`,
        { headers: headers(token) }
      );
      if (sectionsRes.ok) {
        const sd = await sectionsRes.json();
        const target = (
          sd.data as { gid: string; name: string }[]
        )?.find((s) => s.name === statusName);
        if (target) {
          await fetch(`${API}/sections/${target.gid}/addTask`, {
            method: "POST",
            headers: headers(token),
            body: JSON.stringify({ data: { task: taskGid } }),
          });
        }
      }
    }

    return {
      external_id: taskGid,
      external_url: (result.data.permalink_url as string) || null,
    };
  },

  async updateTaskStatus(token, taskGid, _config, statusName) {
    const taskRes = await fetch(
      `${API}/tasks/${taskGid}?opt_fields=projects.gid`,
      { headers: headers(token) }
    );
    if (!taskRes.ok) throw new Error(`Asana fetch: ${taskRes.status}`);
    const td = await taskRes.json();
    const projectGid = (
      td.data.projects as { gid: string }[]
    )?.[0]?.gid;
    if (!projectGid) throw new Error("Task has no project");

    const sectionsRes = await fetch(
      `${API}/projects/${projectGid}/sections`,
      { headers: headers(token) }
    );
    if (!sectionsRes.ok) throw new Error(`Asana sections: ${sectionsRes.status}`);
    const sd = await sectionsRes.json();
    const target = (sd.data as { gid: string; name: string }[])?.find(
      (s) => s.name === statusName
    );
    if (!target) throw new Error(`Section "${statusName}" not found`);

    const moveRes = await fetch(`${API}/sections/${target.gid}/addTask`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ data: { task: taskGid } }),
    });
    if (!moveRes.ok) throw new Error(`Asana move: ${moveRes.status}`);
  },

  parseWebhookEvent(body: unknown) {
    const d = body as Record<string, unknown>;
    const events = d?.events as Record<string, unknown>[];
    if (!Array.isArray(events) || events.length === 0) return null;

    const ev = events[0];
    const resource = ev.resource as Record<string, string>;
    if (resource?.resource_type !== "task") return null;

    if (ev.action === "added" || ev.action === "changed") {
      return {
        event_type: (ev.action === "added" ? "created" : "updated") as
          | "created"
          | "updated",
        task: {
          external_id: resource.gid,
          title: resource.name || "",
          description: null,
          status_name: null,
          external_url: null,
        },
      };
    }

    return null;
  },
};
