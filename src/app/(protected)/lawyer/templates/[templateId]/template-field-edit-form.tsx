"use client";

import { TemplateFieldType } from "@prisma/client";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

type TemplateFieldEditFormProps = {
  templateId: string;
  field: TemplateFieldForEdit;
};

const FIELD_TYPE_OPTIONS: TemplateFieldType[] = [
  TemplateFieldType.TEXT,
  TemplateFieldType.DATE,
  TemplateFieldType.NUMBER,
  TemplateFieldType.BOOLEAN,
];

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

const checkboxClassName =
  "size-4 shrink-0 rounded border border-input accent-primary outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export function TemplateFieldEditForm({
  templateId,
  field,
}: TemplateFieldEditFormProps) {
  const [state, formAction, isPending] = useActionState<
    UpdateTemplateFieldActionState | undefined,
    FormData
  >(updateTemplateFieldAction, undefined);

  const labelId = `field-label-${field.id}`;
  const fieldTypeId = `field-type-${field.id}`;
  const requiredId = `field-required-${field.id}`;
  const displayOrderId = `field-display-order-${field.id}`;

  return (
    <Card>
      <form action={formAction}>
        <input type="hidden" name="fieldId" value={field.id} />
        <input type="hidden" name="templateId" value={templateId} />
        <CardHeader>
          <CardTitle className="font-mono text-sm font-normal text-muted-foreground">
            Key: {field.key}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={labelId}>Label</Label>
            <Input
              id={labelId}
              name="label"
              type="text"
              required
              maxLength={120}
              defaultValue={field.label}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={fieldTypeId}>Tipo</Label>
            <select
              id={fieldTypeId}
              name="fieldType"
              required
              defaultValue={field.fieldType}
              className={selectClassName}
            >
              {FIELD_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id={requiredId}
              name="required"
              type="checkbox"
              value="true"
              defaultChecked={field.required}
              className={checkboxClassName}
            />
            <Label htmlFor={requiredId}>Requerido</Label>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={displayOrderId}>Orden</Label>
            <Input
              id={displayOrderId}
              name="displayOrder"
              type="number"
              min={0}
              step={1}
              required
              defaultValue={field.displayOrder}
            />
          </div>
          {state ? (
            <div role={state.success ? "status" : "alert"}>
              <Alert variant={state.success ? "default" : "destructive"}>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="border-t">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50 disabled:opacity-50"
          >
            {isPending ? "Guardando…" : "Guardar campo"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
