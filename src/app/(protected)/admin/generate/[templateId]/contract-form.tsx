"use client";

import { TemplateFieldType } from "@prisma/client";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

const checkboxClassName =
  "size-4 shrink-0 rounded border border-input accent-primary outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

export function ContractForm({ templateId, fields }: ContractFormProps) {
  const [state, formAction, isPending] = useActionState<
    GenerateContractDocumentActionState | undefined,
    FormData
  >(generateContractDocumentAction, undefined);

  return (
    <Card>
      <form action={formAction}>
        <input type="hidden" name="templateId" value={templateId} />

        <CardHeader>
          <CardTitle className="text-base">Formulario del contrato</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este template no tiene campos configurados.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {fields.map((field) => {
                const fieldError =
                  state?.success === false
                    ? state.fieldErrors?.[field.key]
                    : undefined;
                const inputId = `contract-field-${field.key}`;

                return (
                  <li key={field.key} className="flex flex-col gap-2">
                    {field.fieldType === TemplateFieldType.BOOLEAN ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="hidden"
                          name={field.key}
                          value="false"
                        />
                        <input
                          id={inputId}
                          name={field.key}
                          type="checkbox"
                          value="true"
                          className={checkboxClassName}
                        />
                        <Label htmlFor={inputId}>{field.label}</Label>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={inputId}>{field.label}</Label>
                        {field.fieldType === TemplateFieldType.TEXT ? (
                          <Input
                            id={inputId}
                            name={field.key}
                            type="text"
                            required={field.required}
                            maxLength={MAX_TEXT_FIELD_LENGTH}
                          />
                        ) : null}
                        {field.fieldType === TemplateFieldType.DATE ? (
                          <Input
                            id={inputId}
                            name={field.key}
                            type="date"
                            required={field.required}
                          />
                        ) : null}
                        {field.fieldType === TemplateFieldType.NUMBER ? (
                          <Input
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
                      <Alert variant="destructive">
                        <AlertDescription>{fieldError}</AlertDescription>
                      </Alert>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}

          {state?.success === false && state.formError ? (
            <Alert variant="destructive">
              <AlertDescription>{state.formError}</AlertDescription>
            </Alert>
          ) : null}

          {state?.success === false && state.message ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          {state?.success === true ? (
            <div role="status" className="flex flex-col gap-3">
              <Alert>
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
              <p className="text-sm">
                ID del documento generado:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {state.generatedDocumentId}
                </code>
              </p>
              {state.pdfCreated ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Estado PDF:
                    </span>
                    <Badge>PDF creado</Badge>
                  </div>
                  <Button variant="outline" className="w-fit" asChild>
                    <a
                      href={`/admin/generated-documents/${state.generatedDocumentId}/download`}
                    >
                      Descargar PDF
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Estado PDF: PDF pendiente
                </p>
              )}
            </div>
          ) : null}
        </CardContent>

        {fields.length > 0 ? (
          <CardFooter className="border-t">
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Generando…" : "Generar documento"}
            </Button>
          </CardFooter>
        ) : null}
      </form>
    </Card>
  );
}
