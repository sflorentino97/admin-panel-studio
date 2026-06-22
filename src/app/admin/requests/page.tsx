import { createClient } from "@/lib/supabase/server";

export default async function RequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("requests")
    .select(
      "id, title, status, priority, created_at, client_id, clients(name)"
    )
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Demandas</h1>
      <p className="mt-1 text-sm text-gray-500">
        Kanban será implementado no Milestone 3.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Título
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Criado em
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests && requests.length > 0 ? (
              requests.map((req) => (
                <tr key={req.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {req.title}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {(req.clients as unknown as { name: string } | null)?.name ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  Nenhuma demanda encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const statusLabels: Record<string, { label: string; color: string }> = {
  queued: { label: "Na fila", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-700" },
  in_review: { label: "Em revisão", color: "bg-yellow-100 text-yellow-700" },
  done: { label: "Concluído", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusLabels[status] ?? {
    label: status,
    color: "bg-gray-100 text-gray-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}
