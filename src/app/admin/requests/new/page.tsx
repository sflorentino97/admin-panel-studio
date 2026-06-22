import { createClient } from "@/lib/supabase/server";
import { NewRequestForm } from "./new-request-form";

export default async function NewRequestPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  const { data: types } = await supabase
    .from("request_types")
    .select("id, name")
    .eq("is_active", true)
    .order("name");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Nova Demanda</h1>
      <NewRequestForm clients={clients ?? []} types={types ?? []} />
    </div>
  );
}
