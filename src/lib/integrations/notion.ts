import type {
  IntegrationAdapter,
  IntegrationConfig,
  ExternalTask,
} from "./types";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
}

function plainText(richText: { plain_text?: string }[]): string {
  return (richText || []).map((t) => t.plain_text ?? "").join("");
}

export const notionAdapter: IntegrationAdapter = {
  async fetchTasks(token, databaseId, config, since) {
    const body: Record<string, unknown> = { page_size: 100 };
    if (since) {
      body.filter = {
        timestamp: "last_edited_time",
        last_edited_time: { on_or_after: since.toISOString() },
      };
    }

    const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Notion: ${res.status} ${await res.text()}`);
    const data = await res.json();

    const titleProp = config.title_property || "Name";
    const statusProp = config.status_property || "Status";
    const descProp = config.description_property;

    return (data.results as Record<string, unknown>[]).map(
      (page: Record<string, unknown>) => {
        const props = page.properties as Record<string, Record<string, unknown>>;
        const tf = props[titleProp];
        const sf = props[statusProp];
        const df = descProp ? props[descProp] : null;

        return {
          external_id: page.id as string,
          title: tf?.title
            ? plainText(tf.title as { plain_text?: string }[])
            : "Sem título",
          description: df?.rich_text
            ? plainText(df.rich_text as { plain_text?: string }[])
            : null,
          status_name:
            (sf?.status as Record<string, string>)?.name ??
            (sf?.select as Record<string, string>)?.name ??
            null,
          external_url: page.url as string | null,
        };
      }
    );
  },

  async createTask(token, databaseId, config, title, description, statusName) {
    const titleProp = config.title_property || "Name";
    const statusProp = config.status_property || "Status";
    const descProp = config.description_property;

    const properties: Record<string, unknown> = {
      [titleProp]: { title: [{ text: { content: title } }] },
    };
    if (statusName) {
      properties[statusProp] = { status: { name: statusName } };
    }
    if (descProp && description) {
      properties[descProp] = {
        rich_text: [{ text: { content: description } }],
      };
    }

    const res = await fetch(`${NOTION_API}/pages`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });
    if (!res.ok) throw new Error(`Notion create: ${res.status}`);
    const page = await res.json();
    return {
      external_id: page.id,
      external_url: page.url ?? null,
    };
  },

  async updateTaskStatus(token, pageId, config, statusName) {
    const statusProp = config.status_property || "Status";
    const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({
        properties: { [statusProp]: { status: { name: statusName } } },
      }),
    });
    if (!res.ok) throw new Error(`Notion update: ${res.status}`);
  },

  parseWebhookEvent() {
    return null;
  },
};
