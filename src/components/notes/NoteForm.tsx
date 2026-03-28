"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Building2,
  Calendar,
  FileText,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NumericInput } from "@/components/ui/input";
import { FullPageLoader, LoadingSpinner } from "@/components/ui/loading-spinner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/lib/toast";
import { DEFAULT_VAT_RATE } from "@/config/constants";
import { Badge } from "@/components/ui/badge";
import React from "react";

export interface NoteFormConfig {
  type: "credit" | "debit";
  title: string;
  apiEndpoint: string;
  redirectPath: string;
  backHref: string;
  backLabel: string;
  accentColor: string;
  successMessage: string;
}

const COLOR_MAP: Record<string, {
  text: string;
  bg: string;
  border: string;
  button: string;
  buttonHover: string;
  totalPrefix: string;
  subtitle: string;
  reasonPlaceholder: string;
  submitLabel: string;
  responseKey: string;
  numberKey: string;
}> = {
  red: {
    text: "text-red-600",
    bg: "bg-red-500/5",
    border: "border-red-500/20",
    button: "bg-red-600",
    buttonHover: "hover:bg-red-700",
    totalPrefix: "-",
    subtitle: "Създайте кредитно известие за възстановяване на пари при връщане на продукт",
    submitLabel: "Създай кредитно известие",
    reasonPlaceholder: "Например: Връщане на продукт и възстановяване на пари",
    responseKey: "creditNote",
    numberKey: "creditNoteNumber",
  },
  emerald: {
    text: "text-emerald-600",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    button: "bg-emerald-600",
    buttonHover: "hover:bg-emerald-700",
    totalPrefix: "+",
    subtitle: "Създайте дебитно известие за доплащане при замяна на продукт",
    submitLabel: "Създай дебитно известие",
    reasonPlaceholder: "Например: Замяна на продукт с доплащане",
    responseKey: "debitNote",
    numberKey: "debitNoteNumber",
  },
};

