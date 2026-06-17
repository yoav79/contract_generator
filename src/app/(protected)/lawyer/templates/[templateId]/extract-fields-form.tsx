"use client";

import { useActionState } from "react";

import {
  extractTemplateFieldsAction,
  type ExtractTemplateFieldsActionState,
} from "../actions";

type ExtractFieldsFormProps = {
  templateId: string;
};

export function ExtractFieldsForm({ templateId }: ExtractFieldsFormProps) {
  const [state, formAction, isPending] = useActionState<
    ExtractTemplateFieldsActionState | undefined,
    FormData
  >(extractTemplateFieldsAction, undefined);

  return (
    <form action={formAction}>
      <input type="hidden" name="templateId" value={templateId} />
      <button type="submit" disabled={isPending}>
        {isPending ? "Extrayendo…" : "Extraer placeholders"}
      </button>
      {state ? (
        <div role={state.success ? "status" : "alert"}>
          <p>{state.message}</p>
          {state.success ? (
            <>
              <p>Válidos: {state.validCount}</p>
              <p>Inválidos: {state.invalidCount}</p>
              <p>Creados: {state.createdCount}</p>
              <p>Preservados: {state.preservedCount}</p>
              <p>Eliminados: {state.removedCount}</p>
              {state.warnings.length > 0 ? (
                <div>
                  <p>Advertencias:</p>
                  <ul>
                    {state.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
