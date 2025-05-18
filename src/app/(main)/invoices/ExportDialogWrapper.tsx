"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import ExportDialog from "./ExportDialog";

interface Company {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
}

interface ExportDialogWrapperProps {
  clients: Client[];
  companies: Company[];
  invoiceId?: string;
}

export default function ExportDialogWrapper({
  clients,
  companies,
  invoiceId
}: ExportDialogWrapperProps) {
  return (
    <ExportDialog clients={clients} companies={companies} invoiceId={invoiceId}>
      <Button size="sm" className="mt-2" variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Export Options
      </Button>
    </ExportDialog>
  );
} 