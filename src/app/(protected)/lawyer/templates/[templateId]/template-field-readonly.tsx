import { TemplateFieldType } from "@prisma/client";

export type TemplateFieldForReadonly = {
  key: string;
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
  displayOrder: number;
};

type TemplateFieldReadonlyProps = {
  field: TemplateFieldForReadonly;
};

export function TemplateFieldReadonly({ field }: TemplateFieldReadonlyProps) {
  return (
    <div>
      <p>
        <strong>Key:</strong> {field.key}
      </p>
      <p>
        <strong>Label:</strong> {field.label}
      </p>
      <p>
        <strong>Tipo:</strong> {field.fieldType}
      </p>
      <p>
        <strong>Requerido:</strong> {field.required ? "Sí" : "No"}
      </p>
      <p>
        <strong>Orden:</strong> {field.displayOrder}
      </p>
    </div>
  );
}
