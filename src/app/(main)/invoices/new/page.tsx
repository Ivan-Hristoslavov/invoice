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
  X, 
  Search, 
  Check, 
  Edit, 
  User, 
  Calendar, 
  Building2, 
  FileText, 
  Package,
  Receipt,
  Sparkles,
  ShoppingCart,
  CreditCard,
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { DEFAULT_VAT_RATE } from "@/config/constants";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { UsageCounter, LimitBanner } from "@/components/ui/pro-feature-lock";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormDatePicker } from "@/components/ui/date-picker";
import { InvoiceWorkspaceSetup } from "@/components/invoice/InvoiceWorkspaceSetup";
import { FullPageLoader, LoadingSpinner } from "@/components/ui/loading-spinner";
import { createPortal } from "react-dom";

// Step indicator component
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: { title: string; icon: React.ReactNode }[] }) {
  return (
    <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex min-w-max items-center justify-center gap-2 px-1">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex flex-col items-center gap-2">
            <div className={`
              relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-10 sm:w-10
              ${index < currentStep
                ? 'bg-success border-success text-success-foreground'
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
            <p className={`hidden whitespace-nowrap text-center text-[11px] font-semibold sm:block ${index === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-0.5 w-6 transition-all duration-300 sm:w-12 md:w-16 ${index < currentStep ? 'bg-success' : 'bg-muted-foreground/20'}`} />
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
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-3.5 transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:bg-primary/3"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-all duration-200 group-hover:bg-primary">
          <Plus className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground transition-colors" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
            {product.name}
          </p>
          {product.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {product.description}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-bold tabular-nums">
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

function ExistingClientCard({
  client,
  onSelect,
}: {
  client: any;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <User className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold group-hover:text-primary">
          {client.name}
        </p>
        <div className="mt-1 space-y-1 text-xs text-muted-foreground">
          {client.email ? <p className="truncate">{client.email}</p> : null}
          {client.bulstatNumber ? <p>ЕИК: {client.bulstatNumber}</p> : null}
          {!client.email && !client.bulstatNumber && client.city ? (
            <p>{client.city}</p>
          ) : null}
        </div>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
    </button>
  );
}

function ClientsLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/10 px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
      <p className="mt-4 text-sm font-semibold">Зареждане на клиенти...</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Подготвяме списъка, за да можете веднага да изберете клиент.
      </p>
    </div>
  );
}

function StepAccordionTrigger({
  title,
  description,
  icon,
  stepIndex,
  currentStep,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  stepIndex: number;
  currentStep: number;
}) {
  const isCompleted = stepIndex < currentStep;
  const isActive = stepIndex === currentStep;

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl px-1 py-1 text-left">
      <div
        className={`
          flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all
          ${isCompleted
            ? "border-emerald-500 bg-emerald-500 text-white"
            : isActive
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-muted/30 text-muted-foreground"}
        `}
      >
        {isCompleted ? <Check className="h-4 w-4" /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-semibold">{title}</p>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {stepIndex + 1}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Invoice item card component using Radix UI style
function InvoiceItemCard({
  item,
  index,
  onEdit,
  onRemove,
  canRemove,
  currency
}: {
  item: any;
  index: number;
  onEdit: () => void;
  onRemove: () => void;
  canRemove: boolean;
  currency: string;
}) {
  const itemTotal = item.quantity * item.unitPrice;
  const itemTax = itemTotal * (item.taxRate / 100);
  const itemTotalWithTax = itemTotal + itemTax;
  
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-3.5 py-3 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
      {/* Index */}
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
        {index + 1}
      </span>
      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {item.description?.trim() || <span className="italic text-muted-foreground">Без описание</span>}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          {item.quantity} бр. × {formatPrice(item.unitPrice)} {currency} · ДДС {item.taxRate}%
        </p>
      </div>
      {/* Total */}
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-primary tabular-nums">
          {formatPrice(itemTotalWithTax)} {currency}
        </p>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          + {formatPrice(itemTax)} ДДС
        </p>
      </div>
      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={onEdit} type="button" aria-label="Редакция">
          <Edit className="h-3.5 w-3.5" />
        </Button>
        {canRemove && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive hover:bg-destructive/10" onClick={onRemove} type="button" aria-label="Изтрий">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function InvoiceItemEditorDialog({
  item,
  currency,
  mode,
  open,
  onOpenChange,
  onUpdate,
  onRemove,
  onDone,
  canRemove,
}: {
  item: any | null;
  currency: string;
  mode: "add" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (field: string, value: string | number) => void;
  onRemove: () => void;
  onDone?: (item: { description: string; quantity: number; unitPrice: number; taxRate: number; productId?: string }) => void;
  canRemove: boolean;
}) {
  if (!item) return null;

  const isAddMode = mode === "add";
  const itemTotal = item.quantity * item.unitPrice;
  const itemTax = itemTotal * (item.taxRate / 100);
  const itemTotalWithTax = itemTotal + itemTax;

  const panel = (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={isAddMode ? "Добавяне на артикул" : "Редакция на артикул"}
    >
      <div className="fixed inset-0 bg-black/50" aria-hidden onClick={() => onOpenChange(false)} />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4">
          <div className="space-y-1 min-w-0">
            <h2 className="text-base font-semibold leading-tight sm:text-lg">
              {isAddMode ? "Добавяне на артикул" : "Редакция на артикул"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isAddMode
                ? "Попълнете име, количество, цена и ДДС за новия артикул. Име и цена са задължителни."
                : "Променете описанието, количеството, цената и ДДС за този ред."}
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full" onClick={() => onOpenChange(false)} aria-label="Затвори">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">{isAddMode ? "Име" : "Описание"}</Label>
            <Input
              value={item.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              placeholder={isAddMode ? "Име на артикула..." : "Описание на артикула..."}
              className="h-11 border-border/60 bg-background/80 text-base font-medium focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold sm:text-sm">Количество</Label>
              <NumericInput
                allowDecimal={false}
                value={item.quantity}
                onChange={(e) => onUpdate("quantity", parseInt(e.target.value) || 1)}
                className="h-10 bg-background/80 text-center text-base font-semibold sm:h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold sm:text-sm">ДДС %</Label>
              <NumericInput
                value={item.taxRate}
                onChange={(e) => onUpdate("taxRate", parseFloat(e.target.value) || 0)}
                className="h-10 bg-background/80 text-center text-base font-semibold sm:h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold sm:text-sm">Цена</Label>
              <NumericInput
                value={item.unitPrice}
                onChange={(e) => onUpdate("unitPrice", parseFloat(e.target.value) || 0)}
                className="h-10 bg-background/80 text-center text-base font-semibold sm:h-11"
                placeholder={currency}
              />
            </div>
          </div>

          <Separator variant="secondary" />

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Подсума</p>
              <p className="mt-1 text-sm font-bold tabular-nums sm:mt-1.5 sm:text-base">
                {formatPrice(itemTotal)} {currency}
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">ДДС</p>
              <p className="mt-1 text-sm font-bold tabular-nums sm:mt-1.5 sm:text-base">
                {formatPrice(itemTax)} {currency}
              </p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary/8 p-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Общо</p>
              <p className="mt-1 text-sm font-extrabold text-primary tabular-nums sm:mt-1.5 sm:text-lg">
                {formatPrice(itemTotalWithTax)} {currency}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {canRemove ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 w-full border-destructive/30 px-3 text-sm font-semibold text-destructive hover:bg-destructive/10 sm:h-11 sm:w-auto"
              onClick={() => {
                onRemove();
                onOpenChange(false);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isAddMode ? "Премахни реда" : "Изтрий"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full px-3 text-sm font-semibold sm:h-11 sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Затвори
          </Button>
          <Button
            type="button"
            variant="default"
            className="h-10 w-full px-3 text-sm font-semibold sm:h-11 sm:w-auto"
            disabled={!item.description.trim() || Number(item.unitPrice) <= 0}
            onClick={() => {
              onDone?.(item);
              onOpenChange(false);
            }}
          >
            {isAddMode ? "Създай" : "Редактира"}
          </Button>
        </div>
      </div>
    </div>
  );

  if (!open) return null;
  return typeof document !== "undefined" ? createPortal(panel, document.body) : null;
}

function NewInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client");
  
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const isLoadingData = isLoadingCompanies || isLoadingClients || isLoadingProducts;
  
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
    productId?: string;
  }>>([]);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [itemEditorMode, setItemEditorMode] = useState<"add" | "edit">("edit");
  
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
  const stepDescriptions = [
    "Изберете съществуващ клиент или отворете раздел Клиенти за нов запис.",
    "Попълнете основните данни и фирмата издател.",
    "Добавете редовете по фактурата и проверете сумите.",
    "Прегледайте документа преди окончателното създаване.",
  ];

  const handleExistingClientSelect = useCallback((client: any) => {
    setSelectedClient(client);
    setCurrentStep(1);
  }, []);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingCompanies(true);
        setIsLoadingClients(true);
        setIsLoadingProducts(true);
        
        // Fetch required data in parallel
        const [companiesRes, productsRes, clientsRes] = await Promise.allSettled([
          fetch('/api/companies'),
          fetch('/api/products'),
          fetch('/api/clients')
        ]);
        
        // Process companies
        if (companiesRes.status === 'fulfilled' && companiesRes.value.ok) {
          const companiesData = await companiesRes.value.json();
          setCompanies(companiesData);
          if (companiesData.length > 0) {
            setInvoiceData(prev => ({ ...prev, companyId: companiesData[0].id }));
          }
        }
        setIsLoadingCompanies(false);
        
        // Process products
        if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
          const productsData = await productsRes.value.json();
          setProducts(productsData);
        }
        setIsLoadingProducts(false);

        if (clientsRes.status === "fulfilled" && clientsRes.value.ok) {
          const clientsData = await clientsRes.value.json();
          setClients(clientsData);

          if (!preselectedClientId) return;
          const foundClient = clientsData.find((client: any) => client.id === preselectedClientId);
          if (foundClient) {
            handleExistingClientSelect(foundClient);
          }
        }
        setIsLoadingClients(false);
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingCompanies(false);
        setIsLoadingClients(false);
        setIsLoadingProducts(false);
      }
    }
    
    fetchData();
  }, [handleExistingClientSelect, preselectedClientId]);

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

  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const query = clientSearchQuery.trim().toLowerCase();
    return clients.filter((client) =>
      client.name?.toLowerCase().includes(query) ||
      client.email?.toLowerCase().includes(query) ||
      client.city?.toLowerCase().includes(query) ||
      client.bulstatNumber?.toLowerCase().includes(query)
    );
  }, [clientSearchQuery, clients]);

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

  const canProceedFromProductsStep = useMemo(
    () =>
      items.some(
        (item) => item.description.trim() && Number(item.unitPrice) > 0
      ),
    [items]
  );

  const paymentMethodLabel = useMemo(() => {
    if (invoiceData.paymentMethod === "BANK_TRANSFER") return "Банков превод";
    if (invoiceData.paymentMethod === "CASH") return "В брой";
    if (invoiceData.paymentMethod === "CREDIT_CARD") return "Кредитна/дебитна карта";
    return "Друго";
  }, [invoiceData.paymentMethod]);

  const currentStepDetails = steps[currentStep];
  const recipientPreview = selectedClient;
  const clientMethodLabel = selectedClient ? "Избран клиент" : null;
  const showClientPickerOnly = currentStep === 0;

  const validateClientStep = useCallback(() => {
    if (selectedClient) {
      return true;
    }

    toast.error("Изберете клиент от списъка или създайте нов клиент от раздел Клиенти");
    return false;
  }, [selectedClient]);

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
    const nextId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems(prev => [...prev, {
      id: nextId,
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: DEFAULT_VAT_RATE
    }]);
    setItemEditorMode("add");
    setEditingItemId(nextId);
  }, [items]);

  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setEditingItemId((current) => (current === id ? null : current));
  }, []);

  const updateItem = useCallback((id: number, field: string, value: string | number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  const handleItemDone = useCallback((item: { description: string; quantity: number; unitPrice: number; taxRate: number; productId?: string }) => {
    if (item.productId || !item.description.trim()) return;
    toast("Запазване в каталог?", {
      description: `"${item.description.trim()}" може да се запази за бъдеща употреба`,
      action: {
        label: "Добави",
        onClick: async () => {
          try {
            const res = await fetch("/api/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: item.description.trim(),
                price: Number(item.unitPrice),
                unit: "бр.",
                taxRate: Number(item.taxRate) || 20,
              }),
            });
            if (!res.ok) {
              const err = await res.json();
              toast.error(err.error || "Неуспешно създаване на продукт");
              return;
            }
            const product = await res.json();
            if (editingItemId != null && product?.id) {
              updateItem(editingItemId, "productId", product.id);
            }
            setProducts((prev) => [...prev, product]);
            toast.success("Продуктът е добавен в каталога");
          } catch (e: any) {
            toast.error(e.message || "Грешка при създаване на продукт");
          }
        },
      },
      cancel: { label: "Пропусни" },
      duration: 7000,
    });
  }, [editingItemId, updateItem]);

  const addProduct = useCallback((product: any) => {
    const newItem = {
      id: Math.max(0, ...items.map(i => i.id)) + 1,
      description: product.name,
      quantity: 1,
      unitPrice: Number(product.price),
      taxRate: Number(product.taxRate) || DEFAULT_VAT_RATE,
      productId: product.id
    };
    setItems(prev => [...prev, newItem]);
    toast.success(`"${product.name}" добавен`, {
      description: `${formatPrice(Number(product.price))} ${invoiceData.currency}`
    });
  }, [items, invoiceData.currency]);

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingItemId) ?? null,
    [editingItemId, items]
  );

  const handleItemEditorOpenChange = useCallback((open: boolean) => {
    if (open) return;

    if (
      itemEditorMode === "add" &&
      editingItem &&
      !editingItem.description.trim() &&
      Number(editingItem.unitPrice) === 0
    ) {
      removeItem(editingItem.id);
    }

    setEditingItemId(null);
    setItemEditorMode("edit");
  }, [editingItem, itemEditorMode, removeItem]);

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

    if (currentStep === 2 && !canProceedFromProductsStep) {
      toast.error("Добавете поне един артикул с име и цена (различна от 0,00) преди да продължите.");
      return;
    }

    setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
  }, [currentStep, invoiceData.companyId, steps.length, validateClientStep, canProceedFromProductsStep]);

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      if (!validateClientStep()) {
        setCurrentStep(0);
        return;
      }

      const ensuredClient = selectedClient;
      if (!ensuredClient) {
        setCurrentStep(0);
        return;
      }
      
      if (!invoiceData.companyId) {
        toast.error("Моля, изберете фирма");
        setCurrentStep(1);
        return;
      }
      
      const validItems = items.filter(
        (item) => item.description.trim() && Number(item.unitPrice) > 0
      );
      if (validItems.length === 0) {
        const hasItemsWithoutPrice = items.some(
          (i) => i.description.trim() && Number(i.unitPrice) <= 0
        );
        toast.error(
          hasItemsWithoutPrice
            ? "Всеки артикул трябва да има име и положителна цена."
            : "Добавете поне един артикул с име и цена."
        );
        setCurrentStep(2);
        return;
      }
      if (validItems.length < items.length) {
        toast.error("Всеки артикул трябва да има име и положителна цена. Премахнете или попълнете редовете без цена.");
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
          ? "С план Про създавате неограничено и изпращате по имейл."
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
  const renderStepContent = (stepIndex: number) => {
    switch (stepIndex) {
      // Step 0: Client Selection
      case 0:
        return (
          <div className="space-y-6">
            <Card className="overflow-hidden border-primary/25">
              <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>Вашите клиенти</CardTitle>
                        {isLoadingClients ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Зареждане
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                            {clients.length} клиента
                          </span>
                        )}
                      </div>
                      <CardDescription className="mt-1.5">
                        Изберете съществуващ клиент и веднага ще продължите към следващата стъпка.
                      </CardDescription>
                    </div>
                    <div className="relative w-full lg:w-80">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Търсене на клиент..."
                        className="h-11 pl-11 font-medium"
                        value={clientSearchQuery}
                        disabled={isLoadingClients}
                        onChange={(event) => setClientSearchQuery(event.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
              </div>
              <CardContent className="p-4 sm:p-6">
                {isLoadingClients ? (
                  <ClientsLoadingState />
                ) : filteredClients.length === 0 && clients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center">
                    <p className="text-sm font-semibold">Все още нямате запазени клиенти</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Може да продължите с нов клиент от опциите по-долу.
                    </p>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                    Няма клиент, който да отговаря на търсенето.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {filteredClients.map((client) => (
                      <ExistingClientCard
                        key={client.id}
                        client={client}
                        onSelect={() => handleExistingClientSelect(client)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                или нов клиент
              </span>
              <Separator className="flex-1" />
            </div>

            <Card className="border-primary/15 bg-linear-to-br from-primary/5 via-card to-card">
              <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">Нов клиент?</p>
                  <p className="text-xs text-muted-foreground">Отворете раздел `Клиенти`, създайте запис и се върнете тук.</p>
                </div>
                <Button asChild size="sm" className="shrink-0 gap-1.5 px-4">
                  <Link href="/clients/new?returnTo=/invoices/new">
                    Нов клиент
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {selectedClient && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Избран клиент
                    </p>
                    <p className="pt-1 text-lg font-semibold">{selectedClient.name}</p>
                    <p className="pt-1 text-sm text-muted-foreground">
                      Може да продължите с него или да изберете друг клиент от списъка по-горе.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 self-center sm:self-auto"
                    onClick={() => {
                      setSelectedClient(null);
                    }}
                  >
                    Изчисти избора
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        );

      // Step 1: Invoice Details
      case 1:
        return (
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-primary" />
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Номер на фактура
                    </p>
                  </div>
                  <p className="truncate pt-2 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
                    {invoiceData.invoiceNumber || "—"}
                  </p>
                  <p className="pt-2 text-sm text-muted-foreground">
                    {recipientPreview ? `За ${recipientPreview.name}` : "Изберете детайлите по документа"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <div className="inline-flex items-center justify-center rounded-xl border border-border/70 bg-background px-3 py-2 text-sm font-semibold">
                    {invoiceData.currency}
                  </div>
                  <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Автоматичен №
                  </div>
                </div>
              </div>
              <Separator variant="secondary" />
            </div>

            {/* Flat sections with separators, 2-col on desktop */}
            <div className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:divide-x lg:divide-border">
              {/* Left: Dates + Payment */}
              <div className="lg:pr-7">
                <div className="space-y-4 pb-5">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Дати на фактурата</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                </div>

                <Separator />

                <div className="space-y-4 pt-5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-semibold">Плащане</p>
                  </div>
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
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Mobile separator between columns */}
              <Separator className="my-5 lg:hidden" />

              {/* Right: Client + Company + Currency */}
              <div className="lg:pl-7">
                {recipientPreview ? (
                  <>
                    <div className="space-y-3 pb-5">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold">Клиент</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {recipientPreview.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{recipientPreview.name}</p>
                          {recipientPreview.email ? (
                            <p className="truncate text-sm text-muted-foreground">{recipientPreview.email}</p>
                          ) : null}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(0)} className="h-8 px-2">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4 pt-5">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold">Фирма и валута</p>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
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
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold">Фирма и валута</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // Step 2: Products
      case 2:
        return (
          <div className="space-y-5">
            {/* Catalog section */}
            {products.length > 0 && (
              <>
                <div className="pb-1">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold">Каталог с продукти</p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">Кликнете върху продукт, за да го добавите.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                      <Input
                        type="search"
                        placeholder="Търсене..."
                        className="pl-12 pr-3 font-medium"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
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
                </div>
                <Separator />
              </>
            )}

            {/* Items section */}
            <div className={products.length > 0 ? "pt-1" : ""}>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  <div>
                    <p className="text-sm font-semibold">Артикули</p>
                    <p className="text-xs text-muted-foreground">{items.length} артикул(а)</p>
                  </div>
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

              {items.length > 0 && (
                <div className="mb-4 grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Редове</p>
                    <p className="mt-1 text-sm font-semibold">{items.length}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Подсума</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {formatPrice(totals.subtotal)} {invoiceData.currency}
                    </p>
                  </div>
                  <div className="rounded-xl border border-primary/25 bg-primary/5 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Общо</p>
                    <p className="mt-1 text-sm font-bold text-primary tabular-nums">
                      {formatPrice(totals.total)} {invoiceData.currency}
                    </p>
                  </div>
                </div>
              )}

              {items.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Няма добавени артикули</p>
                  <p className="mt-1 text-sm">Изберете продукт от каталога или добавете ръчно</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {items.map((item, index) => (
                    <InvoiceItemCard
                      key={item.id}
                      item={item}
                      index={index}
                      onEdit={() => {
                        setItemEditorMode("edit");
                        setEditingItemId(item.id);
                      }}
                      onRemove={() => removeItem(item.id)}
                      canRemove={true}
                      currency={invoiceData.currency}
                    />
                  ))}
                </div>
              )}
            </div>

            <InvoiceItemEditorDialog
              item={editingItem}
              currency={invoiceData.currency}
              mode={itemEditorMode}
              open={editingItemId !== null}
              onOpenChange={handleItemEditorOpenChange}
              onUpdate={(field, value) => {
                if (!editingItem) return;
                updateItem(editingItem.id, field, value);
              }}
              onRemove={() => {
                if (!editingItem) return;
                removeItem(editingItem.id);
              }}
              onDone={handleItemDone}
              canRemove={items.length > 0}
            />
          </div>
        );

      // Step 3: Review
      case 3:
        return (
          <div className="space-y-5">
            <div className="grid box-content gap-4 xl:grid-cols-[minmax(0,1.8fr)_320px]">
              <Card className="box-content solid-card overflow-hidden border border-border bg-card shadow-sm">
                <div className="border-b border-border bg-muted/15 px-4 py-3.5 sm:px-5 sm:py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        №
                      </span>
                      <p className="min-w-0 truncate font-mono text-base font-bold tracking-tight">
                        {invoiceData.invoiceNumber}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary" className="px-2.5 py-1 text-xs">
                        {invoiceData.currency}
                      </Badge>
                      <Badge variant="outline" className="px-2.5 py-1 text-xs">
                        {previewItems.length} {previewItems.length === 1 ? "артикул" : "артикула"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <CardContent className="space-y-4 p-4 sm:p-5">
                  <div className="grid gap-4 md:grid-cols-2 md:gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">От</p>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p className="font-semibold sm:text-base">{selectedCompany?.name || "-"}</p>
                        {selectedCompany?.email && (
                          <p className="text-muted-foreground">{selectedCompany.email}</p>
                        )}
                        {selectedCompany?.address && (
                          <p className="text-muted-foreground">{selectedCompany.address}</p>
                        )}
                        {selectedCompany?.city && (
                          <p className="text-muted-foreground">{selectedCompany.city}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">До</p>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p className="font-semibold sm:text-base">{recipientPreview?.name || "-"}</p>
                        {recipientPreview?.email && (
                          <p className="text-muted-foreground">{recipientPreview.email}</p>
                        )}
                        {recipientPreview?.phone && (
                          <p className="text-muted-foreground">{recipientPreview.phone}</p>
                        )}
                        {(recipientPreview?.city || recipientPreview?.country) && (
                          <p className="text-muted-foreground">
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

                    <div className="divide-y divide-border/50">
                      {previewItems.map((item, index) => {
                        const itemTotal = item.quantity * item.unitPrice;
                        const itemTotalWithVat = itemTotal + itemTotal * (item.taxRate / 100);

                        return (
                          <div key={item.id} className="flex items-center gap-3 py-3 first:pt-1">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{item.description}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                                {item.quantity} бр. × {formatPrice(item.unitPrice)} {invoiceData.currency} · ДДС {item.taxRate}%
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-bold text-primary tabular-nums">
                                {formatPrice(itemTotalWithVat)} {invoiceData.currency}
                              </p>
                              <p className="text-[10px] text-muted-foreground tabular-nums">
                                без ДДС {formatPrice(itemTotal)} {invoiceData.currency}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <Receipt className="h-4 w-4 text-primary" />
                      <span>Обобщение</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Най-важното за документа на едно място.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/30">
                    <div className="divide-y divide-border/50">
                      <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Дата на издаване</span>
                        <span className="text-right font-semibold">{formatLongDate(invoiceData.issueDate)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Краен срок</span>
                        <span className="text-right font-semibold">{formatLongDate(invoiceData.dueDate)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Начин на плащане</span>
                        <span className="text-right font-semibold">{paymentMethodLabel}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Място на издаване</span>
                        <span className="text-right font-semibold">{invoiceData.placeOfIssue || "-"}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Дата на доставка</span>
                        <span className="text-right font-semibold">{formatLongDate(invoiceData.supplyDate)}</span>
                      </div>
                      <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                        <span className="text-muted-foreground">Тип</span>
                        <span className="text-right font-semibold">{invoiceData.isOriginal ? "Оригинал" : "Копие"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3.5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Подсума</span>
                        <span className="font-semibold tabular-nums">
                          {formatPrice(totals.subtotal)} {invoiceData.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">ДДС</span>
                        <span className="font-semibold tabular-nums">
                          {formatPrice(totals.tax)} {invoiceData.currency}
                        </span>
                      </div>
                    </div>
                    <Separator className="my-3 bg-primary/15" />
                    <div className="flex items-end justify-between gap-3">
                      <span className="text-sm font-semibold uppercase tracking-wide text-foreground/90">
                        Общо
                      </span>
                      <span className="text-xl font-bold text-primary tabular-nums sm:text-2xl">
                        {getCurrencySymbol(invoiceData.currency)} {formatPrice(totals.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Block invoice creation until at least one company and one client exist
  if (!isLoadingCompanies && !isLoadingClients && (companies.length === 0 || clients.length === 0)) {
    return (
      <div className="min-h-screen">
        <div className="mb-4">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        <InvoiceWorkspaceSetup
          hasCompanies={companies.length > 0}
          hasClients={clients.length > 0}
          title="Подгответе акаунта си за първата фактура"
          description="Преди да създадете първата фактура, добавете компанията издател и поне един клиент. След това ще видите пълния flow за фактуриране."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Subscription limit warning */}
      {isFree && !isLoadingUsage && !canCreateInvoice && (
        <LimitBanner
          variant="error"
          message={<>Издадохте <strong>3 фактури</strong> този месец — лимитът на безплатния план. С Про без ограничения.</>}
          linkText="Отключете неограничени →"
          className="mb-4"
        />
      )}

      {isFree && !isLoadingUsage && canCreateInvoice && invoiceUsage.remaining === 1 && (
        <LimitBanner
          variant="warning"
          message={<>Остава ви <strong>1 фактура</strong> този месец. С Про не спирате и изпращате по имейл.</>}
          className="mb-4"
        />
      )}

      <div className="mx-auto w-full max-w-[1440px]">
        {/* Header */}
        <div className="mb-4 sm:mb-5">
          <div className="relative flex min-h-10 items-center justify-center sm:min-h-11">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="back-btn absolute left-0 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full sm:h-9 sm:w-9"
            >
              <Link href="/invoices">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex min-w-0 flex-col items-center px-10 text-center sm:px-12">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <h1 className="page-title leading-none">Нова фактура</h1>
                {isFree && !isLoadingUsage && (
                  <UsageCounter 
                    used={invoiceUsage.used} 
                    limit={invoiceUsage.limit === Infinity ? 0 : invoiceUsage.limit}
                    label="този месец"
                  />
                )}
              </div>
              <p className="card-description mt-2 hidden sm:block">
                Създайте нова фактура за вашите клиенти
              </p>
            </div>
          </div>
        </div>

        {showClientPickerOnly ? (
          <div className="space-y-4 sm:space-y-5">
            {renderStepContent(0)}
          </div>
        ) : (
        /* Wizard shell */
        <Card className="overflow-visible rounded-none border-x-0 border-border bg-linear-to-br from-card/90 via-card to-card/95 shadow-none sm:rounded-2xl sm:border-x sm:shadow-xl sm:shadow-primary/5">
          <CardHeader className="border-b border-border/40 bg-card/85 px-3 pb-2.5 pt-3 sm:px-5 sm:pb-3.5 sm:pt-4">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Стъпка {currentStep + 1} от {steps.length}
                </p>
                <div className="mt-2 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary sm:h-10 sm:w-10">
                  {currentStepDetails.icon}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold sm:text-base">{currentStepDetails.title}</h2>
                    <p className="pt-1 text-xs text-muted-foreground sm:text-sm">
                      {stepDescriptions[currentStep]}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-semibold">
                  <span className="text-muted-foreground">Клиент</span>
                  <span className="max-w-[140px] truncate text-foreground">{recipientPreview?.name || "Не е избран"}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/80 px-3 py-1.5 text-xs font-semibold">
                  <span className="text-muted-foreground">Артикули</span>
                  <span className="text-foreground">{previewItems.length}</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
                  <span>Общо</span>
                  <span className="tabular-nums">{getCurrencySymbol(invoiceData.currency)} {formatPrice(totals.total)}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <div className="sticky top-[calc(env(safe-area-inset-top)+3.25rem)] z-30 border-b border-border/40 bg-card/95 px-3 py-2.5 backdrop-blur supports-backdrop-filter:bg-card/85 sm:top-[calc(env(safe-area-inset-top)+4rem)] sm:px-5 sm:py-3">
            <StepIndicator currentStep={currentStep} steps={steps} />
          </div>
          <CardContent className="px-3 pb-3 pt-3 sm:px-5 sm:pb-5 sm:pt-4">
            <div className="space-y-3 sm:space-y-4">
              {steps.map((step, index) => {
                const isOpen = index === currentStep;
                const isUnlocked = index <= currentStep;

                return (
                  <section
                    key={step.title}
                    className="overflow-hidden rounded-2xl border border-border bg-background/40 shadow-sm"
                  >
                    <button
                      type="button"
                      className="w-full px-4 py-4 text-left transition-colors hover:bg-muted/20 sm:px-5"
                      onClick={() => {
                        if (isUnlocked) setCurrentStep(index);
                      }}
                      disabled={!isUnlocked}
                      aria-expanded={isOpen}
                    >
                      <StepAccordionTrigger
                        title={step.title}
                        description={stepDescriptions[index]}
                        icon={step.icon}
                        stepIndex={index}
                        currentStep={currentStep}
                      />
                    </button>
                    {isOpen ? (
                      <div className="border-t border-border/50 px-4 py-5 sm:px-5">
                        {renderStepContent(index)}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </CardContent>
          <div className="px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-6 sm:pb-6">
            <Separator className="mb-4" />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="hidden text-sm text-muted-foreground sm:block">
                <span className="font-semibold text-foreground">{currentStepDetails.title}</span>
                <span className="mx-2">•</span>
                <span className="tabular-nums">{getCurrencySymbol(invoiceData.currency)} {formatPrice(totals.total)}</span>
                {clientMethodLabel ? (
                  <>
                    <span className="mx-2">•</span>
                    <span>{clientMethodLabel}</span>
                  </>
                ) : null}
              </div>

              <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:flex sm:items-center">
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
                    disabled={
                      currentStep === 0
                        ? !selectedClient
                        : currentStep === 1
                          ? !invoiceData.companyId
                          : currentStep === 2
                            ? !canProceedFromProductsStep
                            : false
                    }
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
                        <LoadingSpinner size="small" className="text-white" />
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
          </div>
        </Card>
        )}
      </div>
    </div>
  );
}

// Loading fallback component
function NewInvoiceLoading() {
  return (
    <FullPageLoader
      title="Нова фактура"
      subtitle="Подготвяме клиента, фирмата и настройките за новия документ..."
    />
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<NewInvoiceLoading />}>
      <NewInvoiceContent />
    </Suspense>
  );
}
