"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { TemplateCreateForm } from "./template-create-form";

type TemplateCreateDialogProps = {
  className?: string;
};

const primaryBlueButtonClassName =
  "bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600/50 disabled:opacity-50";

export function TemplateCreateDialog({ className }: TemplateCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSuccess(templateId: string) {
    setOpen(false);
    router.push(`/lawyer/templates/${templateId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn("shrink-0", primaryBlueButtonClassName, className)}
        >
          Crear template
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[min(90vh,calc(100%-2rem))] overflow-y-auto border-slate-200 bg-white shadow-lg sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-900">Crear template</DialogTitle>
          <DialogDescription className="text-slate-600">
            Sube un DOCX para crear una nueva plantilla de contrato.
          </DialogDescription>
        </DialogHeader>
        {open ? <TemplateCreateForm onSuccess={handleSuccess} /> : null}
      </DialogContent>
    </Dialog>
  );
}
