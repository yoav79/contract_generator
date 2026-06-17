"use client";

import { TemplateFieldType } from "@prisma/client";
import { useActionState } from "react";

import { MAX_TEXT_FIELD_LENGTH } from "@/lib/forms/validate-template-form-data";

import {
  generateContractDocumentAction,
  type GenerateContractDocumentActionState,
} from "../actions";

export type ContractFormField = {
  key: string;
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
  displayOrder: number;
};

type ContractFormProps = {
  templateId: string;
  fields: ContractFormField[];
};

export function ContractForm({ templateId, fields }: ContractFormProps) {
  const [state, formAction, isPending] = useActionState<
    GenerateContractDocumentActionState | undefined,
    FormData
  >(generateContractDocumentAction, undefined);

  return (
    <form action={formAction}>
      <input type="hidden" name="templateId" value={templateId} />

      {fields.length === 0 ? (
        <p>Este template no tiene campos configurados.</p>
      ) : (
        <ul>
          {fields.map((field) => {
            const fieldError = state?.success === false
              ? state.fieldErrors?.[field.key]
              : undefined;
            const inputId = `contract-field-${field.key}`;

            return (
              <li key={field.key}>
                {field.fieldType === TemplateFieldType.BOOLEAN ? (
                  <div>
                    <input type="hidden" name={field.key} value="false" />
                    <label htmlFor={inputId}>
                      <input
                        id={inputId}
                        name={field.key}
                        type="checkbox"
                        value="true"
                      />{" "}
                      {field.label}
                    </label>
                  </div>
                ) : (
                  <div>
                    <label htmlFor={inputId}>{field.label}</label>
                    <br />
                    {field.fieldType === TemplateFieldType.TEXT ? (
                      <input
                        id={inputId}
                        name={field.key}
                        type="text"
                        required={field.required}
                        maxLength={MAX_TEXT_FIELD_LENGTH}
                      />
                    ) : null}
                    {field.fieldType === TemplateFieldType.DATE ? (
                      <input
                        id={inputId}
                        name={field.key}
                        type="date"
                        required={field.required}
                      />
                    ) : null}
                    {field.fieldType === TemplateFieldType.NUMBER ? (
                      <input
                        id={inputId}
                        name={field.key}
                        type="number"
                        step="any"
                        required={field.required}
                      />
                    ) : null}
                  </div>
                )}

                {fieldError ? (
                  <p role="alert">{fieldError}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      {state?.success === false && state.formError ? (
        <p role="alert">{state.formError}</p>
      ) : null}

      {state?.success === false && state.message ? (
        <p role="alert">{state.message}</p>
      ) : null}

      {state?.success === true ? (
        <div role="status">
          <p>{state.message}</p>
          <p>
            ID del documento generado: <code>{state.generatedDocumentId}</code>
          </p>
        </div>
      ) : null}

      {fields.length > 0 ? (
        <button type="submit" disabled={isPending}>
          {isPending ? "Generando…" : "Generar documento"}
        </button>
      ) : null}
    </form>
  );
}
