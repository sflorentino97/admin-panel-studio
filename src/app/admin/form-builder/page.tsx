import { requireAdmin } from "@/lib/auth-guard";
import { FormBuilderView } from "./form-builder-view";

export default async function FormBuilderPage() {
  const { supabase } = await requireAdmin();

  const { data: fields } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .order("position");

  return <FormBuilderView fields={fields ?? []} />;
}
