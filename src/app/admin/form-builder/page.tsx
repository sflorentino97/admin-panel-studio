import { createClient } from "@/lib/supabase/server";
import { FormBuilderView } from "./form-builder-view";

export default async function FormBuilderPage() {
  const supabase = await createClient();

  const { data: fields } = await supabase
    .from("custom_field_definitions")
    .select("*")
    .order("position");

  return <FormBuilderView fields={fields ?? []} />;
}
