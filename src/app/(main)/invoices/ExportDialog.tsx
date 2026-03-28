"use client";

import { useEffect, useState, ReactNode } from "react";
import { toast } from "@/lib/toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { exportInvoicesToCsv, exportInvoicesToJson, exportInvoiceAsPdf } from "@/lib/invoice-export";
import { useRouter } from "next/navigation";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { type ExportCapability } from "@/lib/subscription-plans";

interface Company {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
}

interface ExportDialogProps {
  companies: Company[];
  clients: Client[];
  invoiceId?: string;
  exportCapability?: ExportCapability;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export default function ExportDialog({
  companies,
  clients,
  invoiceId,
  exportCapability = "none",
  isOpen,
  onOpenChange,
  children
}: ExportDialogProps) {
  const router = useRouter();
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "pdf">("csv");
  const [companyId, setCompanyId] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [dateRange, setDateRange] = useState<"all" | "custom">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const canExportJson = exportCapability === "full";
  const canExportPdf = exportCapability === "full" && Boolean(invoiceId);

  useEffect(() => {
    if (exportFormat === "json" && !canExportJson) {
      setExportFormat("csv");
    }

    if (exportFormat === "pdf" && !canExportPdf) {
      setExportFormat("csv");
    }
  }, [canExportJson, canExportPdf, exportFormat]);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const filters = {
        ...(companyId ? { companyId } : {}),
        ...(clientId ? { clientId } : {}),
        ...(status ? { status } : {}),
        ...(dateRange === "custom" && startDate ? { startDate } : {}),
        ...(dateRange === "custom" && endDate ? { endDate } : {})
      };

      if (exportFormat === "csv") {
        await exportInvoicesToCsv(filters);
        toast.success("Invoices exported successfully as CSV");
      } else if (exportFormat === "json") {
        if (!canExportJson) {
          throw new Error("JSON export requires PRO or BUSINESS.");
        }
        const result = await exportInvoicesToJson(filters);
        toast.success(`${result.invoices.length} invoices exported as JSON`);
      } else if (exportFormat === "pdf" && invoiceId) {
        if (!canExportPdf) {
          throw new Error("PDF export requires PRO or BUSINESS.");
        }
        await exportInvoiceAsPdf(invoiceId);
        toast.success("Invoice exported as PDF");
      }

      if (onOpenChange) {
        onOpenChange(false);
      }
      
      // Refresh the invoices list
      router.refresh();
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export invoices");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Options
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Invoices</DialogTitle>
          <DialogDescription>
            Choose your export options and download your invoices
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="export-format">Export Format</Label>
            <RadioGroup
              defaultValue="csv"
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as "csv" | "json" | "pdf")}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Excel)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" disabled={!canExportJson} />
                <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  JSON{!canExportJson && " (PRO / BUSINESS)"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" disabled={!canExportPdf} />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF
                  {!invoiceId && " (available for single invoice only)"}
                  {invoiceId && exportCapability !== "full" && " (PRO / BUSINESS)"}
                </Label>
              </div>
            </RadioGroup>
            {exportCapability === "csv" && (
              <p className="text-sm text-muted-foreground">
                Вашият план позволява CSV експорт. JSON и PDF експортът са налични в PRO и BUSINESS.
              </p>
            )}
          </div>

          {/* Filter Options (only show for CSV/JSON exports) */}
          {exportFormat !== "pdf" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger id="company">
                    <SelectValue placeholder="All companies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All companies</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All clients</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ISSUED">Issued</SelectItem>
                    <SelectItem value="VOIDED">Voided</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <RadioGroup
                  defaultValue="all"
                  value={dateRange}
                  onValueChange={(value) => setDateRange(value as "all" | "custom")}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="cursor-pointer">All time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="cursor-pointer">Custom range</Label>
                  </div>
                </RadioGroup>
              </div>

              {dateRange === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 