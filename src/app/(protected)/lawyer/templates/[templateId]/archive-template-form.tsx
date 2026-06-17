"use client";

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
    <Card>
      <form action={formAction}>
        <input type="hidden" name="templateId" value={templateId} />
        <CardHeader>
          <CardTitle className="text-base">Archivar template</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {state ? (
            <div role={state.success ? "status" : "alert"}>
              <Alert variant={state.success ? "default" : "destructive"}>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
              {state.success ? (
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>Estado del template: {state.templateStatus}</p>
                  <p>Estado de la versión: {state.versionStatus}</p>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="border-t">
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending ? "Archivando…" : "Archivar template"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
