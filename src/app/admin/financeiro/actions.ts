"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createInvoice(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const clientId = formData.get("client_id") as string;
  const amount = formData.get("amount") as string;
  const dueDate = formData.get("due_date") as string;
  const referencePeriod = (formData.get("reference_period") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!clientId || !amount || !dueDate) {
    return { error: "Cliente, valor e vencimento são obrigatórios." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.from("invoices").insert({
    client_id: clientId,
    amount: parseFloat(amount),
    due_date: dueDate,
    reference_period: referencePeriod,
    status: "sent",
    notes,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/financeiro");
  redirect("/admin/financeiro");
}

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const supabase = await createClient();

  const update: Record<string, unknown> = { status };
  if (status === "paid") update.paid_at = new Date().toISOString();

  const { error } = await supabase
    .from("invoices")
    .update(update)
    .eq("id", invoiceId);

  if (error) return { error: error.message };
  revalidatePath("/admin/financeiro");
  return {};
}

export async function createExpense(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string } | null> {
  const description = formData.get("description") as string;
  const amount = formData.get("amount") as string;
  const category = (formData.get("category") as string) || null;
  const incurredOn = formData.get("incurred_on") as string;
  const isRecurring = formData.get("is_recurring") === "on";

  if (!description || !amount || !incurredOn) {
    return { error: "Descrição, valor e data são obrigatórios." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase.from("expenses").insert({
    description,
    amount: parseFloat(amount),
    category,
    incurred_on: incurredOn,
    is_recurring: isRecurring,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/financeiro");
  redirect("/admin/financeiro");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/financeiro");
  return {};
}

export async function saveTaxRates(min: number, max: number) {
  if (min < 0 || max > 100 || min > max) return { error: "Faixa de alíquota inválida." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { error } = await supabase
    .from("studio_settings")
    .update({
      tax_rate_min: min,
      tax_rate_max: max,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) return { error: error.message };
  revalidatePath("/admin/financeiro");
  return {};
}
