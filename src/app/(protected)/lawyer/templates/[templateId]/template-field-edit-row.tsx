"use client";

import { TemplateFieldType } from "@prisma/client";
import type { ReactNode } from "react";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  updateTemplateFieldAction,
  type UpdateTemplateFieldActionState,
} from "../actions";

export type TemplateFieldForEdit = {
  id: string;
  key: string;
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
  displayOrder: number;
};

type TemplateFieldEditRowProps = {
  templateId: string;
  field: TemplateFieldForEdit;
};

const FIELD_TYPE_OPTIONS: TemplateFieldType[] = [
  TemplateFieldType.TEXT,
  TemplateFieldType.DATE,
  TemplateFieldType.NUMBER,
  TemplateFieldType.BOOLEAN,
];

export const FIELD_ROW_GRID_CLASS =
  "grid grid-cols-1 gap-3 p-3 sm:p-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,5.5rem)_minmax(0,4.5rem)_minmax(0,4rem)_auto] md:items-center md:gap-2";

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

const checkboxClassName =
  "size-4 shrink-0 rounded border border-input accent-primary outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

function MobileFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block text-xs font-medium text-slate-500 md:hidden">
      {children}
    </span>
  );
}

export function TemplateFieldEditRow({
  templateId,
  field,
}: TemplateFieldEditRowProps) {
  const [state, formAction, isPending] = useActionState<
    UpdateTemplateFieldActionState | undefined,
    FormData
  >(updateTemplateFieldAction, undefined);

  const labelId = `field-label-${field.id}`;
  const fieldTypeId = `field-type-${field.id}`;
  const requiredId = `field-required-${field.id}`;
  const displayOrderId = `field-display-order-${field.id}`;

  return (
    <li
      data-field-row
      className="border-b border-slate-200 last:border-b-0 odd:bg-white even:bg-slate-50/40"
    >
      <form action={formAction}>
        <input type="hidden" name="fieldId" value={field.id} />
        <input type="hidden" name="templateId" value={templateId} />
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
            <Label htmlFor={labelId} className="mb-1 md:sr-only">
              Etiqueta
            </Label>
            <MobileFieldLabel>Etiqueta</MobileFieldLabel>
            <Input
              id={labelId}
              name="label"
              type="text"
              required
              maxLength={120}
              defaultValue={field.label}
              aria-label={`Etiqueta para ${field.key}`}
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor={fieldTypeId} className="mb-1 md:sr-only">
              Tipo
            </Label>
            <MobileFieldLabel>Tipo</MobileFieldLabel>
            <select
              id={fieldTypeId}
              name="fieldType"
              required
              defaultValue={field.fieldType}
              className={selectClassName}
              aria-label={`Tipo para ${field.key}`}
            >
              {FIELD_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 md:items-center md:justify-center">
            <MobileFieldLabel>Requerido</MobileFieldLabel>
            <div className="flex items-center gap-2">
              <input
                id={requiredId}
                name="required"
                type="checkbox"
                value="true"
                defaultChecked={field.required}
                className={checkboxClassName}
                aria-label={`Requerido para ${field.key}`}
              />
              <Label htmlFor={requiredId} className="sr-only">
                Requerido
              </Label>
            </div>
          </div>
          <div className="min-w-0">
            <Label htmlFor={displayOrderId} className="mb-1 md:sr-only">
              Orden
            </Label>
            <MobileFieldLabel>Orden</MobileFieldLabel>
            <Input
              id={displayOrderId}
              name="displayOrder"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={field.displayOrder}
              aria-label={`Orden para ${field.key}`}
            />
          </div>
          <div className="md:flex md:justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className={cn(
                "w-full bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50 disabled:opacity-50 md:w-auto",
              )}
            >
              {isPending ? "Guardando…" : "Guardar campo"}
            </Button>
          </div>
        </div>
        {state ? (
          <div
            role={state.success ? "status" : "alert"}
            className="border-t border-slate-100 px-3 pb-3 sm:px-4"
          >
            <Alert variant={state.success ? "default" : "destructive"}>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          </div>
        ) : null}
      </form>
    </li>
  );
}
