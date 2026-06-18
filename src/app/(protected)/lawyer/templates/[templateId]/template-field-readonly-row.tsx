import type { ReactNode } from "react";

import { TemplateFieldType } from "@prisma/client";

const FIELD_ROW_GRID_CLASS =
  "grid grid-cols-1 gap-3 p-3 sm:p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,5.5rem)_minmax(0,4.5rem)_minmax(0,4rem)_auto] md:items-center md:gap-2";

export type TemplateFieldForReadonly = {
  key: string;
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
  displayOrder: number;
};

type TemplateFieldReadonlyRowProps = {
  field: TemplateFieldForReadonly;
};

function MobileFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-0.5 block text-xs font-medium text-slate-500 md:hidden">
      {children}
    </span>
  );
}

export function TemplateFieldReadonlyRow({ field }: TemplateFieldReadonlyRowProps) {
  return (
    <li
      data-field-row
      className="border-b border-slate-200 last:border-b-0 odd:bg-white even:bg-slate-50/50"
    >
      <div className={FIELD_ROW_GRID_CLASS}>
        <div className="min-w-0">
          <MobileFieldLabel>Placeholder</MobileFieldLabel>
          <p
            className="truncate font-mono text-sm text-slate-700"
            title={field.key}
          >
            {field.key}
          </p>
        </div>
        <div className="min-w-0">
          <MobileFieldLabel>Etiqueta</MobileFieldLabel>
          <p className="text-sm text-slate-900">{field.label}</p>
        </div>
        <div className="min-w-0">
          <MobileFieldLabel>Tipo</MobileFieldLabel>
          <p className="text-sm text-slate-900">{field.fieldType}</p>
        </div>
        <div className="min-w-0">
          <MobileFieldLabel>Requerido</MobileFieldLabel>
          <p className="text-sm text-slate-900">
            {field.required ? "Sí" : "No"}
          </p>
        </div>
        <div className="min-w-0">
          <MobileFieldLabel>Orden</MobileFieldLabel>
          <p className="text-sm text-slate-900">{field.displayOrder}</p>
        </div>
        <div className="hidden md:block" aria-hidden="true" />
      </div>
    </li>
  );
}
