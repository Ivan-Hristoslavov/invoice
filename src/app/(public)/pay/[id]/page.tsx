"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, ApplePayIcon, GooglePayIcon } from "@/components/icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";

// Mock data - in real implementation this would be fetched from API
const mockInvoice = {
  id: "inv-123",
  number: "INV-001",
  dueDate: "2023-12-25",
  total: 1235.00,
  currency: "USD",
  amountDue: 1235.00,
  company: {
    name: "InvoiceNinja Demo Company",
    logo: "/placeholder-logo.png",
  },
  client: {
    name: "Acme Corporation",
    email: "billing@acme.com",
  },
};

const paymentSchema = z.object({
  cardNumber: z.string().min(13).max(19),
  cardName: z.string().min(3, "Името е задължително"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Невалидна дата на изтичане (ММ/ГГ)"),
  cvv: z.string().min(3).max(4),
});

export default function PayInvoicePage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [invoice, setInvoice] = useState(mockInvoice);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  
  useEffect(() => {
    // In a real implementation, fetch invoice details from the API
    // const fetchInvoice = async () => {
    //   const response = await fetch(`/api/public/invoices/${params.id}`);
    //   const data = await response.json();
    //   setInvoice(data);
    // };
    // fetchInvoice();
    
    // For demo, we'll use the mock data
  }, [params.id]);
  
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: ""
    },
  });
  
  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };
  
  // Format expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };
  
  const onSubmit = async (data: z.infer<typeof paymentSchema>) => {
    setIsLoading(true);
    
    // Simulate a payment processing delay
    setTimeout(() => {
      // In a real implementation, submit payment data to payment processor
      console.log("Payment data:", data);
      
      // Show success state for demo
      setIsPaid(true);
      setIsLoading(false);
    }, 2000);
  };
  
  const handleApplePay = () => {
    setIsLoading(true);
    
    // Simulate a payment processing delay
    setTimeout(() => {
      // In a real implementation, handle Apple Pay flow
      setIsPaid(true);
      setIsLoading(false);
    }, 2000);
  };
  
  const handleGooglePay = () => {
    setIsLoading(true);
    
    // Simulate a payment processing delay
    setTimeout(() => {
      // In a real implementation, handle Google Pay flow
      setIsPaid(true);
      setIsLoading(false);
    }, 2000);
  };
  
  if (isPaid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">Плащането е успешно</CardTitle>
            <CardDescription>
              Благодарим за плащането! Изпратихме разписка на вашия имейл.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-100 p-4">
              <div className="mb-2 text-sm text-slate-500">Детайли за плащането</div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Фактура</span>
                <span className="font-medium">{invoice.number}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Сума</span>
                <span className="font-medium">{formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Дата</span>
                <span className="font-medium">{new Date().toLocaleDateString('bg-BG')}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => window.print()}>
              Печат на разписка
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="w-32 h-12 bg-slate-200 rounded flex items-center justify-center text-sm font-medium">
              {/* This would be your company logo */}
              ЛОГО НА КОМПАНИЯТА
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Фактура</p>
              <p className="font-medium">{invoice.number}</p>
            </div>
          </div>
          <CardTitle>Детайли за плащането</CardTitle>
          <CardDescription>
            Плащане на фактура за {invoice.client.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-slate-100 p-4">
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm text-slate-500">Сума за плащане</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(invoice.amountDue, invoice.currency)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Дата на падеж</div>
                <div className="font-medium">
                  {new Date(invoice.dueDate).toLocaleDateString('bg-BG')}
                </div>
              </div>
            </div>
          </div>
          
          <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="card">
                <span className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Карта
                </span>
              </TabsTrigger>
              <TabsTrigger value="applepay">
                <span className="flex items-center">
                  <ApplePayIcon className="mr-2 h-4 w-4" />
                  Apple Pay
                </span>
              </TabsTrigger>
              <TabsTrigger value="googlepay">
                <span className="flex items-center">
                  <GooglePayIcon className="mr-2 h-4 w-4" />
                  Google Pay
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="card" className="space-y-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cardNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Номер на карта</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="1234 5678 9012 3456"
                            {...field}
                            onChange={(e) => field.onChange(formatCardNumber(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cardName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Име на картата</FormLabel>
                        <FormControl>
                          <Input placeholder="Иван Иванов" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="expiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата на изтичане</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ММ/ГГ"
                              {...field}
                              onChange={(e) => field.onChange(formatExpiryDate(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cvv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CVV</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="123"
                              maxLength={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Обработка..." : "Плати"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="applepay">
              <Button
                className="w-full bg-black text-white hover:bg-black/90"
                onClick={handleApplePay}
                disabled={isLoading}
              >
                {isLoading ? "Обработка..." : "Плати с Apple Pay"}
              </Button>
            </TabsContent>
            
            <TabsContent value="googlepay">
              <Button
                className="w-full bg-white text-black border border-black hover:bg-black/5"
                onClick={handleGooglePay}
                disabled={isLoading}
              >
                {isLoading ? "Обработка..." : "Плати с Google Pay"}
              </Button>
            </TabsContent>
          </Tabs>
          
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center">
              <div className="mr-3 rounded bg-slate-100 p-2">
                <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15V17M12 7V13M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-sm">
                <p className="font-medium">Payment and billing information</p>
                <p className="text-muted-foreground">Your payment is secure and encrypted</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <p className="mt-4 text-xs text-center text-slate-500 max-w-md">
        By proceeding with this payment, you agree to our terms of service and payment processing policies.
      </p>
    </div>
  );
} 