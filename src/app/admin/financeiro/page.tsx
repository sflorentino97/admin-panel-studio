import { createClient } from "@/lib/supabase/server";
import { FinanceiroView } from "./financeiro-view";

export default async function FinanceiroPage() {
  const supabase = await createClient();

  const [
    { data: overview },
    { data: invoices },
    { data: expenses },
    { data: clients },
  ] = await Promise.all([
    supabase.from("financial_overview").select("*").single(),
    supabase
      .from("invoices")
      .select("id, client_id, amount, currency, status, reference_period, due_date, paid_at, notes, created_at, clients(name)")
      .order("due_date", { ascending: false })
      .limit(50),
    supabase
      .from("expenses")
      .select("*")
      .order("incurred_on", { ascending: false })
      .limit(50),
    supabase
      .from("clients")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  const mappedInvoices = (invoices ?? []).map((inv) => ({
    ...inv,
    clients: (inv.clients as unknown as { name: string }[] | null)?.[0] ?? null,
  }));

  return (
    <FinanceiroView
      overview={overview}
      invoices={mappedInvoices}
      expenses={expenses ?? []}
      clients={clients ?? []}
    />
  );
}
