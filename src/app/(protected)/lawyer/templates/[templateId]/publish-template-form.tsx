"use client";

import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";

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
      <CardFooter className="border-t px-0 pb-0">
        <Button type="submit" disabled={disabled || isPending}>
          {isPending ? "Publicando…" : "Publicar template"}
        </Button>
      </CardFooter>
      {state ? (
        <div
          role={state.success ? "status" : "alert"}
          className="mt-4 flex flex-col gap-3"
        >
          <Alert variant={state.success ? "default" : "destructive"}>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
          {state.success ? (
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Estado del template: {state.templateStatus}</p>
              <p>Estado de la versión: {state.versionStatus}</p>
              <p>
                Publicado:{" "}
                {new Intl.DateTimeFormat("es", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(state.publishedAt))}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
