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
    <Card>
      <form action={formAction}>
        <input type="hidden" name="templateId" value={templateId} />
        <CardHeader>
          <CardTitle className="text-base">Extracción de placeholders</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {state ? (
            <div role={state.success ? "status" : "alert"}>
              <Alert variant={state.success ? "default" : "destructive"}>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
              {state.success ? (
                <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                  <p>Válidos: {state.validCount}</p>
                  <p>Inválidos: {state.invalidCount}</p>
                  <p>Creados: {state.createdCount}</p>
                  <p>Preservados: {state.preservedCount}</p>
                  <p>Eliminados: {state.removedCount}</p>
                  {state.warnings.length > 0 ? (
                    <div className="pt-2">
                      <p>Advertencias:</p>
                      <ul className="list-inside list-disc">
                        {state.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="border-t">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Extrayendo…" : "Extraer placeholders"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
