"use client";

import { useActionState } from "react";

import {
  archiveTemplateAction,
  type ArchiveTemplateActionState,
} from "../actions";

type ArchiveTemplateFormProps = {
  templateId: string;
};

export function ArchiveTemplateForm({ templateId }: ArchiveTemplateFormProps) {
  const [state, formAction, isPending] = useActionState<
    ArchiveTemplateActionState | undefined,
    FormData
  >(archiveTemplateAction, undefined);

  return (
    <form action={formAction}>
      <input type="hidden" name="templateId" value={templateId} />
      <button type="submit" disabled={isPending}>
        {isPending ? "Archivando…" : "Archivar template"}
      </button>
      {state ? (
        <div role={state.success ? "status" : "alert"}>
          <p>{state.message}</p>
          {state.success ? (
            <>
              <p>Estado del template: {state.templateStatus}</p>
              <p>Estado de la versión: {state.versionStatus}</p>
            </>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
