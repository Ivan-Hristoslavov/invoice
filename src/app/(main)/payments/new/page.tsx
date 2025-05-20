"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatCurrency, getCurrencySymbol } from "@/lib/utils";

const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Фактурата е задължителна"),
  amount: z.string().min(1, "Сумата е задължителна").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    "Сумата трябва да е положително число"
  ),
  paymentDate: z.string().min(1, "Датата на плащане е задължителна"),
  paymentMethod: z.enum(["BANK_TRANSFER", "CASH", "CREDIT_CARD", "APPLE_PAY", "GOOGLE_PAY", "WIRE_TRANSFER", "OTHER"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type Invoice = {
  id: string;
  invoiceNumber: string;
  total: number;
  clientName: string;
  amountDue: number;
  dueDate?: string;
  status?: string;
  currency: string;
  clientEmail?: string;
};

export default function NewPaymentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState<boolean>(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoiceId: "",
      amount: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "BANK_TRANSFER",
      reference: "",
      notes: "",
    },
  });

  useEffect(() => {
    async function fetchInvoices() {
      setIsLoadingInvoices(true);
      setLoadingError(null);
      
      try {
        // Fetch only unpaid and overdue invoices - use the correct format for status parameter
        const response = await fetch("/api/invoices?status=UNPAID,OVERDUE");
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          let errorMessage = `Server error: ${response.status}`;
          
          try {
            // Try to parse the error response as JSON if possible
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
              errorMessage = errorJson.error;
            }
          } catch (e) {
            // If it's not valid JSON, use the error text
            if (errorText && errorText.length < 100) {
              errorMessage = errorText;
            }
          }
          
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }
        
        if (data.length === 0) {
          setInvoices([]);
          setIsLoadingInvoices(false);
          return;
        }
        
        try {
          // Also fetch payments to calculate amount due for each invoice
          const paymentsResponse = await fetch("/api/payments");
          if (!paymentsResponse.ok) {
            throw new Error("Failed to fetch payments");
          }
          
          const paymentsData = await paymentsResponse.json();
          
          // Create a map of invoice ID to total payments
          const paymentsByInvoice = paymentsData.reduce((acc: Record<string, number>, payment: any) => {
            const invoiceId = payment.invoiceId;
            if (!acc[invoiceId]) {
              acc[invoiceId] = 0;
            }
            acc[invoiceId] += Number(payment.amount);
            return acc;
          }, {});
          
          // Transform the invoice data
          const transformedInvoices = data.map((invoice: any) => {
            const totalPaid = paymentsByInvoice[invoice.id] || 0;
            const amountDue = Number(invoice.total) - totalPaid;
            
            return {
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              total: Number(invoice.total),
              clientName: invoice.client?.name || "Unknown Client",
              amountDue: amountDue > 0 ? amountDue : 0,
              currency: invoice.currency || "USD",
            };
          });
          
          // Filter out invoices that are fully paid
          const unpaidInvoices = transformedInvoices.filter(
            (invoice: Invoice) => invoice.amountDue > 0
          );
          
          setInvoices(unpaidInvoices);
        } catch (paymentError) {
          // If payments fetch fails, still show invoices but without payment calculations
          console.error("Error fetching payments:", paymentError);
          
          const basicInvoices = data.map((invoice: any) => ({
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            total: Number(invoice.total),
            clientName: invoice.client?.name || "Unknown Client",
            amountDue: Number(invoice.total), // Assume full amount is due
            currency: invoice.currency || "USD",
          }));
          
          setInvoices(basicInvoices);
          toast.warning("Payment data could not be loaded", {
            description: "Using total invoice amounts instead"
          });
        }
      } catch (error: any) {
        console.error("Грешка при зареждане на фактурите:", error);
        setLoadingError(typeof error === 'object' && error.message ? error.message : 'Неуспешно зареждане на фактурите');
        setInvoices([]);
        toast.error("Грешка", {
          description: "Неуспешно зареждане на фактурите. Моля, опитайте отново."
        });
      } finally {
        setIsLoadingInvoices(false);
      }
    }

    fetchInvoices();
  }, []);

  // Update amount when invoice is selected
  const onInvoiceChange = async (invoiceId: string) => {
    // Find the basic invoice info from our list
    const basicInvoice = invoices.find((inv) => inv.id === invoiceId);
    
    if (basicInvoice) {
      try {
        // Fetch full invoice details for the selected invoice
        const response = await fetch(`/api/invoices/${invoiceId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch invoice details");
        }
        
        const invoiceDetails = await response.json();
        
        // Create a complete invoice object with all needed details
        const completeInvoice = {
          ...basicInvoice,
          dueDate: invoiceDetails.dueDate,
          status: invoiceDetails.status,
          currency: invoiceDetails.currency || "USD",
          clientEmail: invoiceDetails.client?.email || "",
        };
        
        setSelectedInvoice(completeInvoice);
        form.setValue("amount", completeInvoice.amountDue.toString());
      } catch (error) {
        console.error("Error fetching invoice details:", error);
        // Even if detailed fetch fails, use the basic info we have
        setSelectedInvoice(basicInvoice);
        form.setValue("amount", basicInvoice.amountDue.toString());
      }
    }
  };

  async function onSubmit(data: PaymentFormValues) {
    setIsLoading(true);
    
    try {
      // Validate required data
      if (!data.invoiceId || !data.amount) {
        toast.error("Липсващи задължителни полета", {
          description: "Моля, попълнете всички задължителни полета"
        });
        setIsLoading(false);
        return;
      }
      
      // Validate amount is a valid number
      const amount = parseFloat(data.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Невалидна сума", {
          description: "Моля, въведете валидна положителна сума"
        });
        setIsLoading(false);
        return;
      }
      
      // Format the data for the API
      const paymentData = {
        invoiceId: data.invoiceId,
        amount: amount,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,
        reference: data.reference || "",
        notes: data.notes || "",
      };
      
      console.log("Submitting payment data:", JSON.stringify(paymentData));
      
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      // Handle API errors
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server error: ${response.status}`;
        let errorDetails = [];
        
        try {
          // Try to parse the error response as JSON
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage = errorJson.error;
          }
          if (errorJson.details) {
            console.error("Validation details:", errorJson.details);
            errorDetails = errorJson.details;
          }
        } catch (e) {
          // If not valid JSON, use the raw text if it's short
          if (errorText && errorText.length < 100) {
            errorMessage = errorText;
          }
        }
        
        if (errorDetails && errorDetails.length > 0) {
          // Show more specific validation error
          toast.error("Validation Error", {
            description: errorDetails.map((e: any) => e.message || e.path?.join('.') || 'Unknown error').join(', ')
          });
        } else {
          toast.error("Грешка", {
            description: errorMessage
          });
        }
        
        throw new Error(errorMessage);
      }

      toast.success("Плащането е записано", {
        description: "Плащането е записано успешно."
      });
      
      router.push("/payments");
      router.refresh();
    } catch (error: any) {
      const errorMessage = typeof error === 'object' && error.message 
        ? error.message 
        : "Възникна неизвестна грешка";
        
      console.error("Грешка при запис на плащането:", errorMessage);
      
      // Only show a toast if it wasn't already shown in the error handling
      if (!errorMessage.includes("Validation Error")) {
        toast.error("Грешка", {
          description: "Възникна грешка при запис на плащането. Моля, опитайте отново."
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/payments">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Запис на плащане</h1>
        </div>
        <Button
          type="submit"
          form="payment-form"
          disabled={isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Запазване..." : "Запази плащането"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Детайли за плащането</CardTitle>
          <CardDescription>
            Запишете плащане за неплатена фактура
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Information about payment processing */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
            <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Информация за методите за плащане</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
              Този формуляр е за записване на вече извършени плащания. В зависимост от избрания метод за плащане:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-400 ml-2 space-y-1">
              <li><span className="font-medium">Apple Pay/Google Pay:</span> Споделете връзката за плащане с клиентите, за да платят чрез своите устройства</li>
              <li><span className="font-medium">Банков превод/Превод:</span> Запишете плащания, които клиентите са направили към вашата банкова сметка</li>
              <li><span className="font-medium">Кредитна карта:</span> Запишете плащания, направени чрез вашата POS система или друг процесор за карти</li>
              <li><span className="font-medium">В брой:</span> Запишете плащания в брой</li>
            </ul>
            <div className="mt-3">
              <Link href="/settings/payment-integrations" className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Настройте интеграции за плащания →
              </Link>
            </div>
          </div>
          
          {/* Show invoice summary when an invoice is selected */}
          {selectedInvoice && (
            <Card className="mb-6 bg-muted/30">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Клиент</h3>
                    <p className="font-medium">{selectedInvoice.clientName}</p>
                    {selectedInvoice.clientEmail && (
                      <p className="text-sm text-muted-foreground">{selectedInvoice.clientEmail}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Фактура</h3>
                    <p className="font-medium">#{selectedInvoice.invoiceNumber}</p>
                    {selectedInvoice.dueDate && (
                      <p className="text-sm text-muted-foreground">
                        Падеж: {new Date(selectedInvoice.dueDate).toLocaleDateString('bg-BG')}
                      </p>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Обща сума</h3>
                    <p className="text-xl font-bold">
                      {formatCurrency(selectedInvoice.total, selectedInvoice.currency)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Сума за плащане</h3>
                    <p className="text-xl font-bold text-amber-600">
                      {formatCurrency(selectedInvoice.amountDue, selectedInvoice.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Form {...form}>
            <form id="payment-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="invoiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Фактура</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        onInvoiceChange(value);
                      }}
                      defaultValue={field.value}
                      disabled={isLoadingInvoices}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoadingInvoices ? "Зареждане на фактури..." : "Изберете фактура"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingInvoices ? (
                          <SelectItem value="loading" disabled>
                            Зареждане на фактури...
                          </SelectItem>
                        ) : loadingError ? (
                          <SelectItem value="error" disabled>
                            Грешка при зареждане на фактурите
                          </SelectItem>
                        ) : invoices.length === 0 ? (
                          <SelectItem value="none" disabled>
                            Няма намерени неплатени фактури
                          </SelectItem>
                        ) : (
                          invoices.map((invoice) => (
                            <SelectItem key={invoice.id} value={invoice.id}>
                              {invoice.invoiceNumber} - {invoice.clientName} ({formatCurrency(invoice.amountDue, invoice.currency)})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {loadingError ? 
                        <span className="text-destructive">{loadingError}</span> : 
                        "Изберете неплатена фактура, за която да запишете плащането"
                      }
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Сума</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                            {getCurrencySymbol(selectedInvoice?.currency)}
                          </span>
                          <Input 
                            type="text" 
                            inputMode="decimal"
                            className="pl-7"
                            {...field}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^\d.]/g, '');
                              const formatted = value.replace(/(\..*)\./g, '$1');
                              field.onChange(formatted);
                            }}
                          />
                        </div>
                      </FormControl>
                      {selectedInvoice && (
                        <FormDescription>
                          Сума за плащане: {formatCurrency(selectedInvoice.amountDue, selectedInvoice.currency)}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Дата на плащане</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Метод на плащане</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Изберете метод на плащане" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">Банков превод</SelectItem>
                        <SelectItem value="WIRE_TRANSFER">Превод</SelectItem>
                        <SelectItem value="CASH">В брой</SelectItem>
                        <SelectItem value="CREDIT_CARD">Кредитна карта</SelectItem>
                        <SelectItem value="APPLE_PAY">Apple Pay</SelectItem>
                        <SelectItem value="GOOGLE_PAY">Google Pay</SelectItem>
                        <SelectItem value="OTHER">Друг</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Референция</FormLabel>
                    <FormControl>
                      <Input placeholder="напр. ID на транзакция, номер на чек" {...field} />
                    </FormControl>
                    <FormDescription>
                      По желание: Добавете референция за това плащане
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Бележки</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Добавете допълнителна информация за това плащане"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 