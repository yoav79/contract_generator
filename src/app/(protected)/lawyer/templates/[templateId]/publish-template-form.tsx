"use client";

import { useActionState } from "react";

import {
  publishTemplateAction,
  type PublishTemplateActionState,
} from "../actions";

type PublishTemplateFormProps = {
  templateId: string;
  disabled?: boolean;
};

export function PublishTemplateForm({
  templateId,
  disabled = false,
}: PublishTemplateFormProps) {
  const [state, formAction, isPending] = useActionState<
    PublishTemplateActionState | undefined,
    FormData
  >(publishTemplateAction, undefined);

  return (
    <form action={formAction}>
      <input type="hidden" name="templateId" value={templateId} />
      <button type="submit" disabled={disabled || isPending}>
        {isPending ? "Publicando…" : "Publicar template"}
      </button>
      {state ? (
        <div role={state.success ? "status" : "alert"}>
          <p>{state.message}</p>
          {state.success ? (
            <>
              <p>Estado del template: {state.templateStatus}</p>
              <p>Estado de la versión: {state.versionStatus}</p>
              <p>
                Publicado:{" "}
                {new Intl.DateTimeFormat("es", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(state.publishedAt))}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
