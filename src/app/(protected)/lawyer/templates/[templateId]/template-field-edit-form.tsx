"use client";

import { TemplateFieldType } from "@prisma/client";
import { useActionState } from "react";

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
    <form action={formAction}>
      <input type="hidden" name="fieldId" value={field.id} />
      <input type="hidden" name="templateId" value={templateId} />
      <p>
        <strong>Key:</strong> {field.key}
      </p>
      <div>
        <label htmlFor={labelId}>Label</label>
        <br />
        <input
          id={labelId}
          name="label"
          type="text"
          required
          maxLength={120}
          defaultValue={field.label}
        />
      </div>
      <div>
        <label htmlFor={fieldTypeId}>Tipo</label>
        <br />
        <select
          id={fieldTypeId}
          name="fieldType"
          required
          defaultValue={field.fieldType}
        >
          {FIELD_TYPE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={requiredId}>
          <input
            id={requiredId}
            name="required"
            type="checkbox"
            value="true"
            defaultChecked={field.required}
          />{" "}
          Requerido
        </label>
      </div>
      <div>
        <label htmlFor={displayOrderId}>Orden</label>
        <br />
        <input
          id={displayOrderId}
          name="displayOrder"
          type="number"
          min={0}
          step={1}
          required
          defaultValue={field.displayOrder}
        />
      </div>
      <button type="submit" disabled={isPending}>
        {isPending ? "Guardando…" : "Guardar campo"}
      </button>
      {state ? (
        <p role={state.success ? "status" : "alert"}>{state.message}</p>
      ) : null}
    </form>
  );
}
