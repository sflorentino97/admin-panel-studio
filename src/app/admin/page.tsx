import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: clientCount },
    { data: statuses },
    { count: totalRequests },
    { data: avgMetrics },
    { data: recentRequests },
    { data: financialData },
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("request_statuses").select("id, name, category, color").eq("is_active", true),
    supabase.from("requests").select("*", { count: "exact", head: true }),
    supabase.from("avg_delivery_by_type").select("type_name, completed_count, avg_cycle_time, avg_lead_time"),
    supabase.from("requests")
      .select("id, title, status_id, created_at, clients(name), request_statuses(name, color)")
      .order("created_at", { ascending: false }).limit(5),
    supabase.from("financial_overview").select("mrr, receita_mes, despesas_mes, clientes_com_plano").single(),
  ]);

  const activeStatusIds = (statuses ?? []).filter(s => s.category === "active").map(s => s.id);
  const queuedStatusIds = (statuses ?? []).filter(s => s.category === "backlog").map(s => s.id);
  const doneStatusIds = (statuses ?? []).filter(s => s.category === "done").map(s => s.id);

  const reviewStatusIds = (statuses ?? []).filter(s => s.category === "review").map(s => s.id);
  const activeAndReviewIds = [...activeStatusIds, ...reviewStatusIds];

  const overdueThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const [
    { count: activeRequests },
    { count: queuedRequests },
    { count: doneRequests },
    { data: overdueRequests },
  ] = await Promise.all([
    activeStatusIds.length > 0
      ? supabase.from("requests").select("*", { count: "exact", head: true }).in("status_id", activeStatusIds)
      : { count: 0 },
    queuedStatusIds.length > 0
      ? supabase.from("requests").select("*", { count: "exact", head: true }).in("status_id", queuedStatusIds)
      : { count: 0 },
    doneStatusIds.length > 0
      ? supabase.from("requests").select("*", { count: "exact", head: true }).in("status_id", doneStatusIds)
      : { count: 0 },
    activeAndReviewIds.length > 0
      ? supabase.from("requests")
          .select("id, title, started_at, clients(name)")
          .in("status_id", activeAndReviewIds)
          .not("started_at", "is", null)
          .lt("started_at", overdueThreshold)
          .order("started_at")
          .limit(10)
      : { data: [] },
  ]);

  const completionRate = totalRequests && totalRequests > 0
    ? Math.round(((doneRequests ?? 0) / totalRequests) * 100)
    : 0;

  const statusMap = new Map((statuses ?? []).map(s => [s.id, s]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Painel</h1>
          <p className="mt-0.5 text-sm text-gray-500">Visão geral do studio</p>
        </div>
        <Link
          href="/admin/requests/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover hover:shadow active:bg-brand-active active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nova Demanda
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Clientes ativos" value={clientCount ?? 0} dot="bg-brand" accent="text-brand" />
        <StatCard label="Em andamento" value={activeRequests ?? 0} dot="bg-amber-500" accent="text-amber-600" />
        <StatCard label="Na fila" value={queuedRequests ?? 0} dot="bg-gray-400" accent="text-gray-600" />
        <StatCard label="Concluídas" value={`${completionRate}%`} dot="bg-emerald-500" accent="text-emerald-600" />
      </div>

      {financialData && Number(financialData.mrr) > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            label="MRR"
            value={Number(financialData.mrr).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            dot="bg-emerald-500"
            accent="text-emerald-600"
          />
          <StatCard
            label="Receita do mês"
            value={Number(financialData.receita_mes).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            dot="bg-blue-500"
            accent="text-blue-600"
          />
          <StatCard
            label="Despesas do mês"
            value={Number(financialData.despesas_mes).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            dot="bg-orange-500"
            accent="text-orange-600"
          />
        </div>
      )}

      {overdueRequests && overdueRequests.length > 0 && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <h2 className="text-[14px] font-semibold text-red-800">
              {overdueRequests.length} {overdueRequests.length === 1 ? "demanda atrasada" : "demandas atrasadas"} (acima de 48h)
            </h2>
          </div>
          <ul className="mt-3 space-y-1.5">
            {overdueRequests.map((r) => {
              const hoursOver = Math.floor((Date.now() - new Date(r.started_at!).getTime() - 48 * 60 * 60 * 1000) / (60 * 60 * 1000));
              return (
                <li key={r.id}>
                  <Link href={`/admin/requests/${r.id}`} className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-red-100/60">
                    <div className="min-w-0 flex-1">
                      <span className="text-[13px] font-medium text-red-900">{r.title}</span>
                      <span className="ml-2 text-[12px] text-red-600">{(r.clients as unknown as { name: string })?.name}</span>
                    </div>
                    <span className="ml-3 flex-shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                      +{hoursOver}h atraso
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-gray-900">Recentes</h2>
            <Link href="/admin/requests" className="text-[13px] font-medium text-brand transition-colors hover:text-brand-hover">
              Ver todas
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200/80 bg-white">
            {recentRequests && recentRequests.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentRequests.map((r) => {
                  const st = r.request_statuses as unknown as { name: string; color: string } | null;
                  return (
                    <li key={r.id}>
                      <Link href={`/admin/requests/${r.id}`} className="flex items-center justify-between px-4 py-3 transition-colors duration-150 hover:bg-gray-50/80">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium text-gray-900">{r.title}</p>
                          <p className="mt-0.5 text-[12px] text-gray-400">
                            {(r.clients as unknown as { name: string } | null)?.name ?? "—"} · {new Date(r.created_at).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="ml-3 flex items-center gap-1.5 flex-shrink-0">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: st?.color ?? "#9ca3af" }} />
                          <span className="text-[12px] font-medium text-gray-500">{st?.name ?? "—"}</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] text-gray-400">Nenhuma demanda ainda</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-[15px] font-semibold text-gray-900">Tempo médio por tipo</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-gray-200/80 bg-white">
            {avgMetrics && avgMetrics.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Tipo</th>
                      <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Feitos</th>
                      <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Execução</th>
                      <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {avgMetrics.map((m, i) => (
                      <tr key={i} className="transition-colors duration-150 hover:bg-gray-50/60">
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-gray-900">{m.type_name ?? "Sem tipo"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-gray-500">{m.completed_count}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-gray-500">{formatInterval(m.avg_cycle_time)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-gray-500">{formatInterval(m.avg_lead_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] text-gray-400">Sem dados de conclusão ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, dot, accent }: { label: string; value: number | string; dot: string; accent: string }) {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-4 transition-shadow duration-150 hover:shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <p className="text-[12px] font-medium text-gray-500">{label}</p>
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums tracking-tight ${accent}`}>{value}</p>
    </div>
  );
}

function formatInterval(interval: string | null): string {
  if (!interval) return "—";
  const match = interval.match(/(?:(\d+)\s*days?\s*)?(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return interval;
  const days = parseInt(match[1] || "0");
  const hours = parseInt(match[2]);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${match[3]}m`;
  return `${match[3]}m`;
}
