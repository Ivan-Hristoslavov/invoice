"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";

// Helper function to format price without trailing zeros
// Helper function to format price - removes unnecessary trailing zeros
const formatPrice = (value: number): string => {
  // Round to 2 decimal places to avoid floating point issues
  const rounded = Math.round(value * 100) / 100;
  
  // If it's a whole number, show without decimals
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  }
  
  // Check if it has only one decimal place (e.g., 1.2, 5.5)
  const oneDecimal = Math.round(value * 10) / 10;
  if (oneDecimal === rounded) {
    return oneDecimal.toString();
  }
  
  // Otherwise show 2 decimal places
  return rounded.toFixed(2);
};

function formatLongDate(value: string): string {
  return new Date(value).toLocaleDateString("bg-BG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight,
  Save, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Check, 
  Edit, 
  User, 
  Calendar, 
  Building2, 
  DollarSign, 
  FileText, 
  CheckCircle2,
  Package,
  Receipt,
  Sparkles,
  ShoppingCart,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  Hash,
  Clock,
  AlertCircle,
  Crown,
  Lock,
  AlertTriangle,
  Banknote,
  Coins,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter,
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input, NumericInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { DEFAULT_VAT_RATE } from "@/config/constants";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { UsageCounter } from "@/components/ui/pro-feature-lock";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormDatePicker } from "@/components/ui/date-picker";

// Step indicator component
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: { title: string; icon: React.ReactNode }[] }) {
  return (
    <div className="mb-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex min-w-max items-center justify-center gap-2 px-1">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex flex-col items-center gap-2">
            <div className={`
              relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-10 sm:w-10
              ${index < currentStep 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : index === currentStep 
                  ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25' 
                  : 'bg-muted border-muted-foreground/20 text-muted-foreground'}
            `}>
              <div className="absolute inset-0 flex items-center justify-center">
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="flex items-center justify-center h-4 w-4">
                    {step.icon}
                  </div>
                )}
              </div>
            </div>
            <p className={`hidden text-xs font-medium whitespace-nowrap text-center sm:block ${index === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-0.5 w-6 transition-all duration-300 sm:w-12 md:w-16 ${index < currentStep ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`} />
          )}
        </div>
      ))}
      </div>
    </div>
  );
}

