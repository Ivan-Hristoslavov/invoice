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
  Plus, 
  Trash2, 
  Search, 
  Check, 
  Edit, 
  User, 
  Calendar, 
  Building2, 
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
  Crown,
  Lock,
  AlertTriangle,
  Banknote,
  Coins,
  MoreHorizontal,
  Loader2
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
import { useCompanyBookLookup } from "@/hooks/useCompanyBookLookup";
import { UsageCounter } from "@/components/ui/pro-feature-lock";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormDatePicker } from "@/components/ui/date-picker";
import {
  defaultInvoiceClientDraft,
  mapInvoiceClientApiErrors,
  parseInvoiceClientDraft,
  validateInvoiceClientDraft,
  type InvoiceClientDraftErrors,
  type InvoiceClientDraftInput,
} from "@/lib/invoice-client-draft";

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

type ClientCreationMode = "eik" | "manual";

function ClientCreationMethodCard({
  title,
  description,
  icon,
  isSelected,
  onSelect,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        group relative flex w-full flex-col overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-300
        ${isSelected 
          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
          : 'border-border bg-card hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg'}
      `}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-4">
        <div className={`
          flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold transition-colors
          ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'}
        `}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold">{title}</h4>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>

        {isSelected && (
          <div className="absolute right-3 top-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </div>
    </button>
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
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/40 bg-muted/40 px-4 py-3">
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[11px] font-bold text-primary">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Артикул {index + 1}</p>
          <p className="text-xs text-muted-foreground">Ред от фактурата</p>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-lg p-0 text-destructive opacity-100 transition-all hover:bg-destructive/10 sm:h-8 sm:w-8 sm:opacity-0 sm:group-hover:opacity-100"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Описание</Label>
          <Input
            value={item.description}
            onChange={(e) => onUpdate("description", e.target.value)}
            placeholder="Описание на артикула..."
            className="h-11 border-border/60 text-base focus:border-primary sm:h-10 sm:text-sm"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Количество</Label>
            <NumericInput
              allowDecimal={false}
              value={item.quantity}
              onChange={(e) => onUpdate("quantity", parseInt(e.target.value) || 1)}
              className="h-11 text-base font-medium sm:h-10 sm:text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">ДДС %</Label>
            <NumericInput
              value={item.taxRate}
              onChange={(e) => onUpdate("taxRate", parseFloat(e.target.value) || 0)}
              className="h-11 text-base font-medium sm:h-10 sm:text-sm"
            />
          </div>
          <div className="space-y-1 sm:col-span-1">
            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Единична цена</Label>
            <NumericInput
              value={item.unitPrice}
              onChange={(e) => onUpdate("unitPrice", parseFloat(e.target.value) || 0)}
              className="h-11 text-base font-medium sm:h-10 sm:text-sm"
              placeholder={currency}
            />
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Подсума</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {formatPrice(itemTotal)} {currency}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">ДДС</p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {formatPrice(itemTax)} {currency}
            </p>
          </div>
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Общо с ДДС</p>
            <p className="mt-1 text-sm font-bold text-primary tabular-nums">
              {formatPrice(itemTotalWithTax)} {currency}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client");
  
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientCreationMode, setClientCreationMode] = useState<ClientCreationMode | null>(null);
  const [clientDraft, setClientDraft] = useState<InvoiceClientDraftInput>(defaultInvoiceClientDraft);
  const [clientErrors, setClientErrors] = useState<InvoiceClientDraftErrors>({});
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
        
        // Fetch required data in parallel
        const [companiesRes, productsRes, clientsRes] = await Promise.allSettled([
          fetch('/api/companies'),
          fetch('/api/products'),
          preselectedClientId ? fetch('/api/clients') : Promise.resolve(null)
        ]);
        
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

        if (
          preselectedClientId &&
          clientsRes.status === "fulfilled" &&
          clientsRes.value &&
          "ok" in clientsRes.value &&
          clientsRes.value.ok
        ) {
          const clientsData = await clientsRes.value.json();
          const foundClient = clientsData.find((client: any) => client.id === preselectedClientId);
          if (foundClient) {
            setSelectedClient(foundClient);
            setCurrentStep(1);
          }
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

  const currentStepDetails = steps[currentStep];
  const recipientPreview = selectedClient ?? (clientCreationMode ? clientDraft : null);
  const clientMethodLabel =
    selectedClient && !clientCreationMode
      ? "Избран клиент"
      : clientCreationMode === "eik"
        ? "По ЕИК"
        : clientCreationMode === "manual"
          ? "Ръчно"
          : null;

  // Handlers
  const updateClientDraft = useCallback((field: keyof InvoiceClientDraftInput, value: string | boolean) => {
    setSelectedClient(null);
    setClientDraft((prev) => ({ ...prev, [field]: value }));
    setClientErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleClientModeSelect = useCallback((mode: ClientCreationMode) => {
    setSelectedClient(null);
    setClientCreationMode(mode);
    setClientErrors({});
  }, []);

  const handleCompanyBookSuccess = useCallback((fields: Record<string, unknown>) => {
    let filledCount = 0;

    setSelectedClient(null);
    setClientDraft((prev) => {
      const next = { ...prev };

      for (const [key, value] of Object.entries(fields)) {
        if (value === undefined || value === "") continue;
        next[key as keyof InvoiceClientDraftInput] = value as never;
        filledCount++;
      }

      return next;
    });

    setClientErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(fields)) {
        delete next[key as keyof InvoiceClientDraftInput];
      }
      return next;
    });

    toast.success("Данните са заредени", {
      description: `${filledCount} полета бяха попълнени автоматично.`,
    });
  }, []);

  const { lookup: lookupCompany, isLoading: isLookupLoading } = useCompanyBookLookup({
    onSuccess: handleCompanyBookSuccess,
    onError: (message) => toast.error("Грешка при търсене", { description: message }),
  });

  const handleEikLookup = useCallback(async () => {
    const eik = clientDraft.bulstatNumber.replace(/\D/g, "");

    if (!eik || eik.length < 9) {
      const message = "Въведете поне 9 цифри в полето ЕИК.";
      setClientErrors((prev) => ({ ...prev, bulstatNumber: message }));
      toast.error("Невалиден ЕИК", { description: message });
      return;
    }

    await lookupCompany(eik);
  }, [clientDraft.bulstatNumber, lookupCompany]);

  const validateClientStep = useCallback(() => {
    if (selectedClient) {
      setClientErrors({});
      return true;
    }

    if (!clientCreationMode) {
      toast.error("Изберете как да въведете клиента");
      return false;
    }

    const nextErrors = validateInvoiceClientDraft(clientDraft);
    setClientErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Попълнете задължителните данни за клиента");
      return false;
    }

    return true;
  }, [clientCreationMode, clientDraft, selectedClient]);

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

  const createInlineClient = useCallback(async () => {
    const payload = parseInvoiceClientDraft(clientDraft);
    const response = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as {
        error?: string;
        details?: Array<{ path?: string[]; message?: string }>;
      } | null;

      const apiErrors = mapInvoiceClientApiErrors(errorPayload?.details);
      if (Object.keys(apiErrors).length > 0) {
        setClientErrors(apiErrors);
        setCurrentStep(0);
      }

      throw new Error(errorPayload?.error || "Неуспешно създаване на клиент");
    }

    const createdClient = await response.json();
    setSelectedClient(createdClient);
    return createdClient;
  }, [clientDraft]);

  const handleNextStep = useCallback(() => {
    if (currentStep === 0) {
      if (!validateClientStep()) return;
      setCurrentStep(1);
      return;
    }

    if (currentStep === 1 && !invoiceData.companyId) {
      toast.error("Моля, изберете фирма");
      return;
    }

    setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
  }, [currentStep, invoiceData.companyId, steps.length, validateClientStep]);

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      if (!validateClientStep()) {
        setCurrentStep(0);
        return;
      }

      const ensuredClient = selectedClient ?? await createInlineClient();
      
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
          clientId: ensuredClient.id,
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
          <div className="space-y-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-2 text-xl font-bold sm:text-2xl">Как искате да въведете клиента?</h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Изберете удобния за вас вариант. След това ще продължите със стандартните стъпки за фактурата.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <ClientCreationMethodCard
                title="Търси по ЕИК и автоматично попълни данните"
                description="Потърсете фирмата по ЕИК и редактирайте заредените данни при нужда."
                icon={<Search className="h-5 w-5" />}
                isSelected={clientCreationMode === "eik"}
                onSelect={() => handleClientModeSelect("eik")}
              />
              <ClientCreationMethodCard
                title="Ръчно попълване на данни"
                description="Въведете данните на българския клиент ръчно, включително ЕИК, адрес и ДДС статус."
                icon={<Edit className="h-5 w-5" />}
                isSelected={clientCreationMode === "manual"}
                onSelect={() => handleClientModeSelect("manual")}
              />
            </div>

            {selectedClient && !clientCreationMode && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Предварително избран клиент
                    </p>
                    <p className="pt-1 text-lg font-semibold">{selectedClient.name}</p>
                    <p className="pt-1 text-sm text-muted-foreground">
                      Може да продължите с него или да изберете един от двата варианта по-горе.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => {
                      setSelectedClient(null);
                      setClientCreationMode("manual");
                    }}
                  >
                    Нов клиент
                  </Button>
                </CardContent>
              </Card>
            )}

            {clientCreationMode && (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_340px]">
                <div className="space-y-5">
                  {clientCreationMode === "eik" && (
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="space-y-4 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Search className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold">Бързо зареждане по ЕИК</h3>
                            <p className="text-sm text-muted-foreground">
                              Въведете ЕИК и ще попълним наличните данни от Търговския регистър.
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <div className="space-y-2">
                            <Label htmlFor="invoice-client-eik">ЕИК</Label>
                            <Input
                              id="invoice-client-eik"
                              inputMode="numeric"
                              placeholder="напр. 204676177"
                              value={clientDraft.bulstatNumber}
                              onChange={(event) => updateClientDraft("bulstatNumber", event.target.value.replace(/\D/g, ""))}
                              aria-invalid={Boolean(clientErrors.bulstatNumber)}
                              aria-describedby={clientErrors.bulstatNumber ? "invoice-client-eik-error" : undefined}
                              className={clientErrors.bulstatNumber ? "border-destructive focus-visible:ring-destructive/20" : undefined}
                            />
                            {clientErrors.bulstatNumber ? (
                              <p id="invoice-client-eik-error" className="text-sm text-destructive">
                                {clientErrors.bulstatNumber}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Използвайте 9 до 13 цифри, без интервали.</p>
                            )}
                          </div>
                          <Button
                            type="button"
                            onClick={handleEikLookup}
                            disabled={isLookupLoading || clientDraft.bulstatNumber.replace(/\D/g, "").length < 9}
                            className="h-11 gap-2 self-end"
                          >
                            {isLookupLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                            Зареди данни
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-border/70">
                    <CardHeader className="pb-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle>Данни на клиента</CardTitle>
                          <CardDescription>
                            {clientCreationMode === "eik"
                              ? "Проверете заредените данни и допълнете липсващите полета."
                              : "Попълнете данните на клиента, които ще се използват и за създаване на запис в клиентите."}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="w-fit">
                          {clientCreationMode === "eik" ? "Автопопълване" : "Ръчно"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="invoice-client-name">Име на клиента</Label>
                            <Input
                              id="invoice-client-name"
                              value={clientDraft.name}
                              onChange={(event) => updateClientDraft("name", event.target.value)}
                              aria-invalid={Boolean(clientErrors.name)}
                              aria-describedby={clientErrors.name ? "invoice-client-name-error" : undefined}
                              className={clientErrors.name ? "border-destructive focus-visible:ring-destructive/20" : undefined}
                              placeholder="напр. Пример ООД"
                            />
                            {clientErrors.name ? (
                              <p id="invoice-client-name-error" className="text-sm text-destructive">
                                {clientErrors.name}
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="invoice-client-email">Имейл</Label>
                            <Input
                              id="invoice-client-email"
                              type="email"
                              value={clientDraft.email}
                              onChange={(event) => updateClientDraft("email", event.target.value)}
                              aria-invalid={Boolean(clientErrors.email)}
                              aria-describedby={clientErrors.email ? "invoice-client-email-error" : undefined}
                              className={clientErrors.email ? "border-destructive focus-visible:ring-destructive/20" : undefined}
                              placeholder="client@example.com"
                            />
                            {clientErrors.email ? (
                              <p id="invoice-client-email-error" className="text-sm text-destructive">
                                {clientErrors.email}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Незадължително, но удобно за изпращане.</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="invoice-client-phone">Телефон</Label>
                            <Input
                              id="invoice-client-phone"
                              inputMode="numeric"
                              value={clientDraft.phone}
                              onChange={(event) => updateClientDraft("phone", event.target.value.replace(/\D/g, ""))}
                              placeholder="0888123456"
                            />
                            <p className="text-xs text-muted-foreground">Само цифри.</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold">Адрес</h3>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="invoice-client-address">Адрес</Label>
                            <Input
                              id="invoice-client-address"
                              value={clientDraft.address}
                              onChange={(event) => updateClientDraft("address", event.target.value)}
                              aria-invalid={Boolean(clientErrors.address)}
                              aria-describedby={clientErrors.address ? "invoice-client-address-error" : undefined}
                              className={clientErrors.address ? "border-destructive focus-visible:ring-destructive/20" : undefined}
                              placeholder="ул. Пример 1"
                            />
                            {clientErrors.address ? (
                              <p id="invoice-client-address-error" className="text-sm text-destructive">
                                {clientErrors.address}
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="invoice-client-city">Град</Label>
                            <Input
                              id="invoice-client-city"
                              value={clientDraft.city}
                              onChange={(event) => updateClientDraft("city", event.target.value)}
                              aria-invalid={Boolean(clientErrors.city)}
                              aria-describedby={clientErrors.city ? "invoice-client-city-error" : undefined}
                              className={clientErrors.city ? "border-destructive focus-visible:ring-destructive/20" : undefined}
                              placeholder="София"
                            />
                            {clientErrors.city ? (
                              <p id="invoice-client-city-error" className="text-sm text-destructive">
                                {clientErrors.city}
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="invoice-client-state">Област</Label>
                            <Input
                              id="invoice-client-state"
                              value={clientDraft.state}
                              onChange={(event) => updateClientDraft("state", event.target.value)}
                              placeholder="София-град"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="invoice-client-zip">Пощенски код</Label>
                            <Input
                              id="invoice-client-zip"
                              inputMode="numeric"
                              value={clientDraft.zipCode}
                              onChange={(event) => updateClientDraft("zipCode", event.target.value.replace(/\D/g, ""))}
                              placeholder="1000"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="invoice-client-country">Държава</Label>
                            <Input
                              id="invoice-client-country"
                              value={clientDraft.country}
                              onChange={(event) => updateClientDraft("country", event.target.value)}
                              aria-invalid={Boolean(clientErrors.country)}
                              aria-describedby={clientErrors.country ? "invoice-client-country-error" : undefined}
                              className={clientErrors.country ? "border-destructive focus-visible:ring-destructive/20" : undefined}
                              placeholder="България"
                            />
                            {clientErrors.country ? (
                              <p id="invoice-client-country-error" className="text-sm text-destructive">
                                {clientErrors.country}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-semibold">Данъчни данни</h3>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="invoice-client-bulstat">БУЛСТАТ/ЕИК</Label>
                            <Input
                              id="invoice-client-bulstat"
                              inputMode="numeric"
                              value={clientDraft.bulstatNumber}
                              onChange={(event) => updateClientDraft("bulstatNumber", event.target.value.replace(/\D/g, ""))}
                              aria-invalid={Boolean(clientErrors.bulstatNumber)}
                              aria-describedby={clientErrors.bulstatNumber ? "invoice-client-bulstat-error" : undefined}
                              className={clientErrors.bulstatNumber ? "border-destructive focus-visible:ring-destructive/20" : undefined}
                              placeholder="123456789"
                            />
                            {clientErrors.bulstatNumber ? (
                              <p id="invoice-client-bulstat-error" className="text-sm text-destructive">
                                {clientErrors.bulstatNumber}
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Тип идентификатор</Label>
                            <Select
                              value={clientDraft.uicType}
                              onValueChange={(value) => updateClientDraft("uicType", value)}
                            >
                              <SelectTrigger aria-label="Тип идентификатор">
                                <SelectValue placeholder="Изберете тип" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BULSTAT">БУЛСТАТ</SelectItem>
                                <SelectItem value="EGN">ЕГН</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <div className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${clientDraft.vatRegistered ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
                              <Checkbox
                                id="invoice-client-vat-registered"
                                checked={clientDraft.vatRegistered}
                                onCheckedChange={(checked) => updateClientDraft("vatRegistered", checked === true)}
                                aria-describedby={clientErrors.vatRegistered ? "invoice-client-vat-registered-error" : undefined}
                              />
                              <div className="space-y-1">
                                <Label htmlFor="invoice-client-vat-registered" className="cursor-pointer">
                                  Регистрация по ЗДДС
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                  Отбележете, ако клиентът има валиден български ДДС номер.
                                </p>
                                {clientErrors.vatRegistered ? (
                                  <p id="invoice-client-vat-registered-error" className="text-sm text-destructive">
                                    {clientErrors.vatRegistered}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="invoice-client-vat-number">ДДС номер</Label>
                            <Input
                              id="invoice-client-vat-number"
                              value={clientDraft.vatRegistrationNumber}
                              onChange={(event) => updateClientDraft("vatRegistrationNumber", event.target.value.toUpperCase())}
                              aria-invalid={Boolean(clientErrors.vatRegistrationNumber)}
                              aria-describedby={clientErrors.vatRegistrationNumber ? "invoice-client-vat-number-error" : undefined}
                              className={clientErrors.vatRegistrationNumber ? "border-destructive focus-visible:ring-destructive/20" : undefined}
                              placeholder="BG123456789"
                            />
                            {clientErrors.vatRegistrationNumber ? (
                              <p id="invoice-client-vat-number-error" className="text-sm text-destructive">
                                {clientErrors.vatRegistrationNumber}
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="invoice-client-mol">МОЛ</Label>
                            <Input
                              id="invoice-client-mol"
                              value={clientDraft.mol}
                              onChange={(event) => updateClientDraft("mol", event.target.value)}
                              aria-invalid={Boolean(clientErrors.mol)}
                              aria-describedby={clientErrors.mol ? "invoice-client-mol-error" : undefined}
                              className={clientErrors.mol ? "border-destructive focus-visible:ring-destructive/20" : undefined}
                              placeholder="Име на представляващия"
                            />
                            {clientErrors.mol ? (
                              <p id="invoice-client-mol-error" className="text-sm text-destructive">
                                {clientErrors.mol}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Незадължително за клиент, но полезно за документа.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
                  <Card className="border-border/70">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <User className="h-4 w-4 text-primary" />
                        Преглед на клиента
                      </CardTitle>
                      <CardDescription>Тези данни ще се използват за фактурата и ще се запишат като клиент.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Име</p>
                        <p className="mt-1 font-semibold">{clientDraft.name || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">ЕИК</p>
                        <p className="mt-1 font-semibold">{clientDraft.bulstatNumber || "—"}</p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Адрес</p>
                        <p className="mt-1 text-sm font-medium">
                          {[clientDraft.address, clientDraft.city, clientDraft.country].filter(Boolean).join(", ") || "—"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">ДДС статус</p>
                        <p className="mt-1 text-sm font-medium">
                          {clientDraft.vatRegistered
                            ? clientDraft.vatRegistrationNumber || "Регистриран"
                            : "Няма регистрация"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-primary/15 bg-primary/5">
                    <CardContent className="space-y-3 p-4">
                      <p className="text-sm font-semibold">Какво става при създаване?</p>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Клиентът се създава автоматично през последната стъпка.</li>
                        <li>След това фактурата се изпраща със същия `clientId` към текущия API.</li>
                        <li>Артикулите, сумите и фирмата издател остават по текущия flow.</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        );

      // Step 1: Invoice Details
      case 1:
        return (
          <div className="space-y-5">
            <div className="mb-6 text-left">
              <h2 className="mb-1 text-xl font-bold sm:text-2xl">Детайли на фактурата</h2>
              <p className="text-muted-foreground text-sm">Настройте основните данни за фактурата</p>
            </div>

            <Card className="overflow-hidden border-primary/15 bg-linear-to-r from-primary/10 via-card to-card shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        Номер на фактура
                      </p>
                      <p className="truncate pt-1 font-mono text-xl font-semibold tracking-tight sm:text-2xl">
                        {invoiceData.invoiceNumber || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:justify-items-end">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center justify-center rounded-xl border border-border/70 bg-background px-3 py-2 text-sm font-semibold shadow-xs">
                        {invoiceData.currency}
                      </div>
                      <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        Автоматичен №
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                    {recipientPreview ? `За ${recipientPreview.name}` : "Изберете детайлите по документа"}
                    </p>
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
                {recipientPreview && (
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
                          {recipientPreview.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{recipientPreview.name}</p>
                          {recipientPreview.email && (
                            <p className="text-xs text-muted-foreground truncate">{recipientPreview.email}</p>
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
            <div className="mb-8 text-left">
              <h2 className="mb-1.5 text-xl font-bold sm:text-2xl">Добавете продукти</h2>
              <p className="text-muted-foreground">Изберете от каталога или добавете ръчно</p>
            </div>
            
            {/* Products catalog */}
            {products.length > 0 && (
              <Card className="border-border/70">
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
            <Card className="border-border/70">
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
              <CardContent className="space-y-4">
                {items.length > 0 && (
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Редове</p>
                      <p className="mt-1 text-sm font-semibold">{items.length}</p>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Подсума</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">
                        {formatPrice(totals.subtotal)} {invoiceData.currency}
                      </p>
                    </div>
                    <div className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Общо</p>
                      <p className="mt-1 text-sm font-bold text-primary tabular-nums">
                        {formatPrice(totals.total)} {invoiceData.currency}
                      </p>
                    </div>
                  </div>
                )}
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Няма добавени артикули</p>
                    <p className="text-sm mt-1">Изберете продукт от каталога или добавете ръчно</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
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
                        <p className="text-sm font-semibold sm:text-base">{recipientPreview?.name || "-"}</p>
                        {recipientPreview?.email && (
                          <p className="text-xs text-muted-foreground sm:text-sm">{recipientPreview.email}</p>
                        )}
                        {recipientPreview?.phone && (
                          <p className="text-xs text-muted-foreground sm:text-sm">{recipientPreview.phone}</p>
                        )}
                        {(recipientPreview?.city || recipientPreview?.country) && (
                          <p className="text-xs text-muted-foreground sm:text-sm">
                            {[recipientPreview?.city, recipientPreview?.country].filter(Boolean).join(", ")}
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
        <Card className="overflow-visible rounded-none border-x-0 border-border/60 bg-linear-to-br from-card/90 via-card to-card/95 shadow-none sm:overflow-hidden sm:rounded-2xl sm:border-x sm:shadow-xl sm:shadow-primary/5">
          <CardHeader className="border-b border-border/40 px-4 pb-4 pt-4 sm:px-6 sm:pb-5">
            <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                  {currentStepDetails.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Стъпка {currentStep + 1} от {steps.length}
                  </p>
                  <h2 className="pt-1 text-lg font-semibold sm:text-xl">{currentStepDetails.title}</h2>
                  <p className="pt-1 text-sm text-muted-foreground">
                    {currentStep === 0 && "Изберете как да въведете клиента и подгответе неговите данни."}
                    {currentStep === 1 && "Попълнете основните данни и фирмата издател."}
                    {currentStep === 2 && "Добавете редовете по фактурата и проверете сумите."}
                    {currentStep === 3 && "Прегледайте документа преди окончателното създаване."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-[320px]">
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Клиент</p>
                  <p className="mt-1 truncate text-sm font-semibold">
                    {recipientPreview?.name || "Не е избран"}
                  </p>
                  {clientMethodLabel ? (
                    <p className="mt-1 text-xs text-muted-foreground">{clientMethodLabel}</p>
                  ) : null}
                </div>
                <div className="rounded-xl border border-border/60 bg-background/80 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Артикули</p>
                  <p className="mt-1 text-sm font-semibold">{previewItems.length}</p>
                </div>
                <div className="col-span-2 rounded-xl border border-primary/15 bg-primary/5 p-3 sm:col-span-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Общо</p>
                  <p className="mt-1 text-sm font-bold text-primary tabular-nums">
                    {getCurrencySymbol(invoiceData.currency)} {formatPrice(totals.total)}
                  </p>
                </div>
              </div>
            </div>
            <StepIndicator currentStep={currentStep} steps={steps} />
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-5 sm:px-6 sm:pb-6">
            {renderStepContent()}
          </CardContent>
          <CardFooter className="sticky bottom-0 z-20 mt-4 border-t border-border/60 bg-background/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur supports-backdrop-filter:bg-background/85 sm:static sm:bg-transparent sm:px-6 sm:pb-6 sm:pt-5 sm:backdrop-blur-0">
            <div className="w-full space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-sm sm:hidden">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Стъпка {currentStep + 1} от {steps.length}
                  </p>
                  <p className="font-medium">{currentStepDetails.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Общо</p>
                  <p className="font-semibold tabular-nums">
                    {getCurrencySymbol(invoiceData.currency)} {formatPrice(totals.total)}
                  </p>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="h-11 w-full gap-2 justify-center sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>

              <div className="flex w-full justify-end sm:w-auto">
                {currentStep < 3 ? (
                  <Button
                    onClick={handleNextStep}
                    disabled={currentStep === 0 ? !selectedClient && !clientCreationMode : currentStep === 1 && !invoiceData.companyId}
                    className="h-11 w-full gap-2 justify-center sm:w-auto"
                  >
                    Напред
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : !isLoadingUsage && !canCreateInvoice && isFree ? (
                  <Link href="/settings/subscription" className="w-full sm:w-auto">
                    <Button
                      className="h-11 w-full gap-2 justify-center border-dashed border-amber-300 dark:border-amber-700 hover:border-amber-400"
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
                    className="h-11 w-full gap-2 justify-center bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 sm:w-auto"
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
