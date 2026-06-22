import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { count: clientCount } = await supabase
    .from("clients")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  const { count: activeRequests } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "in_progress");

  const { count: queuedRequests } = await supabase
    .from("requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "queued");

  const { data: avgMetrics } = await supabase
    .from("avg_delivery_by_type")
    .select("type_name, completed_count, avg_cycle_time, avg_lead_time");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Clientes ativos" value={clientCount ?? 0} />
        <StatCard label="Pedidos em andamento" value={activeRequests ?? 0} />
        <StatCard label="Na fila" value={queuedRequests ?? 0} />
      </div>

      {avgMetrics && avgMetrics.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Tempo médio por tipo de demanda
          </h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Concluídos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tempo de execução
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Tempo total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {avgMetrics.map((m, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {m.type_name ?? "Sem tipo"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {m.completed_count}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {formatInterval(m.avg_cycle_time)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {formatInterval(m.avg_lead_time)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function formatInterval(interval: string | null): string {
  if (!interval) return "-";
  const match = interval.match(
    /(?:(\d+)\s*days?\s*)?(\d{2}):(\d{2}):(\d{2})/
  );
  if (!match) return interval;
  const days = parseInt(match[1] || "0");
  const hours = parseInt(match[2]);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${match[3]}min`;
  return `${match[3]}min`;
}