const formatPrice = (value: number): string => {
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }
  const oneDecimal = Math.round(value * 10) / 10;
  if (oneDecimal === rounded) {
    return oneDecimal.toString();
  }
  return rounded.toFixed(2);
};

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class NoteFormErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Грешка</h1>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || "Възникна неочаквана грешка"}
            </p>
            <Button onClick={() => window.location.reload()}>Опитай отново</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function NoteFormContent(config: NoteFormConfig) {
  const colors = COLOR_MAP[config.accentColor] ?? COLOR_MAP.red;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sourceInvoices, setSourceInvoices] = useState<any[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  const [formData, setFormData] = useState({
    companyId: "",
    clientId: "",
    invoiceId: "",
    issueDate: new Date().toISOString().split("T")[0],
    reason: "",
    currency: "EUR",
    notes: "",
  });

  const [items, setItems] = useState<
    Array<{
      id: number;
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
    }>
  >([
    {
      id: 1,
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: DEFAULT_VAT_RATE,
    },
  ]);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingData(true);
        const [clientsRes, companiesRes, productsRes, invoicesRes] = await Promise.all([
          fetch("/api/clients").catch(() => ({ ok: false, json: async () => ({ clients: [] }) })),
          fetch("/api/companies").catch(() => ({ ok: false, json: async () => ({ companies: [] }) })),
          fetch("/api/products").catch(() => ({ ok: false, json: async () => ({ products: [] }) })),
          fetch("/api/invoices?pageSize=100&status=ISSUED").catch(() => ({
            ok: false,
            json: async () => ({ data: [] }),
          })),
        ]);

        const clientsData = await clientsRes.json();
        const companiesData = await companiesRes.json();
        const productsData = await productsRes.json();
        const invoicesData = await invoicesRes.json();

        const clientsArray = Array.isArray(clientsData) ? clientsData : (clientsData.clients || []);
        const companiesArray = Array.isArray(companiesData) ? companiesData : (companiesData.companies || []);
        const productsArray = Array.isArray(productsData) ? productsData : (productsData.products || []);
        const invoicesArray = Array.isArray(invoicesData)
          ? invoicesData
          : Array.isArray(invoicesData.data)
            ? invoicesData.data
            : [];

        setClients(clientsArray.filter((c: any) => c?.id && c?.name));
        setCompanies(companiesArray.filter((c: any) => c?.id && c?.name));
        setProducts(productsArray.filter((p: any) => p?.id && p?.name));
        setSourceInvoices(
          invoicesArray.filter(
            (invoice: any) => invoice?.id && invoice?.invoiceNumber && invoice?.status === "ISSUED"
          )
        );
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err?.message || "Грешка при зареждане на данни");
        toast.error("Грешка при зареждане на данни");
        setClients([]);
        setCompanies([]);
        setProducts([]);
        setSourceInvoices([]);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, []);

  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    if (!productSearchQuery.trim()) return products;
    const query = productSearchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product?.name?.toLowerCase().includes(query) ||
        product?.description?.toLowerCase().includes(query)
    );
  }, [products, productSearchQuery]);

  const eligibleInvoices = useMemo(() => {
    return sourceInvoices.filter((invoice) => {
      const matchesCompany = !formData.companyId || invoice.companyId === formData.companyId;
      const matchesClient = !formData.clientId || invoice.clientId === formData.clientId;
      return matchesCompany && matchesClient;
    });
  }, [formData.clientId, formData.companyId, sourceInvoices]);

  const addItem = useCallback(() => {
    setItems((prev) => {
      const maxId = prev.length > 0 ? Math.max(...prev.map((i) => i.id)) : 0;
      return [
        ...prev,
        {
          id: maxId + 1,
          description: "",
          quantity: 1,
          unitPrice: 0,
          taxRate: DEFAULT_VAT_RATE,
        },
      ];
    });
  }, []);

  const removeItem = useCallback(
    (id: number) => {
      if (items.length > 1) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        toast.error("Трябва да има поне един артикул");
      }
    },
    [items.length]
  );

  const updateItem = useCallback((id: number, field: string, value: string | number) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }, []);

  const addProduct = useCallback(
    (product: any) => {
      setItems((prev) => {
        const maxId = prev.length > 0 ? Math.max(...prev.map((i) => i.id)) : 0;
        return [
          ...prev,
          {
            id: maxId + 1,
            description: product.name,
            quantity: 1,
            unitPrice: Number(product.price),
            taxRate: Number(product.taxRate) || DEFAULT_VAT_RATE,
          },
        ];
      });
      setShowProductSearch(false);
      setProductSearchQuery("");
      toast.success(`"${product.name}" добавен`, {
        description: `${formatPrice(Number(product.price))} ${formData.currency}`,
      });
    },
    [formData.currency]
  );

  const totals = items.reduce(
    (acc, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = itemSubtotal * (item.taxRate / 100);
      const itemTotal = itemSubtotal + itemTax;

      return {
        subtotal: acc.subtotal + itemSubtotal,
        taxAmount: acc.taxAmount + itemTax,
        total: acc.total + itemTotal,
      };
    },
    { subtotal: 0, taxAmount: 0, total: 0 }
  );

  useEffect(() => {
    if (!formData.invoiceId) return;

    const isStillEligible = eligibleInvoices.some(
      (invoice) => invoice.id === formData.invoiceId
    );

    if (!isStillEligible) {
      setFormData((prev) => ({ ...prev, invoiceId: "" }));
    }
  }, [eligibleInvoices, formData.invoiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyId || !formData.clientId) {
      toast.error("Моля, изберете компания и клиент");
      return;
    }

    if (items.some((item) => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast.error("Моля, попълнете всички полета на артикулите");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(config.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const fallbackMsg = `Грешка при създаване на ${config.type === "credit" ? "кредитно" : "дебитно"} известие`;
        const errorMessage = data.details
          ? `${data.error || fallbackMsg}: ${JSON.stringify(data.details)}`
          : data.error || fallbackMsg;
        throw new Error(errorMessage);
      }

      const noteData = data[colors.responseKey];
      toast.success(config.successMessage, {
        description: `Номер: ${noteData[colors.numberKey]}`,
      });

      router.push(`${config.redirectPath}/${noteData.id}`);
    } catch (err: any) {
      console.error(`Error creating ${config.type} note:`, err);
      toast.error(
        err.message ||
          `Грешка при създаване на ${config.type === "credit" ? "кредитно" : "дебитно"} известие`
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <FullPageLoader
        title={config.title}
        subtitle="Подготвяме фирмите, клиентите и наличните документи за формата..."
      />
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Грешка</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Опитай отново</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page-shell mx-auto max-w-6xl">
      {/* Header */}
      <div className="page-header">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href={config.backHref}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
          <h1 className="page-title mt-4">{config.title}</h1>
          <p className="card-description mt-1 max-w-2xl">{colors.subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          {/* Left Column */}
          <div className="space-y-5">
            {/* Company & Client */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Компания и клиент
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyId">Компания *</Label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, companyId: value }))
                    }
                    aria-label="Изберете компания"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Изберете компания" />
                    </SelectTrigger>
                    <SelectContent className="z-100 max-h-[300px]">
                      {(companies || []).map((company) => (
                        <SelectItem key={company?.id} value={company?.id}>
                          {company?.name || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientId">Клиент *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, clientId: value }))
                    }
                    aria-label="Изберете клиент"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Изберете клиент" />
                    </SelectTrigger>
                    <SelectContent className="z-100 max-h-[300px]">
                      {(clients || []).map((client) => (
                        <SelectItem key={client?.id} value={client?.id}>
                          {client?.name || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceId">Свързана издадена фактура</Label>
                  <Select
                    value={formData.invoiceId || "none"}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        invoiceId: value === "none" ? "" : value,
                      }))
                    }
                    aria-label="Изберете свързана фактура"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Изберете издадена фактура" />
                    </SelectTrigger>
                    <SelectContent className="z-100 max-h-[300px]">
                      <SelectItem value="none">Без свързана фактура</SelectItem>
                      {eligibleInvoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNumber} - {invoice.client?.name || "Клиент"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Показват се само издадени фактури за избраните фирма и клиент.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Детайли
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate" className="text-sm font-medium">
                    Дата на издаване *
                  </Label>
                  <div className="relative">
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, issueDate: e.target.value }))
                      }
                      className="w-full pr-10"
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Причина *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, reason: e.target.value }))
                    }
                    placeholder={colors.reasonPlaceholder}
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Валута</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, currency: value }))
                    }
                    aria-label="Изберете валута"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-100">
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="BGN">BGN (лв)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Бележки (опционално)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Допълнителни бележки..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Items */}
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Артикули
                  </CardTitle>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {products.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProductSearch(!showProductSearch)}
                        className="btn-responsive"
                      >
                        <Search className="h-4 w-4 mr-1" />
                        Продукти
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={addItem} className="btn-responsive">
                      <Plus className="h-4 w-4 mr-1" />
                      Добави
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Search */}
                {showProductSearch && products.length > 0 && (
                  <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Търсене на продукти..."
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    {filteredProducts.length > 0 ? (
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {filteredProducts.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => addProduct(product)}
                            className="flex flex-col gap-3 rounded-xl border bg-background p-3 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate">
                                  {product.description}
                                </p>
                              )}
                            </div>
                            <div className="ml-0 flex flex-wrap items-center gap-2 sm:ml-2">
                              <span className="text-sm font-semibold">
                                {formatPrice(Number(product.price))} {formData.currency}
                              </span>
                              {product.taxRate && (
                                <Badge variant="secondary" className="text-xs">
                                  ДДС {Number(product.taxRate)}%
                                </Badge>
                              )}
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Няма намерени продукти
                      </p>
                    )}
                  </div>
                )}

                {items.map((item, index) => (
                  <div key={item.id} className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        Артикул {index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Описание *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Описание на артикула..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 min-[375px]:grid-cols-3 gap-3 sm:gap-2">
                      <div className="space-y-1.5">
                        <Label className="block text-xs font-medium">К-во</Label>
                        <NumericInput
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", parseFloat(e.target.value) || 1)
                          }
                          className="w-full"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="block text-xs font-medium">Цена</Label>
                        <NumericInput
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)
                          }
                          className="w-full"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="block text-xs font-medium">ДДС %</Label>
                        <NumericInput
                          value={item.taxRate}
                          onChange={(e) =>
                            updateItem(item.id, "taxRate", parseFloat(e.target.value) || 0)
                          }
                          className="w-full"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Общо:</span>
                        <span className={`font-bold ${colors.text}`}>
                          {formatPrice(item.quantity * item.unitPrice * (1 + item.taxRate / 100))}{" "}
                          {formData.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card className={`${colors.bg} ${colors.border}`}>
              <CardHeader>
                <CardTitle>Общо</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Сума без ДДС:</span>
                  <span>
                    {formatPrice(totals.subtotal)} {formData.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ДДС:</span>
                  <span>
                    {formatPrice(totals.taxAmount)} {formData.currency}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Общо:</span>
                    <span className={colors.text}>
                      {colors.totalPrefix}
                      {formatPrice(totals.total)} {formData.currency}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col gap-3 border-t border-border/50 pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" asChild className="btn-responsive">
            <Link href={config.backHref}>Отказ</Link>
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className={`btn-responsive ${colors.button} ${colors.buttonHover}`}
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="small" className="mr-2 text-white" />
                Създаване...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                {colors.submitLabel}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function NoteForm(config: NoteFormConfig) {
  return (
    <NoteFormErrorBoundary>
      <NoteFormContent {...config} />
    </NoteFormErrorBoundary>
  );
}
