import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: clientCount },
    { count: activeRequests },
    { count: queuedRequests },
    { count: doneRequests },
    { count: totalRequests },
    { data: avgMetrics },
    { data: recentRequests },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "queued"),
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "done"),
    supabase.from("requests").select("*", { count: "exact", head: true }),
    supabase.from("avg_delivery_by_type").select("type_name, completed_count, avg_cycle_time, avg_lead_time"),
    supabase.from("requests").select("id, title, status, created_at, clients(name)").order("created_at", { ascending: false }).limit(5),
  ]);

  const completionRate = totalRequests && totalRequests > 0
    ? Math.round(((doneRequests ?? 0) / totalRequests) * 100)
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel</h1>
          <p className="mt-1 text-sm text-gray-500">Visão geral do studio</p>
        </div>
        <Link
          href="/admin/requests/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Nova Demanda
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Clientes ativos"
          value={clientCount ?? 0}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
          color="blue"
        />
        <StatCard
          label="Em andamento"
          value={activeRequests ?? 0}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>}
          color="yellow"
        />
        <StatCard
          label="Na fila"
          value={queuedRequests ?? 0}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="gray"
        />
        <StatCard
          label="Taxa de conclusão"
          value={`${completionRate}%`}
          icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          color="green"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent requests */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Demandas recentes</h2>
            <Link href="/admin/requests" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
              Ver todas
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {recentRequests && recentRequests.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentRequests.map((r) => {
                  const statusCfg = getStatusConfig(r.status);
                  return (
                    <li key={r.id} className="px-4 py-3 transition-colors hover:bg-gray-50">
                      <Link href={`/admin/requests/${r.id}`} className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{r.title}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {(r.clients as unknown as { name: string } | null)?.name ?? "—"} · {new Date(r.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <span className={`ml-3 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Nenhuma demanda.</p>
            )}
          </div>
        </div>

        {/* Avg metrics */}
        <div>
          <h2 className="text-base font-semibold text-gray-900">Tempo médio por tipo</h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {avgMetrics && avgMetrics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tipo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Concluídos</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Execução</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {avgMetrics.map((m, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                          {m.type_name ?? "Sem tipo"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{m.completed_count}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{formatInterval(m.avg_cycle_time)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{formatInterval(m.avg_lead_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-gray-400">Sem dados de conclusão ainda.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const statusConfigs: Record<string, { label: string; color: string }> = {
  queued: { label: "Na fila", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "Em andamento", color: "bg-blue-100 text-blue-700" },
  in_review: { label: "Em revisão", color: "bg-yellow-100 text-yellow-700" },
  done: { label: "Concluído", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

function getStatusConfig(status: string) {
  return statusConfigs[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: "blue" | "yellow" | "gray" | "green";
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    yellow: "bg-yellow-50 text-yellow-600",
    gray: "bg-gray-100 text-gray-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function formatInterval(interval: string | null): string {
  if (!interval) return "-";
  const match = interval.match(/(?:(\d+)\s*days?\s*)?(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return interval;
  const days = parseInt(match[1] || "0");
  const hours = parseInt(match[2]);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${match[3]}min`;
  return `${match[3]}min`;
}
