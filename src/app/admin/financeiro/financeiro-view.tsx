"use client";

import { useState, useTransition, useActionState } from "react";
import {
  createInvoice,
  updateInvoiceStatus,
  createExpense,
  deleteExpense,
  saveTaxRate,
} from "./actions";

type Overview = {
  mrr: number;
  receita_mes: number;
  a_receber: number;
  em_atraso: number;
  despesas_mes: number;
  custos_operacionais: number;
  despesas_variaveis: number;
  tax_rate: number;
  total_clientes_ativos: number;
  receita_mes_anterior: number;
  despesas_mes_anterior: number;
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

type Client = { id: string; name: string; monthly_amount: number | null; plan_name: string | null };

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Rascunho", color: "text-gray-600", bg: "bg-gray-100" },
  sent: { label: "Enviada", color: "text-blue-700", bg: "bg-blue-50" },
  paid: { label: "Paga", color: "text-emerald-700", bg: "bg-emerald-50" },
  overdue: { label: "Atrasada", color: "text-red-700", bg: "bg-red-50" },
  void: { label: "Cancelada", color: "text-gray-500", bg: "bg-gray-50" },
};

const EXPENSE_CATEGORIES = [
  "Software",
  "Salários",
  "Aluguel",
  "Marketing",
  "Equipamento",
  "Impostos",
  "Contabilidade",
  "Internet/Telefone",
  "Outros",
];

function fmt(value: number | string) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pct(value: number) {
  return `${value.toFixed(1)}%`;
}

