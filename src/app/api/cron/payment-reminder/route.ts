import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.EMAIL_FROM ?? "noreply@comunick.com.br";

  const today = new Date();
  const todayDay = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const todayISO = today.toISOString().slice(0, 10);
  const currentPeriod = `${todayYear}-${String(todayMonth + 1).padStart(2, "0")}`;

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, name, email, billing_day, payment_reminder_days_before, monthly_amount")
    .eq("is_active", true)
    .not("billing_day", "is", null)
    .not("email", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  let invoicesCreated = 0;

  for (const client of clients ?? []) {
    const billingDay = client.billing_day!;
    const reminderDaysBefore = client.payment_reminder_days_before ?? 3;

    // Auto-generate invoice for clients with monthly_amount
    if (client.monthly_amount && client.monthly_amount > 0) {
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("client_id", client.id)
        .eq("reference_period", currentPeriod)
        .maybeSingle();

      if (!existingInvoice) {
        let dueDateObj = new Date(todayYear, todayMonth, billingDay);
        if (dueDateObj < today) {
          dueDateObj = new Date(todayYear, todayMonth + 1, billingDay);
        }
        const dueDate = dueDateObj.toISOString().slice(0, 10);

        await supabase.from("invoices").insert({
          client_id: client.id,
          amount: client.monthly_amount,
          due_date: dueDate,
          reference_period: currentPeriod,
          status: "sent",
        });
        invoicesCreated++;
      }
    }

    // Payment reminder email
    let billingDate = new Date(todayYear, todayMonth, billingDay);
    if (billingDate <= today) {
      billingDate = new Date(todayYear, todayMonth + 1, billingDay);
    }

    const diffMs = billingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays !== reminderDaysBefore) {
      skipped++;
      continue;
    }

    const referencePeriod = `${billingDate.getFullYear()}-${String(billingDate.getMonth() + 1).padStart(2, "0")}`;

    const { data: existing } = await supabase
      .from("notifications_log")
      .select("id")
      .eq("client_id", client.id)
      .eq("type", "payment_reminder")
      .eq("reference_period", referencePeriod)
      .maybeSingle();

    if (existing) {
      skipped++;
      continue;
    }

    const { error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: client.email,
      subject: `Lembrete de pagamento - Vencimento dia ${billingDay}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Lembrete de Pagamento</h2>
          <p>Olá <strong>${client.name}</strong>,</p>
          <p>Este é um lembrete de que o seu pagamento vence no dia <strong>${billingDay}</strong> deste mês.</p>
          <p>Se já realizou o pagamento, por favor desconsidere este e-mail.</p>
          <br/>
          <p style="color: #6b7280; font-size: 14px;">— Studio de Design</p>
        </div>
      `,
    });

    if (emailError) {
      console.error(`Failed to send email to ${client.email}:`, emailError);
      continue;
    }

    await supabase.from("notifications_log").insert({
      client_id: client.id,
      type: "payment_reminder",
      reference_period: referencePeriod,
      channel: "email",
    });

    sent++;
  }

  // Mark overdue invoices
  const { count: overdueCount } = await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .eq("status", "sent")
    .lt("due_date", todayISO);

  return NextResponse.json({
    sent,
    skipped,
    invoicesCreated,
    overdueMarked: overdueCount ?? 0,
    total: clients?.length ?? 0,
  });
}
