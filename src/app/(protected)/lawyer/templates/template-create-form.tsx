"use client";

import { useActionState } from "react";

import {
  createTemplateAction,
  type CreateTemplateActionState,
} from "./actions";

export function TemplateCreateForm() {
  const [state, formAction, isPending] = useActionState<
    CreateTemplateActionState | undefined,
    FormData
  >(createTemplateAction, undefined);

  return (
    <form action={formAction} encType="multipart/form-data">
      {state ? (
        <p role={state.success ? "status" : "alert"}>{state.message}</p>
      ) : null}
      <div>
        <label htmlFor="template-name">Nombre</label>
        <br />
        <input id="template-name" name="name" type="text" required />
      </div>
      <div>
        <label htmlFor="template-description">Descripción</label>
        <br />
        <textarea id="template-description" name="description" rows={3} />
      </div>
      <div>
        <label htmlFor="template-file">Archivo DOCX</label>
        <br />
        <input
          id="template-file"
          name="file"
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          required
        />
      </div>
      <button type="submit" disabled={isPending}>
        {isPending ? "Creando…" : "Crear template"}
      </button>
    </form>
  );
}
