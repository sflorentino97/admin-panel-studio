import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, email, phone, is_active, billing_day, created_at")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Clientes</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            {clients?.length ?? 0} cliente{(clients?.length ?? 0) !== 1 ? "s" : ""} cadastrado{(clients?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover hover:shadow active:bg-brand-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Cliente
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200/80 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">E-mail</th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500 hidden sm:table-cell">Telefone</th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500 hidden md:table-cell">Cobrança</th>
                <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients && clients.length > 0 ? (
                clients.map((client) => (
                  <tr key={client.id} className="transition-colors duration-150 hover:bg-gray-50/60">
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium">
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="flex items-center gap-2.5 text-gray-900 hover:text-brand transition-colors"
                      >
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-[11px] font-semibold text-white">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        {client.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-500">
                      {client.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-500 hidden sm:table-cell">
                      {client.phone ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-gray-500 hidden md:table-cell">
                      {client.billing_day ? `Dia ${client.billing_day}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${client.is_active ? "bg-emerald-500" : "bg-gray-400"}`} />
                        <span className="text-[12px] font-medium text-gray-600">
                          {client.is_active ? "Ativo" : "Inativo"}
                        </span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-gray-100">
                      <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <p className="mt-3 text-[13px] font-medium text-gray-900">Nenhum cliente</p>
                    <p className="mt-1 text-[12px] text-gray-400">Cadastre seu primeiro cliente para começar</p>
                    <Link href="/admin/clients/new" className="mt-3 inline-block text-[13px] font-medium text-brand hover:text-brand-hover transition-colors">
                      Cadastrar cliente
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
