"use client";

import { useActionState, useEffect } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  createTemplateAction,
  type CreateTemplateActionState,
} from "./actions";

const fileInputClassName =
  "flex h-auto w-full min-w-0 cursor-pointer rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none file:mr-3 file:inline-flex file:h-7 file:cursor-pointer file:items-center file:rounded-md file:border-0 file:bg-muted file:px-3 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";

const primaryBlueButtonClassName =
  "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50 disabled:opacity-50";

type TemplateCreateFormProps = {
  onSuccess?: (templateId: string) => void;
};

export function TemplateCreateForm({ onSuccess }: TemplateCreateFormProps = {}) {
  const [state, formAction, isPending] = useActionState<
    CreateTemplateActionState | undefined,
    FormData
  >(createTemplateAction, undefined);

  useEffect(() => {
    if (state?.success && state.templateId && onSuccess) {
      onSuccess(state.templateId);
    }
  }, [state, onSuccess]);

  return (
    <Card>
      <form action={formAction} encType="multipart/form-data">
        <CardHeader>
          <CardTitle className="text-base">Nuevo template DOCX</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {state ? (
            <div role={state.success ? "status" : "alert"}>
              <Alert variant={state.success ? "default" : "destructive"}>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-name">Nombre</Label>
            <Input id="template-name" name="name" type="text" required />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-description">
              Descripción <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="template-description"
              name="description"
              rows={3}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-file">Archivo DOCX</Label>
            <input
              id="template-file"
              name="file"
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              required
              className={fileInputClassName}
            />
          </div>
        </CardContent>

        <CardFooter className="border-t">
          <Button
            type="submit"
            disabled={isPending}
            className={cn("w-full sm:w-auto", primaryBlueButtonClassName)}
          >
            {isPending ? "Creando…" : "Crear template"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
