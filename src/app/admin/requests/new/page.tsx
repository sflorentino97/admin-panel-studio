import { createClient } from "@/lib/supabase/server";
import { NewRequestForm } from "./new-request-form";

export default async function NewRequestPage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: types }, { data: customFields }] = await Promise.all([
    supabase.from("clients").select("id, name").eq("is_active", true).order("name"),
    supabase.from("request_types").select("id, name").eq("is_active", true).order("name"),
    supabase.from("custom_field_definitions").select("id, key, label, field_type, options, is_required").eq("is_active", true).order("position"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <NewRequestForm clients={clients ?? []} types={types ?? []} customFields={customFields ?? []} />
    </div>
  );
}