function delta(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function FinanceiroView({
  overview,
  invoices,
  expenses,
  clients,
  recurringExpenses,
}: {
  overview: Overview;
  invoices: Invoice[];
  expenses: Expense[];
  clients: Client[];
  recurringExpenses: Expense[];
}) {
  const [tab, setTab] = useState<"faturas" | "despesas" | "calculadora" | "previsao">("faturas");
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showNewExpense, setShowNewExpense] = useState(false);

  const mrr = Number(overview?.mrr ?? 0);
  const receita = Number(overview?.receita_mes ?? 0);
  const aReceber = Number(overview?.a_receber ?? 0);
  const emAtraso = Number(overview?.em_atraso ?? 0);
  const despesasTotal = Number(overview?.despesas_mes ?? 0);
  const custosOp = Number(overview?.custos_operacionais ?? 0);
  const despesasVar = Number(overview?.despesas_variaveis ?? 0);
  const taxRate = Number(overview?.tax_rate ?? 10);
  const totalClientes = Number(overview?.total_clientes_ativos ?? 0);
  const receitaAnterior = Number(overview?.receita_mes_anterior ?? 0);
  const despesasAnterior = Number(overview?.despesas_mes_anterior ?? 0);

  const impostos = receita * (taxRate / 100);
  const receitaLiquida = receita - impostos;
  const lucroLiquido = receitaLiquida - despesasTotal;
  const margemLiquida = receita > 0 ? (lucroLiquido / receita) * 100 : 0;
  const margemBruta = receita > 0 ? ((receita - despesasTotal) / receita) * 100 : 0;

  const receitaDelta = delta(receita, receitaAnterior);
  const despesasDelta = delta(despesasTotal, despesasAnterior);

  const tabs = [
    { key: "faturas" as const, label: "Faturas" },
    { key: "despesas" as const, label: "Despesas" },
    { key: "calculadora" as const, label: "Calculadora" },
    { key: "previsao" as const, label: "Previsão" },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Financeiro</h1>
          <p className="mt-0.5 text-[13px] text-gray-500">
            {totalClientes} cliente{totalClientes !== 1 ? "s" : ""} ativo{totalClientes !== 1 ? "s" : ""} · Imposto {pct(taxRate)}
          </p>
        </div>
        <TaxRateEditor initialRate={taxRate} />
      </div>

      {/* KPI Grid — 2 rows */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard label="Receita Bruta" value={fmt(receita)} color="text-emerald-600" dot="bg-emerald-500" delta={receitaDelta} />
        <KPICard label="Impostos" value={fmt(impostos)} sub={pct(taxRate)} color="text-amber-600" dot="bg-amber-500" />
        <KPICard label="Receita Líquida" value={fmt(receitaLiquida)} color="text-blue-600" dot="bg-blue-500" />
        <KPICard label="MRR" value={fmt(mrr)} sub={`${totalClientes} clientes`} color="text-brand" dot="bg-brand" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard label="Custos Operacionais" value={fmt(custosOp)} color="text-orange-600" dot="bg-orange-500" />
        <KPICard label="Despesas Variáveis" value={fmt(despesasVar)} color="text-pink-600" dot="bg-pink-500" delta={despesasDelta} />
        <KPICard label="Lucro Líquido" value={fmt(lucroLiquido)} color={lucroLiquido >= 0 ? "text-emerald-600" : "text-red-600"} dot={lucroLiquido >= 0 ? "bg-emerald-500" : "bg-red-500"} />
        <KPICard label="Margem Líquida" value={pct(margemLiquida)} sub={`Bruta: ${pct(margemBruta)}`} color={margemLiquida >= 0 ? "text-emerald-600" : "text-red-600"} dot={margemLiquida >= 0 ? "bg-emerald-500" : "bg-red-500"} />
      </div>

      {/* Pendências */}
      {(aReceber > 0 || emAtraso > 0) && (
        <div className="mt-4 flex gap-3">
          {aReceber > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-[12px] font-medium text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              A receber: {fmt(aReceber)}
            </div>
          )}
          {emAtraso > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Em atraso: {fmt(emAtraso)}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center rounded-lg border border-gray-200/80 bg-white p-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-4 py-[7px] text-[13px] font-medium transition-all duration-150 ${
                tab === t.key
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "faturas" && (
          <button onClick={() => setShowNewInvoice(!showNewInvoice)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover active:bg-brand-active">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Nova Fatura
          </button>
        )}
        {tab === "despesas" && (
          <button onClick={() => setShowNewExpense(!showNewExpense)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover active:bg-brand-active">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Nova Despesa
          </button>
        )}
      </div>

      {tab === "faturas" && showNewInvoice && <NewInvoiceForm clients={clients} onClose={() => setShowNewInvoice(false)} />}
      {tab === "despesas" && showNewExpense && <NewExpenseForm onClose={() => setShowNewExpense(false)} />}

      <div className="mt-4">
        {tab === "faturas" && <InvoiceList invoices={invoices} />}
        {tab === "despesas" && <ExpenseList expenses={expenses} recurringExpenses={recurringExpenses} />}
        {tab === "calculadora" && <MarginCalculator taxRate={taxRate} custosOp={custosOp} />}
        {tab === "previsao" && <Forecast mrr={mrr} taxRate={taxRate} custosOp={custosOp} despesasVar={despesasVar} clients={clients} />}
      </div>
    </div>
  );
}

// ─── Tax Rate Editor ──────────────────────────────────────────
function TaxRateEditor({ initialRate }: { initialRate: number }) {
  const [editing, setEditing] = useState(false);
  const [rate, setRate] = useState(initialRate);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await saveTaxRate(rate);
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] font-medium text-gray-600 transition-all hover:bg-gray-50 hover:border-gray-300"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        Imposto: {pct(initialRate)}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-brand/20 bg-brand-light/30 px-4 py-3">
      <label className="text-[13px] font-medium text-gray-700 whitespace-nowrap">Alíquota:</label>
      <input
        type="range"
        min={0}
        max={30}
        step={0.5}
        value={rate}
        onChange={(e) => setRate(parseFloat(e.target.value))}
        className="w-32 accent-brand"
      />
      <span className="w-12 text-center text-[14px] font-bold tabular-nums text-brand">{pct(rate)}</span>
      <button
        onClick={handleSave}
        disabled={isPending}
        className="rounded-lg bg-brand px-3 py-1.5 text-[12px] font-medium text-white hover:bg-brand-hover disabled:opacity-50"
      >
        {isPending ? "..." : "Salvar"}
      </button>
      <button
        onClick={() => { setRate(initialRate); setEditing(false); }}
        className="rounded-lg px-2 py-1.5 text-[12px] font-medium text-gray-500 hover:bg-gray-100"
      >
        Cancelar
      </button>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────
function KPICard({ label, value, sub, color, dot, delta: d }: {
  label: string; value: string; sub?: string; color: string; dot: string; delta?: number | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200/80 bg-white p-4 transition-shadow duration-150 hover:shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <p className="text-[12px] font-medium text-gray-500">{label}</p>
      </div>
      <p className={`mt-2 text-lg font-bold tabular-nums tracking-tight ${color}`}>{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {sub && <span className="text-[11px] text-gray-400">{sub}</span>}
        {d != null && (
          <span className={`text-[11px] font-medium ${d >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {d >= 0 ? "+" : ""}{d.toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Margin Calculator ────────────────────────────────────────
function MarginCalculator({ taxRate, custosOp }: { taxRate: number; custosOp: number }) {
  const [valor, setValor] = useState<string>("");
  const [custoExtra, setCustoExtra] = useState<string>("");
  const [horasEstimadas, setHorasEstimadas] = useState<string>("");
  const [custoHora, setCustoHora] = useState<string>("50");

  const v = parseFloat(valor) || 0;
  const extra = parseFloat(custoExtra) || 0;
  const horas = parseFloat(horasEstimadas) || 0;
  const cHora = parseFloat(custoHora) || 0;

  const imposto = v * (taxRate / 100);
  const custoMaoDeObra = horas * cHora;
  const custoTotal = extra + custoMaoDeObra;
  const lucro = v - imposto - custoTotal;
  const margem = v > 0 ? (lucro / v) * 100 : 0;
  const markup = custoTotal > 0 ? ((v - custoTotal) / custoTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <div className="rounded-xl border border-gray-200/80 bg-white p-6">
        <h3 className="text-[15px] font-semibold text-gray-900">Calculadora de Margem</h3>
        <p className="mt-1 text-[12px] text-gray-400">Simule o lucro de um projeto ou serviço</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-gray-600">Valor cobrado (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="5.000,00"
              className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] tabular-nums focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-medium text-gray-600">Horas estimadas</label>
              <input
                type="number"
                min="0"
                value={horasEstimadas}
                onChange={(e) => setHorasEstimadas(e.target.value)}
                placeholder="40"
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] tabular-nums focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-600">Custo/hora (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={custoHora}
                onChange={(e) => setCustoHora(e.target.value)}
                placeholder="50"
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] tabular-nums focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-600">Custos extras do projeto (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={custoExtra}
              onChange={(e) => setCustoExtra(e.target.value)}
              placeholder="500,00"
              className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] tabular-nums focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-3">
        <div className="rounded-xl border border-gray-200/80 bg-white p-6">
          <h3 className="text-[15px] font-semibold text-gray-900">Resultado</h3>
          <div className="mt-4 space-y-3">
            <ResultRow label="Valor cobrado" value={fmt(v)} bold />
            <ResultRow label={`Impostos (${pct(taxRate)})`} value={`- ${fmt(imposto)}`} color="text-amber-600" />
            <ResultRow label="Mão de obra" value={`- ${fmt(custoMaoDeObra)}`} sub={horas > 0 ? `${horas}h × ${fmt(cHora)}` : undefined} color="text-orange-600" />
            <ResultRow label="Custos extras" value={`- ${fmt(extra)}`} color="text-pink-600" />
            <div className="border-t border-gray-100 pt-3">
              <ResultRow label="Lucro" value={fmt(lucro)} color={lucro >= 0 ? "text-emerald-600" : "text-red-600"} bold />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 text-center">
            <p className="text-[11px] font-medium text-gray-500">Margem Líquida</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${margem >= 30 ? "text-emerald-600" : margem >= 15 ? "text-amber-600" : "text-red-600"}`}>
              {pct(margem)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 text-center">
            <p className="text-[11px] font-medium text-gray-500">Markup</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-brand">{pct(markup)}</p>
          </div>
          <div className="rounded-xl border border-gray-200/80 bg-white p-4 text-center">
            <p className="text-[11px] font-medium text-gray-500">Custo Total</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{fmt(custoTotal + imposto)}</p>
          </div>
        </div>

        {/* Margin health indicator */}
        <div className={`rounded-xl p-4 text-[13px] font-medium ${
          margem >= 30
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
            : margem >= 15
              ? "bg-amber-50 text-amber-800 border border-amber-200/60"
              : v > 0
                ? "bg-red-50 text-red-800 border border-red-200/60"
                : "bg-gray-50 text-gray-500 border border-gray-200/60"
        }`}>
          {v === 0
            ? "Preencha o valor para ver a análise"
            : margem >= 30
              ? "Margem saudável — projeto viável com boa rentabilidade"
              : margem >= 15
                ? "Margem apertada — considere renegociar o valor ou reduzir custos"
                : "Margem crítica — projeto pode dar prejuízo, revise os custos"
          }
        </div>
      </div>
    </div>
  );
}

function ResultRow({ label, value, sub, color, bold }: {
  label: string; value: string; sub?: string; color?: string; bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className={`text-[13px] ${bold ? "font-semibold text-gray-900" : "text-gray-600"}`}>{label}</span>
        {sub && <span className="ml-2 text-[11px] text-gray-400">{sub}</span>}
      </div>
      <span className={`text-[13px] tabular-nums font-medium ${color ?? "text-gray-900"}`}>{value}</span>
    </div>
  );
}

// ─── Forecast ─────────────────────────────────────────────────
function Forecast({ mrr, taxRate, custosOp, despesasVar, clients }: {
  mrr: number; taxRate: number; custosOp: number; despesasVar: number; clients: Client[];
}) {
  const [months, setMonths] = useState(6);
  const [growthRate, setGrowthRate] = useState(0);

  const today = new Date();
  const rows = Array.from({ length: months }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
    const growthMultiplier = Math.pow(1 + growthRate / 100, i);
    const receitaProj = mrr * growthMultiplier;
    const impostosProj = receitaProj * (taxRate / 100);
    const receitaLiqProj = receitaProj - impostosProj;
    const despesasProj = custosOp + despesasVar;
    const lucroProj = receitaLiqProj - despesasProj;
    const margemProj = receitaProj > 0 ? (lucroProj / receitaProj) * 100 : 0;
    return {
      month: date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }),
      receita: receitaProj,
      impostos: impostosProj,
      receitaLiq: receitaLiqProj,
      despesas: despesasProj,
      lucro: lucroProj,
      margem: margemProj,
    };
  });

  const acumulado = rows.reduce(
    (acc, r) => ({
      receita: acc.receita + r.receita,
      impostos: acc.impostos + r.impostos,
      despesas: acc.despesas + r.despesas,
      lucro: acc.lucro + r.lucro,
    }),
    { receita: 0, impostos: 0, despesas: 0, lucro: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4">
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-medium text-gray-600">Período:</label>
          <select
            value={months}
            onChange={(e) => setMonths(parseInt(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
          >
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[13px] font-medium text-gray-600">Crescimento mensal:</label>
          <input
            type="range"
            min={-10}
            max={20}
            step={1}
            value={growthRate}
            onChange={(e) => setGrowthRate(parseInt(e.target.value))}
            className="w-28 accent-brand"
          />
          <span className={`w-10 text-center text-[13px] font-bold tabular-nums ${growthRate >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {growthRate >= 0 ? "+" : ""}{growthRate}%
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Base: MRR {fmt(mrr)} · Imposto {pct(taxRate)} · Custos fixos {fmt(custosOp + despesasVar)}/mês
        </div>
      </div>

      {/* Forecast table */}
      <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3 text-left text-[12px] font-medium text-gray-500">Mês</th>
                <th className="px-4 py-3 text-right text-[12px] font-medium text-gray-500">Receita Bruta</th>
                <th className="px-4 py-3 text-right text-[12px] font-medium text-gray-500">Impostos</th>
                <th className="px-4 py-3 text-right text-[12px] font-medium text-gray-500">Receita Líq.</th>
                <th className="px-4 py-3 text-right text-[12px] font-medium text-gray-500">Despesas</th>
                <th className="px-4 py-3 text-right text-[12px] font-medium text-gray-500">Lucro</th>
                <th className="px-4 py-3 text-right text-[12px] font-medium text-gray-500">Margem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r, i) => (
                <tr key={i} className="transition-colors duration-150 hover:bg-gray-50/60">
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-gray-900 capitalize">{r.month}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums text-gray-900">{fmt(r.receita)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums text-amber-600">{fmt(r.impostos)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums text-blue-600">{fmt(r.receitaLiq)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums text-orange-600">{fmt(r.despesas)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums font-medium ${r.lucro >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {fmt(r.lucro)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      r.margem >= 30 ? "bg-emerald-50 text-emerald-700" : r.margem >= 15 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                    }`}>
                      {pct(r.margem)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200 bg-gray-50/50">
                <td className="whitespace-nowrap px-4 py-3 text-[13px] font-bold text-gray-900">Acumulado</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums font-bold text-gray-900">{fmt(acumulado.receita)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums font-bold text-amber-600">{fmt(acumulado.impostos)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums font-bold text-blue-600">{fmt(acumulado.receita - acumulado.impostos)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums font-bold text-orange-600">{fmt(acumulado.despesas)}</td>
                <td className={`whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums font-bold ${acumulado.lucro >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {fmt(acumulado.lucro)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-[13px] tabular-nums font-bold text-gray-500">
                  {acumulado.receita > 0 ? pct((acumulado.lucro / acumulado.receita) * 100) : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Client revenue breakdown */}
      {clients.some((c) => c.monthly_amount) && (
        <div className="rounded-xl border border-gray-200/80 bg-white p-5">
          <h3 className="text-[15px] font-semibold text-gray-900">Receita por cliente</h3>
          <p className="mt-1 text-[12px] text-gray-400">Base para a projeção do MRR</p>
          <div className="mt-4 space-y-2">
            {clients
              .filter((c) => c.monthly_amount && c.monthly_amount > 0)
              .sort((a, b) => (b.monthly_amount ?? 0) - (a.monthly_amount ?? 0))
              .map((c) => {
                const pctMrr = mrr > 0 ? ((c.monthly_amount ?? 0) / mrr) * 100 : 0;
                return (
                  <div key={c.id} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-[11px] font-semibold text-white">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-[13px] font-medium text-gray-900">{c.name}</span>
                        <span className="ml-2 text-[13px] tabular-nums font-medium text-gray-700">{fmt(c.monthly_amount ?? 0)}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand transition-all duration-300"
                          style={{ width: `${Math.min(pctMrr, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right text-[11px] tabular-nums text-gray-400">{pct(pctMrr)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invoice Form & List ──────────────────────────────────────
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
                  <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums font-medium text-gray-900">{fmt(inv.amount)}</td>
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

// ─── Expense Form & List ──────────────────────────────────────
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
          <select name="category" className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[13px] focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10">
            <option value="">Selecione...</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input type="checkbox" name="is_recurring" id="recurring" className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30" />
          <label htmlFor="recurring" className="text-[13px] font-medium text-gray-700">Custo fixo (recorrente)</label>
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

function ExpenseList({ expenses, recurringExpenses }: { expenses: Expense[]; recurringExpenses: Expense[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Remover esta despesa?")) return;
    startTransition(async () => {
      await deleteExpense(id);
    });
  }

  const totalRecurring = recurringExpenses.reduce((s, e) => s + Number(e.amount), 0);

  // Group by category
  const byCategory = new Map<string, number>();
  for (const e of expenses) {
    const cat = e.category ?? "Outros";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + Number(e.amount));
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const totalExpenses = categories.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-4">
      {/* Operational costs summary */}
      {recurringExpenses.length > 0 && (
        <div className="rounded-xl border border-gray-200/80 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900">Custos Operacionais Fixos</h3>
              <p className="mt-0.5 text-[12px] text-gray-400">{recurringExpenses.length} custos recorrentes</p>
            </div>
            <p className="text-lg font-bold tabular-nums text-orange-600">{fmt(totalRecurring)}<span className="text-[12px] font-normal text-gray-400">/mês</span></p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {recurringExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-gray-900">{e.description}</p>
                  {e.category && <p className="text-[11px] text-gray-400">{e.category}</p>}
                </div>
                <span className="ml-2 text-[13px] tabular-nums font-medium text-gray-700">{fmt(e.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categories.length > 0 && (
        <div className="rounded-xl border border-gray-200/80 bg-white p-5">
          <h3 className="text-[15px] font-semibold text-gray-900">Despesas por Categoria</h3>
          <div className="mt-4 space-y-2.5">
            {categories.map(([cat, val]) => {
              const p = totalExpenses > 0 ? (val / totalExpenses) * 100 : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="w-28 truncate text-[13px] font-medium text-gray-700">{cat}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full bg-orange-400 transition-all duration-300" style={{ width: `${p}%` }} />
                  </div>
                  <span className="w-24 text-right text-[13px] tabular-nums font-medium text-gray-700">{fmt(val)}</span>
                  <span className="w-10 text-right text-[11px] tabular-nums text-gray-400">{pct(p)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full expense list */}
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-14">
          <p className="text-[13px] font-medium text-gray-900">Nenhuma despesa</p>
          <p className="mt-1 text-[12px] text-gray-400">Registre suas despesas para ver o lucro</p>
        </div>
      ) : (
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
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums font-medium text-gray-900">{fmt(exp.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-[13px] tabular-nums text-gray-500">{new Date(exp.incurred_on).toLocaleDateString("pt-BR")}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {exp.is_recurring ? (
                        <span className="inline-flex rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700">Fixo</span>
                      ) : (
                        <span className="text-[12px] text-gray-400">Variável</span>
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
      )}
    </div>
  );
}
