"use client";

import { useState, useTransition, useActionState } from "react";
import { createInvoice, updateInvoiceStatus, createExpense, deleteExpense } from "./actions";

type Overview = {
  mrr: number;
  receita_mes: number;
  a_receber: number;
  em_atraso: number;
  despesas_mes: number;
} | null;

type Invoice = {
  id: string;
  client_id: string;
  amount: number;
  currency: string;
  status: string;
  reference_period: string | null;
  due_date: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  clients: { name: string } | null;
};

type Expense = {
  id: string;
  description: string;
  category: string | null;
  amount: number;
  currency: string;
  incurred_on: string;
  is_recurring: boolean;
};

type Client = { id: string; name: string };

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Rascunho", color: "text-gray-600", bg: "bg-gray-100" },
  sent: { label: "Enviada", color: "text-blue-700", bg: "bg-blue-50" },
  paid: { label: "Paga", color: "text-emerald-700", bg: "bg-emerald-50" },
  overdue: { label: "Atrasada", color: "text-red-700", bg: "bg-red-50" },
  void: { label: "Cancelada", color: "text-gray-500", bg: "bg-gray-50" },
};

function formatCurrency(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FinanceiroView({
  overview,
  invoices,
  expenses,
  clients,
}: {
  overview: Overview;
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
}) {
  const [tab, setTab] = useState<"faturas" | "despesas">("faturas");
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);

  const mrr = Number(overview?.mrr ?? 0);
  const receita = Number(overview?.receita_mes ?? 0);
  const aReceber = Number(overview?.a_receber ?? 0);
  const emAtraso = Number(overview?.em_atraso ?? 0);
  const despesas = Number(overview?.despesas_mes ?? 0);
  const lucro = receita - despesas;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Financeiro</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">Visão geral de receitas e despesas</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KPICard label="MRR" value={formatCurrency(mrr)} color="text-brand" dot="bg-brand" />
        <KPICard label="Receita (mês)" value={formatCurrency(receita)} color="text-emerald-600" dot="bg-emerald-500" />
        <KPICard label="A receber" value={formatCurrency(aReceber)} color="text-blue-600" dot="bg-blue-500" />
        <KPICard label="Em atraso" value={formatCurrency(emAtraso)} color="text-red-600" dot="bg-red-500" />
        <KPICard label="Despesas (mês)" value={formatCurrency(despesas)} color="text-orange-600" dot="bg-orange-500" />
        <KPICard label="Lucro (mês)" value={formatCurrency(lucro)} color={lucro >= 0 ? "text-emerald-600" : "text-red-600"} dot={lucro >= 0 ? "bg-emerald-500" : "bg-red-500"} />
      </div>

      {/* Tabs */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center rounded-lg border border-gray-200/80 bg-white p-0.5">
          <button onClick={() => setTab("faturas")} className={`rounded-md px-4 py-[7px] text-[13px] font-medium transition-all duration-150 ${tab === "faturas" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Faturas
          </button>
          <button onClick={() => setTab("despesas")} className={`rounded-md px-4 py-[7px] text-[13px] font-medium transition-all duration-150 ${tab === "despesas" ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            Despesas
          </button>
        </div>
        {tab === "faturas" ? (
          <button onClick={() => setShowNewInvoice(!showNewInvoice)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover active:bg-brand-active">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Nova Fatura
          </button>
        ) : (
          <button onClick={() => setShowNewExpense(!showNewExpense)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover active:bg-brand-active">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Nova Despesa
          </button>
        )}
      </div>

      {tab === "faturas" && showNewInvoice && <NewInvoiceForm clients={clients} onClose={() => setShowNewInvoice(false)} />}
      {tab === "despesas" && showNewExpense && <NewExpenseForm onClose={() => setShowNewExpense(false)} />}

      <div className="mt-4">
        {tab === "faturas" ? <InvoiceList invoices={invoices} /> : <ExpenseList expenses={expenses} />}
      </div>
    </div>
  );
}

function KPICard({ label, value, color, dot }: { label: string; value: string; color: string; dot: string }) {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-4 transition-shadow duration-150 hover:shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <p className="text-[12px] font-medium text-gray-500">{label}</p>
      </div>
      <p className={`mt-2 text-lg font-bold tabular-nums tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

function NewInvoiceForm({ clients, onClose }: { clients: Client[]; onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createInvoice, null);

  return (
    <form action={formAction} className="mt-4 rounded-xl border border-brand/20 bg-brand-light/30 p-5 space-y-4">
      <h3 className="text-[15px] font-semibold text-gray-900">Nova fatura</h3>
      {state?.error && <p className="text-[13px] text-red-600">{state.error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-600">Cliente <span className="text-red-400">*</span></label>
          <select name="client_id" required className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10">
            <option value="">Selecione...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-600">Valor (R$) <span className="text-red-400">*</span></label>
          <input name="amount" type="number" step="0.01" min="0" required placeholder="0,00" className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-600">Vencimento <span className="text-red-400">*</span></label>
          <input name="due_date" type="date" required className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-600">Período (ex: 2026-07)</label>
          <input name="reference_period" type="text" placeholder="2026-07" className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>
      </div>
      <div>
        <label className="block text-[13px] font-medium text-gray-600">Observações</label>
        <input name="notes" type="text" className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-hover disabled:opacity-50">
          {pending ? "Criando..." : "Criar Fatura"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100">Cancelar</button>
      </div>
    </form>
  );
}

function NewExpenseForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(createExpense, null);

  return (
    <form action={formAction} className="mt-4 rounded-xl border border-brand/20 bg-brand-light/30 p-5 space-y-4">
      <h3 className="text-[15px] font-semibold text-gray-900">Nova despesa</h3>
      {state?.error && <p className="text-[13px] text-red-600">{state.error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="block text-[13px] font-medium text-gray-600">Descrição <span className="text-red-400">*</span></label>
          <input name="description" type="text" required placeholder="Ex: Licença Adobe" className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-600">Valor (R$) <span className="text-red-400">*</span></label>
          <input name="amount" type="number" step="0.01" min="0" required className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-600">Data <span className="text-red-400">*</span></label>
          <input name="incurred_on" type="date" required className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-600">Categoria</label>
          <input name="category" type="text" placeholder="Ex: Software" className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input type="checkbox" name="is_recurring" id="recurring" className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30" />
          <label htmlFor="recurring" className="text-[13px] font-medium text-gray-700">Recorrente</label>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-medium text-white hover:bg-brand-hover disabled:opacity-50">
          {pending ? "Criando..." : "Criar Despesa"}
        </button>
        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100">Cancelar</button>
      </div>
    </form>
  );
}

function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      await updateInvoiceStatus(id, status);
    });
  }

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-14">
        <p className="text-[13px] font-medium text-gray-900">Nenhuma fatura</p>
        <p className="mt-1 text-[12px] text-gray-400">Crie sua primeira fatura</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Cliente</th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Valor</th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Vencimento</th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Período</th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map((inv) => {
              const st = STATUS_LABELS[inv.status] ?? STATUS_LABELS.draft;
              const clientName = (inv.clients as unknown as { name: string } | null)?.name ?? "—";
              return (
                <tr key={inv.id} className="transition-colors duration-150 hover:bg-gray-50/60">
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-gray-900">{clientName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums font-medium text-gray-900">{formatCurrency(inv.amount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-gray-500">{new Date(inv.due_date).toLocaleDateString("pt-BR")}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-500">{inv.reference_period ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${st.bg} ${st.color}`}>{st.label}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-1">
                      {inv.status !== "paid" && inv.status !== "void" && (
                        <button
                          onClick={() => handleStatusChange(inv.id, "paid")}
                          disabled={isPending}
                          className="rounded-md px-2 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                        >
                          Marcar paga
                        </button>
                      )}
                      {inv.status !== "void" && inv.status !== "paid" && (
                        <button
                          onClick={() => handleStatusChange(inv.id, "void")}
                          disabled={isPending}
                          className="rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Remover esta despesa?")) return;
    startTransition(async () => {
      await deleteExpense(id);
    });
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-14">
        <p className="text-[13px] font-medium text-gray-900">Nenhuma despesa</p>
        <p className="mt-1 text-[12px] text-gray-400">Registre suas despesas para ver o lucro</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Descrição</th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Categoria</th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Valor</th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Data</th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Tipo</th>
              <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {expenses.map((exp) => (
              <tr key={exp.id} className="transition-colors duration-150 hover:bg-gray-50/60">
                <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-gray-900">{exp.description}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] text-gray-500">{exp.category ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums font-medium text-gray-900">{formatCurrency(exp.amount)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-gray-500">{new Date(exp.incurred_on).toLocaleDateString("pt-BR")}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {exp.is_recurring ? (
                    <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">Recorrente</span>
                  ) : (
                    <span className="text-[12px] text-gray-400">Único</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <button
                    onClick={() => handleDelete(exp.id)}
                    disabled={isPending}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
