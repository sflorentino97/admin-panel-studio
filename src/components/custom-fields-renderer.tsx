"use client";

type FieldDef = {
  id: string;
  key: string;
  label: string;
  field_type: string;
  options: string[] | null;
  is_required: boolean;
};

export function CustomFieldsRenderer({
  fields,
  values,
}: {
  fields: FieldDef[];
  values?: Record<string, unknown>;
}) {
  if (fields.length === 0) return null;

  return (
    <fieldset className="rounded-xl border border-gray-200/80 bg-white p-5">
      <legend className="px-2 text-[13px] font-semibold text-gray-900">Campos adicionais</legend>
      <div className="mt-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <FieldInput key={field.id} field={field} value={values?.[field.key]} />
        ))}
      </div>
    </fieldset>
  );
}

function FieldInput({ field, value }: { field: FieldDef; value?: unknown }) {
  const inputCls = "mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10";
  const name = `custom_${field.key}`;

  switch (field.field_type) {
    case "text":
      return (
        <div>
          <Label field={field} />
          <input name={name} type="text" required={field.is_required} defaultValue={(value as string) ?? ""} className={inputCls} />
        </div>
      );
    case "textarea":
      return (
        <div className="sm:col-span-2">
          <Label field={field} />
          <textarea name={name} rows={3} required={field.is_required} defaultValue={(value as string) ?? ""} className={`${inputCls} resize-none`} />
        </div>
      );
    case "number":
      return (
        <div>
          <Label field={field} />
          <input name={name} type="number" required={field.is_required} defaultValue={(value as string) ?? ""} className={inputCls} />
        </div>
      );
    case "date":
      return (
        <div>
          <Label field={field} />
          <input name={name} type="date" required={field.is_required} defaultValue={(value as string) ?? ""} className={inputCls} />
        </div>
      );
    case "url":
      return (
        <div>
          <Label field={field} />
          <input name={name} type="url" required={field.is_required} defaultValue={(value as string) ?? ""} placeholder="https://..." className={inputCls} />
        </div>
      );
    case "checkbox":
      return (
        <div className="flex items-center gap-2.5 pt-6">
          <input name={name} type="checkbox" defaultChecked={!!value} value="true" className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30" />
          <label className="text-[13px] font-medium text-gray-700">
            {field.label}
            {field.is_required && <span className="text-red-400 ml-0.5">*</span>}
          </label>
        </div>
      );
    case "select":
      return (
        <div>
          <Label field={field} />
          <select name={name} required={field.is_required} defaultValue={(value as string) ?? ""} className={`${inputCls} bg-white`}>
            <option value="">Selecione...</option>
            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      );
    case "multiselect":
      return (
        <div className="sm:col-span-2">
          <Label field={field} />
          <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {field.options?.map(opt => (
              <label key={opt} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200/80 px-3 py-2.5 text-[13px] transition-all duration-150 hover:border-gray-300 hover:bg-gray-50/50 has-[:checked]:border-brand/30 has-[:checked]:bg-brand-light/50 has-[:checked]:text-brand">
                <input type="checkbox" name={name} value={opt} defaultChecked={Array.isArray(value) && value.includes(opt)} className="h-3.5 w-3.5 rounded border-gray-300 text-brand focus:ring-brand/30 focus:ring-offset-0" />
                <span className="text-[12px] font-medium leading-none">{opt}</span>
              </label>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
}

function Label({ field }: { field: FieldDef }) {
  return (
    <label className="block text-[13px] font-medium text-gray-600">
      {field.label}
      {field.is_required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}