// Product card component
function ProductCard({ 
  product, 
  currency, 
  onAdd
}: { 
  product: any; 
  currency: string; 
  onAdd: () => void;
}) {
  return (
    <div
      onClick={onAdd}
      className="group relative overflow-hidden rounded-lg border border-border bg-card p-3 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:bg-primary/2"
    >
      <div className="flex items-center gap-3">
        {/* Add button */}
        <div className="shrink-0 w-7 h-7 rounded-lg bg-primary/10 group-hover:bg-primary flex items-center justify-center transition-all duration-200">
          <Plus className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground transition-colors" />
        </div>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {product.name}
          </p>
          {product.description && (
            <p className="text-xs text-muted-foreground truncate">
              {product.description}
            </p>
          )}
        </div>

        {/* Price + VAT badge */}
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums">
            {formatPrice(Number(product.price))}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">{currency}</span>
          </p>
          {product.taxRate ? (
            <span className="text-[10px] text-muted-foreground">ДДС {Number(product.taxRate)}%</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Client card component
function ClientCard({ 
  client, 
  onSelect, 
  isSelected 
}: { 
  client: any; 
  onSelect: () => void;
  isSelected?: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={`
        group relative overflow-hidden rounded-xl border-2 p-5 cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
          : 'border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 bg-card'}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-colors
          ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'}
        `}>
          {client.name.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base truncate">{client.name}</h4>
          
          <div className="mt-2 space-y-1">
            {client.email && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{client.phone}</span>
              </div>
            )}
            {(client.city || client.country) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{[client.city, client.country].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </div>
        </div>
        
        {isSelected && (
          <div className="absolute top-3 right-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Invoice item card component using Radix UI style
function InvoiceItemCard({
  item,
  index,
  onUpdate,
  onRemove,
  canRemove,
  currency
}: {
  item: any;
  index: number;
  onUpdate: (field: string, value: string | number) => void;
  onRemove: () => void;
  canRemove: boolean;
  currency: string;
}) {
  const itemTotal = item.quantity * item.unitPrice;
  const itemTax = itemTotal * (item.taxRate / 100);
  const itemTotalWithTax = itemTotal + itemTax;
  
  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
      {/* Compact header row */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border/40">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-primary/15 text-primary text-[10px] font-bold shrink-0">
          {index + 1}
        </span>
        <span className="text-xs text-muted-foreground flex-1">Артикул</span>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 rounded p-0 text-destructive opacity-100 transition-all hover:bg-destructive/10 sm:h-6 sm:w-6 sm:opacity-0 sm:group-hover:opacity-100"
            onClick={onRemove}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Description */}
        <Input
          value={item.description}
          onChange={(e) => onUpdate("description", e.target.value)}
          placeholder="Описание на артикула..."
          className="h-9 text-sm border-border/60 focus:border-primary"
        />

        {/* Qty / Price / VAT */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">К-во</label>
            <NumericInput
              allowDecimal={false}
              value={item.quantity}
              onChange={(e) => onUpdate("quantity", parseInt(e.target.value) || 1)}
              className="h-8 text-sm text-center font-medium"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Цена</label>
            <NumericInput
              value={item.unitPrice}
              onChange={(e) => onUpdate("unitPrice", parseFloat(e.target.value) || 0)}
              className="h-8 text-sm font-medium"
              placeholder={currency}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-muted-foreground uppercase tracking-wider">ДДС %</label>
            <NumericInput
              value={item.taxRate}
              onChange={(e) => onUpdate("taxRate", parseFloat(e.target.value) || 0)}
              className="h-8 text-sm text-center font-medium"
            />
          </div>
        </div>
      </div>

      {/* Total footer */}
      <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border-t border-primary/10">
        <span className="text-[11px] text-muted-foreground">Общо с ДДС</span>
        <span className="text-sm font-bold text-primary tabular-nums">
          {formatPrice(itemTotalWithTax)} {currency}
        </span>
      </div>
    </div>
  );
}

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client");
  
  // State
  const [currentStep, setCurrentStep] = useState(preselectedClientId ? 1 : 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  
  // Subscription limit hook
  const { 
    isFree, 
    getInvoiceUsage, 
    canCreateInvoice,
    isLoadingUsage,
    refreshUsage
  } = useSubscriptionLimit();
  
  const invoiceUsage = getInvoiceUsage();
  
  const [items, setItems] = useState<Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>>([]);
  
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    issueDate: new Date().toISOString().substr(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10),
    companyId: "",
    currency: "EUR",
    bulstatNumber: "",
    isOriginal: true,
    placeOfIssue: "София",
    paymentMethod: "BANK_TRANSFER",
    supplyDate: new Date().toISOString().substr(0, 10),
    isEInvoice: false
  });

  const steps = [
    { title: "Клиент", icon: <User className="h-5 w-5" /> },
    { title: "Детайли", icon: <FileText className="h-5 w-5" /> },
    { title: "Продукти", icon: <Package className="h-5 w-5" /> },
    { title: "Преглед", icon: <Receipt className="h-5 w-5" /> },
  ];

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingData(true);
        
        // Fetch all data in parallel
        const [clientsRes, companiesRes, productsRes] = await Promise.allSettled([
          fetch('/api/clients'),
          fetch('/api/companies'),
          fetch('/api/products')
        ]);
        
        // Process clients
        if (clientsRes.status === 'fulfilled' && clientsRes.value.ok) {
          const clientsData = await clientsRes.value.json();
          setClients(clientsData);
          
          if (preselectedClientId) {
            const foundClient = clientsData.find((c: any) => c.id === preselectedClientId);
            if (foundClient) {
              setSelectedClient(foundClient);
              setCurrentStep(1);
            }
          }
        }
        
        // Process companies
        if (companiesRes.status === 'fulfilled' && companiesRes.value.ok) {
          const companiesData = await companiesRes.value.json();
          setCompanies(companiesData);
          if (companiesData.length > 0) {
            setInvoiceData(prev => ({ ...prev, companyId: companiesData[0].id }));
          }
        }
        
        // Process products
        if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
          const productsData = await productsRes.value.json();
          setProducts(productsData);
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    }
    
    fetchData();
  }, [preselectedClientId]);

  // Generate invoice number when company changes
  useEffect(() => {
    async function generateInvoiceNumber() {
      if (!invoiceData.companyId) return;

      try {
        const response = await fetch(`/api/invoices/next-number?companyId=${invoiceData.companyId}`);
        const data = await response.json();
        
        if (data.invoiceNumber) {
          setInvoiceData(prev => ({ ...prev, invoiceNumber: data.invoiceNumber }));
        }
      } catch (error) {
        const currentYear = new Date().getFullYear();
        setInvoiceData(prev => ({ ...prev, invoiceNumber: `${currentYear}000001` }));
      }
    }

    generateInvoiceNumber();
  }, [invoiceData.companyId]);

  // Filtered data
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.city?.toLowerCase().includes(query)
    );
  }, [clients, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return products;
    const query = productSearchQuery.toLowerCase();
    return products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  }, [products, productSearchQuery]);

  // Calculations
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const tax = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.taxRate / 100), 0);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items]);

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === invoiceData.companyId),
    [companies, invoiceData.companyId]
  );

  const previewItems = useMemo(
    () => items.filter((item) => item.description.trim()),
    [items]
  );

  const paymentMethodLabel = useMemo(() => {
    if (invoiceData.paymentMethod === "BANK_TRANSFER") return "Банков превод";
    if (invoiceData.paymentMethod === "CASH") return "В брой";
    if (invoiceData.paymentMethod === "CREDIT_CARD") return "Кредитна/дебитна карта";
    return "Друго";
  }, [invoiceData.paymentMethod]);

  // Handlers
  const selectClient = useCallback((client: any) => {
    setSelectedClient(client);
    setCurrentStep(1);
  }, []);

  const handleInputChange = useCallback((field: string, value: string | boolean) => {
    setInvoiceData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'companyId') {
        const company = companies.find(c => c.id === value);
        return {
          ...newData,
          bulstatNumber: company?.bulstatNumber || company?.vatNumber?.replace(/^BG/, '') || '',
          placeOfIssue: company?.city || "София",
        };
      }
      
      return newData;
    });
  }, [companies]);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, {
      id: prev.length > 0 ? Math.max(...prev.map(i => i.id)) + 1 : 1,
      description: "",
      quantity: 1,
      unitPrice: 0, // Default to 0, user should set the price or select a product
      taxRate: DEFAULT_VAT_RATE
    }]);
  }, []);

  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItem = useCallback((id: number, field: string, value: string | number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  const addProduct = useCallback((product: any) => {
    const newItem = {
      id: Math.max(0, ...items.map(i => i.id)) + 1,
      description: product.name,
      quantity: 1,
      unitPrice: Number(product.price),
      taxRate: Number(product.taxRate) || DEFAULT_VAT_RATE
    };
    setItems(prev => [...prev, newItem]);
    toast.success(`"${product.name}" добавен`, {
      description: `${formatPrice(Number(product.price))} ${invoiceData.currency}`
    });
  }, [items, invoiceData.currency]);

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      if (!selectedClient) {
        toast.error("Моля, изберете клиент");
        setCurrentStep(0);
        return;
      }
      
      if (!invoiceData.companyId) {
        toast.error("Моля, изберете фирма");
        setCurrentStep(1);
        return;
      }
      
      const validItems = items.filter(item => item.description.trim());
      if (validItems.length === 0) {
        toast.error("Добавете поне един артикул");
        setCurrentStep(2);
        return;
      }
      
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          companyId: invoiceData.companyId,
          issueDate: invoiceData.issueDate,
          dueDate: invoiceData.dueDate,
          supplyDate: invoiceData.supplyDate,
          currency: invoiceData.currency,
          placeOfIssue: invoiceData.placeOfIssue,
          paymentMethod: invoiceData.paymentMethod,
          isEInvoice: invoiceData.isEInvoice,
          isOriginal: invoiceData.isOriginal,
          items: validItems.map(item => ({
            description: item.description,
            quantity: Number(item.quantity),
            price: Number(item.unitPrice), // API expects 'price', not 'unitPrice'
            taxRate: Number(item.taxRate)
          }))
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Handle both formats: { error: "message" } and { error: { message: "message" } }
        const errorMessage = typeof errorData.error === 'string' 
          ? errorData.error 
          : errorData.error?.message || "Грешка при създаване";
        throw new Error(errorMessage);
      }
      
      // Refresh usage data after successful creation
      refreshUsage();
      
      toast.success("Фактурата е създадена успешно!", {
        action: {
          label: "Виж фактурата",
          onClick: () => router.push("/invoices"),
        },
      });
      router.push("/invoices");
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error(error.message || "Грешка при създаване на фактура", {
        duration: 5000,
        description: error.message?.includes("план") 
          ? "Надградете плана си за повече фактури." 
          : undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = { BGN: 'лв', EUR: '€', USD: '$' };
    return symbols[currency] || currency;
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      // Step 0: Client Selection
      case 0:
        return (
          <div className="space-y-5">
            <div className="text-center mb-8">
              <h2 className="mb-1.5 text-xl font-bold sm:text-2xl">Изберете клиент</h2>
              <p className="text-muted-foreground">Изберете съществуващ клиент или създайте нов</p>
            </div>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="search"
                placeholder="Търсене по име, имейл или град..."
                className="pl-12 pr-10 h-12 text-base rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 z-10"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {/* Client grid */}
            {isLoadingData ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Зареждане на клиенти...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Няма намерени клиенти</p>
                <Button asChild>
                  <Link href="/clients/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Създаване на нов клиент
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onSelect={() => selectClient(client)}
                    isSelected={selectedClient?.id === client.id}
                  />
                ))}
              </div>
            )}
          </div>
        );

      // Step 1: Invoice Details
      case 1:
        return (
          <div className="space-y-5">
            <div className="text-center mb-6">
              <h2 className="mb-1 text-xl font-bold sm:text-2xl">Детайли на фактурата</h2>
              <p className="text-muted-foreground text-sm">Настройте основните данни за фактурата</p>
            </div>

            {/* Compact invoice number summary */}
            <Card className="border-primary/15 bg-linear-to-r from-primary/8 via-card to-card shadow-sm">
              <CardContent className="p-4">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Номер на фактура
                      </p>
                      <p className="truncate font-mono text-lg font-semibold tracking-tight sm:text-xl">
                        {invoiceData.invoiceNumber || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex items-center justify-center rounded-xl border border-border/70 bg-background px-3 py-2 text-sm font-semibold shadow-xs">
                    {invoiceData.currency}
                  </div>
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Автоматичен №
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main 2-column layout */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
              {/* Left: Date & Payment fields (3/5 on lg) */}
              <div className="lg:col-span-3 space-y-5">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Дати на фактурата
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormDatePicker
                        label="Дата на издаване"
                        value={invoiceData.issueDate}
                        onChange={(val) => handleInputChange('issueDate', val)}
                      />
                      <FormDatePicker
                        label="Краен срок за плащане"
                        value={invoiceData.dueDate}
                        onChange={(val) => handleInputChange('dueDate', val)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormDatePicker
                        label="Дата на данъчното събитие"
                        value={invoiceData.supplyDate}
                        onChange={(val) => handleInputChange('supplyDate', val)}
                      />
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Място на издаване</Label>
                        <Input
                          value={invoiceData.placeOfIssue}
                          onChange={(e) => handleInputChange('placeOfIssue', e.target.value)}
                          placeholder="напр. София"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Плащане
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Начин на плащане</Label>
                      <Select
                        value={invoiceData.paymentMethod}
                        onValueChange={(value) => handleInputChange('paymentMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BANK_TRANSFER">
                            <span className="flex items-center gap-2"><Banknote className="h-4 w-4 text-blue-500" />Банков превод</span>
                          </SelectItem>
                          <SelectItem value="CASH">
                            <span className="flex items-center gap-2"><Coins className="h-4 w-4 text-emerald-500" />В брой</span>
                          </SelectItem>
                          <SelectItem value="CREDIT_CARD">
                            <span className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-violet-500" />Кредитна/дебитна карта</span>
                          </SelectItem>
                          <SelectItem value="OTHER">
                            <span className="flex items-center gap-2"><MoreHorizontal className="h-4 w-4 text-muted-foreground" />Друго</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Client, Company, Currency (2/5 on lg) */}
              <div className="lg:col-span-2 space-y-5">
                {/* Client summary */}
                {selectedClient && (
                  <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        Клиент
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary shrink-0 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                          {selectedClient.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{selectedClient.name}</p>
                          {selectedClient.email && (
                            <p className="text-xs text-muted-foreground truncate">{selectedClient.email}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(0)} className="shrink-0 h-8 px-2">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Фирма и валута
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Вашата фирма</Label>
                      <Select
                        value={invoiceData.companyId}
                        onValueChange={(value) => handleInputChange('companyId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Изберете фирма" />
                        </SelectTrigger>
                        <SelectContent>
                          {companies.map(company => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Валута</Label>
                      <Select
                        value={invoiceData.currency}
                        onValueChange={(value) => handleInputChange('currency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BGN">🇧🇬 BGN - Лев</SelectItem>
                          <SelectItem value="EUR">🇪🇺 EUR - Евро</SelectItem>
                          <SelectItem value="USD">🇺🇸 USD - Долар</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      // Step 2: Products
      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center mb-8">
              <h2 className="mb-1.5 text-xl font-bold sm:text-2xl">Добавете продукти</h2>
              <p className="text-muted-foreground">Изберете от каталога или добавете ръчно</p>
            </div>
            
            {/* Products catalog */}
            {products.length > 0 && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Каталог с продукти
                      </CardTitle>
                      <CardDescription>Кликнете върху продукт за да го добавите</CardDescription>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        type="search"
                        placeholder="Търсене..."
                        className="pl-12 pr-3"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        currency={invoiceData.currency}
                        onAdd={() => addProduct(product)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Invoice items */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="card-title flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                      <span className="truncate">Артикули</span>
                    </CardTitle>
                    <CardDescription className="card-description mt-1">{items.length} артикул(а)</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={addItem}
                    className="btn-responsive btn-text"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Добави ред</span>
                    <span className="sm:hidden">Добави</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Няма добавени артикули</p>
                    <p className="text-sm mt-1">Изберете продукт от каталога или добавете ръчно</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {items.map((item, index) => (
                      <InvoiceItemCard
                        key={item.id}
                        item={item}
                        index={index}
                        onUpdate={(field, value) => updateItem(item.id, field, value)}
                        onRemove={() => removeItem(item.id)}
                        canRemove={true}
                        currency={invoiceData.currency}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      // Step 3: Review
      case 3:
        return (
          <div className="space-y-5">
            <div className="flex flex-col gap-2 text-center sm:text-left">
              <h2 className="text-xl font-bold sm:text-2xl">Преглед на фактурата</h2>
              <p className="text-sm text-muted-foreground">
                Проверете документа и сумите преди създаване.
              </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_320px]">
              <Card className="solid-card overflow-hidden border-2 bg-white dark:bg-slate-900">
                <div className="border-b border-border/60 bg-muted/20 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Фактура №:
                      </span>
                      <p className="min-w-0 truncate font-mono text-base font-bold tracking-tight sm:text-lg">
                        {invoiceData.invoiceNumber}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="px-2.5 py-1 text-xs sm:text-sm">
                        {invoiceData.currency}
                      </Badge>
                      <Badge variant="outline" className="px-2.5 py-1 text-xs sm:text-sm">
                        {previewItems.length} {previewItems.length === 1 ? "артикул" : "артикула"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">От</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold sm:text-base">{selectedCompany?.name || "-"}</p>
                        {selectedCompany?.email && (
                          <p className="text-xs text-muted-foreground sm:text-sm">{selectedCompany.email}</p>
                        )}
                        {selectedCompany?.address && (
                          <p className="text-xs text-muted-foreground sm:text-sm">{selectedCompany.address}</p>
                        )}
                        {selectedCompany?.city && (
                          <p className="text-xs text-muted-foreground sm:text-sm">{selectedCompany.city}</p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">До</p>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold sm:text-base">{selectedClient?.name || "-"}</p>
                        {selectedClient?.email && (
                          <p className="text-xs text-muted-foreground sm:text-sm">{selectedClient.email}</p>
                        )}
                        {selectedClient?.phone && (
                          <p className="text-xs text-muted-foreground sm:text-sm">{selectedClient.phone}</p>
                        )}
                        {(selectedClient?.city || selectedClient?.country) && (
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            {[selectedClient?.city, selectedClient?.country].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Артикули
                      </p>
                    </div>

                    <div className="space-y-2.5 md:hidden">
                      {previewItems.map((item, index) => {
                        const itemTotal = item.quantity * item.unitPrice;
                        const itemTotalWithVat = itemTotal + itemTotal * (item.taxRate / 100);

                        return (
                          <div key={item.id} className="rounded-xl border border-border/70 bg-card/70 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Артикул {index + 1}
                                </p>
                                <p className="mt-1 wrap-break-word text-sm font-semibold">{item.description}</p>
                              </div>
                              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                                x{item.quantity}
                              </span>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm">
                              <div className="rounded-lg bg-muted/30 p-2.5">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ед. цена</p>
                                <p className="mt-1 font-semibold">
                                  {formatPrice(item.unitPrice)} {invoiceData.currency}
                                </p>
                              </div>
                              <div className="rounded-lg bg-muted/30 p-2.5">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">ДДС</p>
                                <p className="mt-1 font-semibold">{item.taxRate}%</p>
                              </div>
                              <div className="rounded-lg bg-muted/30 p-2.5">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Подсума</p>
                                <p className="mt-1 font-semibold">
                                  {formatPrice(itemTotal)} {invoiceData.currency}
                                </p>
                              </div>
                              <div className="rounded-lg bg-primary/5 p-2.5">
                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Общо с ДДС</p>
                                <p className="mt-1 font-semibold text-primary">
                                  {formatPrice(itemTotalWithVat)} {invoiceData.currency}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="hidden overflow-hidden rounded-lg border md:block">
                      <div className="grid grid-cols-12 gap-3 border-b bg-muted/50 px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <div className="col-span-1 text-center">№</div>
                        <div className="col-span-6">Описание</div>
                        <div className="col-span-2 text-right">Количество</div>
                        <div className="col-span-3 text-right">Общо</div>
                      </div>
                      <div className="divide-y">
                        {previewItems.map((item, index) => {
                          const itemTotal = item.quantity * item.unitPrice;

                          return (
                            <div key={item.id} className="grid grid-cols-12 gap-3 px-3 py-3 transition-colors hover:bg-muted/30">
                              <div className="col-span-1 text-center text-xs font-medium text-muted-foreground sm:text-sm">
                                {index + 1}
                              </div>
                              <div className="col-span-6">
                                <p className="mb-0.5 text-sm font-semibold">{item.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatPrice(item.unitPrice)} {invoiceData.currency} × {item.quantity} (ДДС {item.taxRate}%)
                                </p>
                              </div>
                              <div className="col-span-2 text-right text-sm font-medium">
                                {item.quantity}
                              </div>
                              <div className="col-span-3 text-right">
                                <p className="text-sm font-semibold">
                                  {formatPrice(itemTotal)} {invoiceData.currency}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
                <Card className="border-border/70">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Receipt className="h-4 w-4 text-primary" />
                      Обобщение
                    </CardTitle>
                    <CardDescription>Най-важното за документа на едно място.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Дата на издаване</p>
                        <p className="mt-1 text-sm font-semibold">{formatLongDate(invoiceData.issueDate)}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Краен срок</p>
                        <p className="mt-1 text-sm font-semibold">{formatLongDate(invoiceData.dueDate)}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Начин на плащане</p>
                        <p className="mt-1 text-sm font-semibold">{paymentMethodLabel}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Място на издаване</p>
                        <p className="mt-1 text-sm font-semibold">{invoiceData.placeOfIssue || "-"}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Дата на доставка</p>
                        <p className="mt-1 text-sm font-semibold">{formatLongDate(invoiceData.supplyDate)}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Тип</p>
                        <p className="mt-1 text-sm font-semibold">{invoiceData.isOriginal ? "Оригинал" : "Копие"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-background to-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Суми</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 rounded-xl border border-border/60 bg-background/50 p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-muted-foreground">Подсума</span>
                        <span className="font-semibold tabular-nums">
                          {formatPrice(totals.subtotal)} {invoiceData.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-muted-foreground">ДДС</span>
                        <span className="font-semibold tabular-nums">
                          {formatPrice(totals.tax)} {invoiceData.currency}
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-primary/10 p-3">
                      <div className="flex items-end justify-between gap-3">
                        <span className="text-sm font-semibold uppercase tracking-wide text-foreground/90">
                          Общо
                        </span>
                        <span className="text-xl font-bold text-primary tabular-nums sm:text-2xl">
                          {getCurrencySymbol(invoiceData.currency)} {formatPrice(totals.total)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Block invoice creation until at least one company exists
  if (!isLoadingData && companies.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="mb-4">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 shrink-0 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">Нужна е поне една компания</CardTitle>
                <CardDescription className="mt-1.5">
                  За да създавате фактури, първо трябва да добавите вашата фирма (компания). След това ще можете да продължите.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardFooter>
            <Button asChild className="bg-primary hover:bg-primary/90 flex items-center"><Link href="/companies/new" className="flex items-center"><Building2 className="mr-2 h-4 w-4" />Създай компания</Link></Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Subscription limit warning */}
      {isFree && !isLoadingUsage && !canCreateInvoice && (
        <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-red-800 dark:text-red-200">
              Достигнахте лимита от <strong>3 фактури</strong> за този месец. 
              Надградете до PRO за неограничени фактури.
            </span>
            <Link href="/settings/subscription">
              <Button size="sm" className="ml-4 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                <Crown className="h-4 w-4 mr-2" />
                Надградете до PRO
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {isFree && !isLoadingUsage && canCreateInvoice && invoiceUsage.remaining === 1 && (
        <Alert className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              Остава ви само <strong>1 фактура</strong> за този месец. 
              Надградете за неограничени фактури.
            </span>
            <Link href="/settings/subscription">
              <Button size="sm" variant="outline" className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100">
                <Crown className="h-4 w-4 mr-2" />
                Надградете
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Button variant="ghost" size="icon" asChild className="back-btn h-8 w-8 rounded-full">
              <Link href="/invoices">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="page-title truncate">Нова фактура</h1>
                {isFree && !isLoadingUsage && (
                  <UsageCounter 
                    used={invoiceUsage.used} 
                    limit={invoiceUsage.limit === Infinity ? 0 : invoiceUsage.limit}
                    label="този месец"
                  />
                )}
              </div>
              <p className="card-description hidden sm:block">Създайте нова фактура за вашите клиенти</p>
            </div>
          </div>
        </div>

        {/* Wizard shell */}
        <Card className="rounded-2xl border-border/60 bg-linear-to-br from-card/80 via-card to-card/90 shadow-xl shadow-primary/5">
          <CardHeader className="border-b border-border/40 pb-3">
            <StepIndicator currentStep={currentStep} steps={steps} />
          </CardHeader>
          <CardContent className="pt-5">
            {renderStepContent()}
          </CardContent>
          <CardFooter className="mt-3 border-t border-border/40 pt-5">
            <div className="flex w-full items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>

              <div className="flex justify-end">
                {currentStep < 3 ? (
                  <Button
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={
                      (currentStep === 0 && !selectedClient) ||
                      (currentStep === 1 && !invoiceData.companyId)
                    }
                    className="gap-2"
                  >
                    Напред
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : !isLoadingUsage && !canCreateInvoice && isFree ? (
                  <Link href="/settings/subscription">
                    <Button
                      className="gap-2 border-dashed border-amber-300 dark:border-amber-700 hover:border-amber-400"
                      variant="outline"
                    >
                      <Lock className="h-4 w-4 text-amber-500" />
                      Създай фактура
                      <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                        PRO
                      </span>
                    </Button>
                  </Link>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="gap-2 bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Създаване...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Създай фактура
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

// Loading fallback component
function NewInvoiceLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground">Зареждане...</p>
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<NewInvoiceLoading />}>
      <NewInvoiceContent />
    </Suspense>
  );
}
