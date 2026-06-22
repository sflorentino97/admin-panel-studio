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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Painel Admin</h1>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Clientes ativos" value={clientCount ?? 0} />
        <StatCard label="Pedidos em andamento" value={activeRequests ?? 0} />
        <StatCard label="Na fila" value={queuedRequests ?? 0} />
      </div>
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
