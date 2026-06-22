import { createClient } from "@/lib/supabase/server";

export default async function ClientDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  const clientId = profile?.client_id;

  const { data: client } = clientId
    ? await supabase
        .from("clients")
        .select("name, billing_day, monthly_request_limit")
        .eq("id", clientId)
        .single()
    : { data: null };

  const { data: requests } = clientId
    ? await supabase
        .from("requests")
        .select("id, title, status, created_at")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10)
    : { data: null };

  const activeRequest = requests?.find((r) => r.status === "in_progress");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Olá{client ? `, ${client.name}` : ""}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Pedido ativo</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {activeRequest ? activeRequest.title : "Nenhum"}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Limite mensal
          </p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {client?.monthly_request_limit ?? "-"} pedido(s)
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Dia de cobrança
          </p>
          <p className="mt-2 text-lg font-semibold text-gray-900">
            {client?.billing_day ? `Dia ${client.billing_day}` : "Não definido"}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Seus pedidos</h2>
        {requests && requests.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Título
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
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                      {req.title}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(req.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            Nenhum pedido encontrado.
          </p>
        )}
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
