import { TemplateFieldType } from "@prisma/client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { TemplateFieldEditRow } from "./template-field-edit-row";
import { TemplateFieldReadonlyRow } from "./template-field-readonly-row";

const FIELD_ROW_GRID_CLASS =
  "grid grid-cols-1 gap-3 p-3 sm:p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,5.5rem)_minmax(0,4.5rem)_minmax(0,4rem)_auto] md:items-center md:gap-2";

export type TemplateFieldListItem = {
  id: string;
  key: string;
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
  displayOrder: number;
};

type TemplateFieldsPanelProps = {
  templateId: string;
  fields: TemplateFieldListItem[];
  isDraft: boolean;
};

function FieldsColumnHeader() {
  return (
    <div
      className={cn(
        FIELD_ROW_GRID_CLASS,
        "hidden border-b border-slate-200 bg-slate-50/80 text-xs font-medium text-slate-600 md:grid",
      )}
      aria-hidden="true"
    >
      <span>Placeholder</span>
      <span>Etiqueta</span>
      <span>Tipo</span>
      <span>Requerido</span>
      <span>Orden</span>
      <span className="text-right">Acción</span>
    </div>
  );
}

export function TemplateFieldsPanel({
  templateId,
  fields,
  isDraft,
}: TemplateFieldsPanelProps) {
  const fieldCount = fields.length;

  return (
    <section className="flex flex-col gap-4">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base text-slate-900">
              Campos detectados
            </CardTitle>
            <CardDescription className="text-slate-600">
              {fieldCount} campo{fieldCount === 1 ? "" : "s"}
            </CardDescription>
          </div>
          {isDraft ? (
            <p className="text-sm text-slate-600">
              Cada campo se guarda individualmente.
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="p-0 sm:px-0">
          {fields.length === 0 ? (
            <div className="px-4 pb-6 sm:px-6">
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm font-medium text-slate-900">
                  {isDraft
                    ? "Todavía no hay campos detectados."
                    : "No hay campos configurados."}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {isDraft
                    ? "Primero extrae los placeholders del DOCX."
                    : "Este template no tiene campos configurados."}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <FieldsColumnHeader />
              <ul className="min-w-0">
                {fields.map((field) =>
                  isDraft ? (
                    <TemplateFieldEditRow
                      key={field.id}
                      templateId={templateId}
                      field={{
                        id: field.id,
                        key: field.key,
                        label: field.label,
                        fieldType: field.fieldType,
                        required: field.required,
                        displayOrder: field.displayOrder,
                      }}
                    />
                  ) : (
                    <TemplateFieldReadonlyRow
                      key={field.id}
                      field={{
                        key: field.key,
                        label: field.label,
                        fieldType: field.fieldType,
                        required: field.required,
                        displayOrder: field.displayOrder,
                      }}
                    />
                  ),
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
