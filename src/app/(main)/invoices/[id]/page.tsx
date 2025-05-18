"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Download,
  Send,
  Copy,
  CreditCard,
  Clock,
  AlertTriangle,
  CheckCircle,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import DocumentsTab from "@/components/invoice/DocumentsTab";
import { getDocuments } from "@/lib/services/document-service";
import { exportInvoiceAsPdf } from "@/lib/invoice-export";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
};

type Payment = {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  createdAt: string;
};

type Document = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  createdAt: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discount?: number;
  total: number;
  amountDue: number;
  totalPaid: number;
  notes?: string;
  termsAndConditions?: string;
  currency: string;
  client: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  company: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  items: InvoiceItem[];
  payments: Payment[];
};

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [paymentLink, setPaymentLink] = useState("");
  const [showPaymentLinkInput, setShowPaymentLinkInput] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      try {
        const response = await fetch(`/api/invoices/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch invoice");
        }

        const data = await response.json();
        setInvoice(data);
      } catch (err) {
        console.error("Error fetching invoice:", err);
        setError("Failed to load invoice details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoice();
  }, [params.id]);

  useEffect(() => {
    async function fetchDocuments() {
      if (!invoice) return;

      setIsLoadingDocuments(true);

      try {
        const docs = await getDocuments(invoice.id);
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Failed to load documents");
      } finally {
        setIsLoadingDocuments(false);
      }
    }

    if (activeTab === "documents") {
      fetchDocuments();
    }
  }, [invoice, activeTab]);

  const handleGeneratePaymentLink = () => {
    // In a real implementation, this would generate a unique token and save it to the database
    // For demo purposes, we'll just generate a mock URL
    const baseUrl = window.location.origin;
    const paymentUrl = `${baseUrl}/pay/${params.id}?token=${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    setPaymentLink(paymentUrl);
    setShowPaymentLinkInput(true);

    toast.success("Payment link generated", {
      description:
        "The link has been generated and is ready to share with your client.",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink);
    toast.success("Link copied to clipboard");
  };

  const handleSendPaymentLink = () => {
    // In a real implementation, this would send an email to the client
    // For demo purposes, we'll just show a success message
    toast.success("Payment link sent", {
      description: `The payment link has been sent to ${
        invoice?.client.email || "the client"
      }.`,
    });
  };

  const handleExportPdf = async () => {
    try {
      await exportInvoiceAsPdf(params.id);
      // The toast is handled inside the exportInvoiceAsPdf function
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export invoice as PDF");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "UNPAID":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "OVERDUE":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "DRAFT":
        return <AlertTriangle className="h-4 w-4 text-slate-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-50 text-green-700 border-green-200";
      case "UNPAID":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "OVERDUE":
        return "bg-red-50 text-red-700 border-red-200";
      case "DRAFT":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-center">
          <div className="h-8 w-32 bg-muted rounded mx-auto mb-4"></div>
          <div className="h-4 w-48 bg-muted rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-semibold mb-2">Error Loading Invoice</h2>
        <p className="text-muted-foreground mb-4">
          {error || "Invoice not found"}
        </p>
        <Button asChild>
          <Link href="/invoices">Back to Invoices</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Invoice #{invoice.invoiceNumber}
          </h1>
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              invoice.status
            )}`}
          >
            <span className="flex items-center gap-1.5">
              {getStatusIcon(invoice.status)}
              {invoice.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          {(invoice.status === "UNPAID" || invoice.status === "OVERDUE") &&
            invoice.amountDue > 0 && (
              <Button size="sm" onClick={handleGeneratePaymentLink}>
                <CreditCard className="w-4 h-4 mr-2" />
                Create Payment Link
              </Button>
            )}
        </div>
      </div>

      {showPaymentLinkInput && (
        <Card className="mb-6 border border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="grow">
                <h3 className="text-sm font-medium text-blue-700 mb-1">
                  Payment Link
                </h3>
                <div className="flex items-center gap-2">
                  <Input
                    value={paymentLink}
                    readOnly
                    className="bg-white border-blue-200 focus-visible:ring-blue-500"
                  />
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {invoice.client.email && (
                <Button onClick={handleSendPaymentLink}>
                  <Send className="w-4 h-4 mr-2" />
                  Send to Client
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>Invoice Information</CardTitle>
            </CardHeader>
            <Tabs
              defaultValue="details"
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="px-6">
                <TabsList className="grid w-full grid-cols-4 mb-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="items">Items</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="documents">
                    <span className="flex items-center">
                      <Paperclip className="mr-2 h-4 w-4" />
                      Documents
                    </span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="p-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Company Information
                    </h3>
                    <p className="font-medium">{invoice.company.name}</p>
                    {invoice.company.email && (
                      <p className="text-sm">{invoice.company.email}</p>
                    )}
                    {invoice.company.phone && (
                      <p className="text-sm">{invoice.company.phone}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Client Information
                    </h3>
                    <p className="font-medium">{invoice.client.name}</p>
                    {invoice.client.email && (
                      <p className="text-sm">{invoice.client.email}</p>
                    )}
                    {invoice.client.phone && (
                      <p className="text-sm">{invoice.client.phone}</p>
                    )}
                    {invoice.client.address && (
                      <p className="text-sm mt-1">
                        {invoice.client.address}
                        {invoice.client.city && `, ${invoice.client.city}`}
                        {invoice.client.country &&
                          `, ${invoice.client.country}`}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Invoice Number
                    </h3>
                    <p>{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Issue Date
                    </h3>
                    <p>{format(new Date(invoice.issueDate), "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Due Date
                    </h3>
                    <p>{format(new Date(invoice.dueDate), "MMM dd, yyyy")}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Currency
                    </h3>
                    <p>{invoice.currency}</p>
                  </div>
                </div>

                {(invoice.notes || invoice.termsAndConditions) && (
                  <>
                    <Separator className="my-6" />

                    {invoice.notes && (
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Notes
                        </h3>
                        <p className="text-sm whitespace-pre-line">
                          {invoice.notes}
                        </p>
                      </div>
                    )}

                    {invoice.termsAndConditions && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                          Terms & Conditions
                        </h3>
                        <p className="text-sm whitespace-pre-line">
                          {invoice.termsAndConditions}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="items" className="px-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-6 py-3 text-left font-medium">
                          Description
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Unit Price
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Tax Rate
                        </th>
                        <th className="px-6 py-3 text-right font-medium">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="px-6 py-3">{item.description}</td>
                          <td className="px-6 py-3 text-right">
                            {Number(item.quantity).toFixed(2)}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {formatCurrency(
                              Number(item.unitPrice),
                              invoice.currency
                            )}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {Number(item.taxRate)}%
                          </td>
                          <td className="px-6 py-3 text-right">
                            {formatCurrency(
                              Number(item.total),
                              invoice.currency
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-b">
                        <td
                          colSpan={4}
                          className="px-6 py-3 text-right font-medium"
                        >
                          Subtotal
                        </td>
                        <td className="px-6 py-3 text-right">
                          {formatCurrency(
                            Number(invoice.subtotal),
                            invoice.currency
                          )}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td
                          colSpan={4}
                          className="px-6 py-3 text-right font-medium"
                        >
                          Tax
                        </td>
                        <td className="px-6 py-3 text-right">
                          {formatCurrency(
                            Number(invoice.taxAmount),
                            invoice.currency
                          )}
                        </td>
                      </tr>
                      {invoice.discount && (
                        <tr className="border-b">
                          <td
                            colSpan={4}
                            className="px-6 py-3 text-right font-medium"
                          >
                            Discount
                          </td>
                          <td className="px-6 py-3 text-right">
                            {formatCurrency(
                              Number(invoice.discount),
                              invoice.currency
                            )}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-3 text-right font-medium"
                        >
                          Total
                        </td>
                        <td className="px-6 py-3 text-right font-bold">
                          {formatCurrency(
                            Number(invoice.total),
                            invoice.currency
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="payments" className="p-6 pt-2">
                {invoice.payments.length > 0 ? (
                  <div className="space-y-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 text-left font-medium">Date</th>
                          <th className="py-3 text-left font-medium">Amount</th>
                          <th className="py-3 text-left font-medium">Method</th>
                          <th className="py-3 text-left font-medium">
                            Reference
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.payments.map((payment) => (
                          <tr key={payment.id} className="border-b">
                            <td className="py-3">
                              {format(
                                new Date(payment.paymentDate),
                                "MMM dd, yyyy"
                              )}
                            </td>
                            <td className="py-3">
                              {formatCurrency(
                                Number(payment.amount),
                                invoice.currency
                              )}
                            </td>
                            <td className="py-3">
                              {payment.paymentMethod.replace(/_/g, " ")}
                            </td>
                            <td className="py-3">{payment.reference || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td
                            colSpan={1}
                            className="py-3 text-right font-medium"
                          >
                            Total Paid
                          </td>
                          <td className="py-3 font-medium">
                            {formatCurrency(
                              Number(invoice.totalPaid),
                              invoice.currency
                            )}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/payments/new?invoice=${invoice.id}`}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Record Another Payment
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <h3 className="font-medium mb-2">No Payments Recorded</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      No payments have been recorded for this invoice yet.
                    </p>
                    <Button asChild>
                      <Link href={`/payments/new?invoice=${invoice.id}`}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Record Payment
                      </Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="p-6 pt-2">
                <DocumentsTab invoiceId={invoice.id} documents={documents} />
              </TabsContent>
            </Tabs>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-x-3">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/invoices/${invoice.id}/edit`}>Edit Invoice</Link>
              </Button>
              <Button variant="outline" size="sm">
                Mark as Paid
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={invoice.status === "PAID"}
              >
                Send Reminder
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {formatCurrency(Number(invoice.subtotal), invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-muted-foreground">Tax</span>
                  <span>
                    {formatCurrency(
                      Number(invoice.taxAmount),
                      invoice.currency
                    )}
                  </span>
                </div>
                {invoice.discount && (
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-muted-foreground">Discount</span>
                    <span>
                      -
                      {formatCurrency(
                        Number(invoice.discount),
                        invoice.currency
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">
                    {formatCurrency(Number(invoice.total), invoice.currency)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span>
                    {formatCurrency(
                      Number(invoice.totalPaid),
                      invoice.currency
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-medium">Amount Due</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(
                      Number(invoice.amountDue),
                      invoice.currency
                    )}
                  </span>
                </div>
              </div>

              {(invoice.status === "UNPAID" || invoice.status === "OVERDUE") &&
                invoice.amountDue > 0 && (
                  <div className="mt-6">
                    <Button className="w-full" asChild>
                      <Link href={`/payments/new?invoice=${invoice.id}`}>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Record Payment
                      </Link>
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>

          {invoice.client.email && (
            <Card>
              <CardHeader>
                <CardTitle>Client Communication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Send className="w-4 h-4 mr-2" />
                  Send Invoice
                </Button>
                {(invoice.status === "UNPAID" ||
                  invoice.status === "OVERDUE") && (
                  <Button variant="outline" className="w-full justify-start">
                    <Send className="w-4 h-4 mr-2" />
                    Send Payment Reminder
                  </Button>
                )}
                {invoice.status === "PAID" && (
                  <Button variant="outline" className="w-full justify-start">
                    <Send className="w-4 h-4 mr-2" />
                    Send Receipt
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
