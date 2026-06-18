"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TemplateCreateDialog } from "./template-create-dialog";

export type LawyerTemplateListItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  latestVersion: {
    version: number;
    status: string;
  } | null;
};

type TemplatesListPanelProps = {
  templates: LawyerTemplateListItem[];
};

function templateStatusClassName(status: string): string {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "ARCHIVED":
      return "border-zinc-200 bg-zinc-100 text-zinc-600";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatUpdatedAt(template: LawyerTemplateListItem): string {
  const date = template.updatedAt || template.createdAt;
  return new Date(date).toLocaleDateString();
}

function matchesSearch(
  template: LawyerTemplateListItem,
  query: string,
): boolean {
  if (!query) {
    return true;
  }

  const haystack = [
    template.name,
    template.description ?? "",
    template.status,
    template.latestVersion?.status ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function TemplateStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={templateStatusClassName(status)}
    >
      {status}
    </Badge>
  );
}

function VersionCell({ version }: { version: LawyerTemplateListItem["latestVersion"] }) {
  if (!version) {
    return <span className="text-sm text-slate-500">Sin versión</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
        v{version.version}
      </Badge>
      <Badge variant="outline" className="border-slate-200 text-slate-600">
        {version.status}
      </Badge>
    </div>
  );
}

function DetailLink({ templateId }: { templateId: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={`/lawyer/templates/${templateId}`}>Ver detalle</Link>
    </Button>
  );
}

function EmptyGlobalState() {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="items-center text-center">
        <CardTitle className="text-base">No hay templates todavía.</CardTitle>
        <CardDescription className="max-w-md text-slate-600">
          Crea tu primera plantilla DOCX para comenzar a configurar campos y
          publicarla.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center pb-6">
        <TemplateCreateDialog />
      </CardContent>
    </Card>
  );
}

function EmptySearchState({ onClear }: { onClear: () => void }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
        <p className="text-sm font-medium text-slate-900">
          No encontramos templates con ese criterio.
        </p>
        <Button variant="outline" size="sm" onClick={onClear}>
          Limpiar búsqueda
        </Button>
      </CardContent>
    </Card>
  );
}

function MobileTemplateCard({ template }: { template: LawyerTemplateListItem }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base text-slate-900">{template.name}</CardTitle>
          <TemplateStatusBadge status={template.status} />
        </div>
        {template.description ? (
          <CardDescription className="line-clamp-2 text-slate-600">
            {template.description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <VersionCell version={template.latestVersion} />
          <span className="text-slate-500">{formatUpdatedAt(template)}</span>
        </div>
        <DetailLink templateId={template.id} />
      </CardContent>
    </Card>
  );
}

export function TemplatesListPanel({ templates }: TemplatesListPanelProps) {
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();

  const filteredTemplates = useMemo(
    () => templates.filter((template) => matchesSearch(template, normalizedSearch)),
    [templates, normalizedSearch],
  );

  const counterLabel =
    normalizedSearch.length > 0
      ? `${filteredTemplates.length} resultado${filteredTemplates.length === 1 ? "" : "s"}`
      : `${templates.length} template${templates.length === 1 ? "" : "s"}`;

  if (templates.length === 0) {
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium text-slate-900">Mis templates</h2>
        <EmptyGlobalState />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-lg font-medium text-slate-900">Mis templates</h2>
        <p className="text-sm text-slate-500">{counterLabel}</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, descripción o estado..."
          aria-label="Buscar templates"
          className="border-slate-200 bg-white"
        />
      </div>

      {filteredTemplates.length === 0 ? (
        <EmptySearchState onClear={() => setSearch("")} />
      ) : (
        <>
          <div className="hidden md:block">
            <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-200 hover:bg-transparent">
                    <TableHead className="text-slate-600">Template</TableHead>
                    <TableHead className="text-slate-600">Estado</TableHead>
                    <TableHead className="text-slate-600">Versión</TableHead>
                    <TableHead className="text-slate-600">
                      Última actualización
                    </TableHead>
                    <TableHead className="text-right text-slate-600">
                      Acción
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow
                      key={template.id}
                      className="border-slate-200 hover:bg-slate-50/80"
                    >
                      <TableCell className="max-w-xs whitespace-normal">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-900">
                            {template.name}
                          </span>
                          {template.description ? (
                            <span className="line-clamp-2 text-sm text-slate-500">
                              {template.description}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <TemplateStatusBadge status={template.status} />
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <VersionCell version={template.latestVersion} />
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {formatUpdatedAt(template)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DetailLink templateId={template.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          <ul className="flex flex-col gap-3 md:hidden">
            {filteredTemplates.map((template) => (
              <li key={template.id}>
                <MobileTemplateCard template={template} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
