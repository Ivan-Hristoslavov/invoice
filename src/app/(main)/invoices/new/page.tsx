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
  AlertTriangle
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

// Step indicator component
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: { title: string; icon: React.ReactNode }[] }) {
  return (
    <div className="flex items-center justify-center mb-8 gap-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-2">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 relative
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
            <p className={`text-xs font-medium whitespace-nowrap text-center ${index === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 sm:w-12 md:w-16 h-0.5 transition-all duration-300 ${index < currentStep ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`} />
          )}
        </div>
      ))}
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
      className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/50 p-5 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
              {product.name}
            </h4>
            {product.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:scale-110 flex items-center justify-center transition-all duration-300">
              <Plus className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
          </div>
        </div>
        
        {/* Price and tax */}
        <div className="flex items-end justify-between mt-4 pt-3 border-t border-border/50">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {formatPrice(Number(product.price))}
              <span className="text-sm font-normal text-muted-foreground ml-1">{currency}</span>
            </p>
          </div>
          {product.taxRate && (
            <Badge variant="secondary" className="text-xs">
              ДДС {Number(product.taxRate)}%
            </Badge>
          )}
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
    <div className="group relative bg-gradient-to-br from-card to-card/80 rounded-xl border border-border/60 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200">
      {/* Header with number and delete */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-xs font-bold text-primary-foreground shadow-sm">
            {index + 1}
          </div>
          <span className="text-xs font-medium text-muted-foreground">Артикул</span>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-40 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all rounded-lg"
            onClick={onRemove}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      
      {/* Content: description first, then quantity/price/vat in fixed order */}
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">Описание</label>
          <Input
            value={item.description}
            onChange={(e) => onUpdate("description", e.target.value)}
            placeholder="Описание на артикула..."
            className="h-10 text-sm font-medium border-border/60 focus:border-primary w-full"
          />
        </div>
        <div className="border-t border-border/50 pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">Количество и цена</p>
          <div className="grid grid-cols-1 min-[375px]:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">К-во</label>
              <NumericInput
                allowDecimal={false}
                value={item.quantity}
                onChange={(e) => onUpdate("quantity", parseInt(e.target.value) || 1)}
                className="h-9 sm:h-8 text-sm text-center font-medium w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Цена</label>
              <NumericInput
                value={item.unitPrice}
                onChange={(e) => onUpdate("unitPrice", parseFloat(e.target.value) || 0)}
                className="h-9 sm:h-8 text-sm font-medium w-full"
                placeholder={currency}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">ДДС %</label>
              <NumericInput
                value={item.taxRate}
                onChange={(e) => onUpdate("taxRate", parseFloat(e.target.value) || 0)}
                className="h-9 sm:h-8 text-sm text-center font-medium w-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer with total */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40 bg-gradient-to-r from-primary/5 to-primary/10 rounded-b-xl">
        <span className="text-xs text-muted-foreground">Общо с ДДС</span>
        <span className="text-base font-bold text-primary">
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
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Изберете клиент</h2>
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
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Детайли на фактурата</h2>
              <p className="text-muted-foreground">Настройте основните данни за фактурата</p>
            </div>
            
            {/* Selected client summary */}
            {selectedClient && (
              <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                      {selectedClient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{selectedClient.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{selectedClient.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(0)} className="flex-shrink-0">
                      <Edit className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Промяна</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Invoice number */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Hash className="h-4 w-4 flex-shrink-0" />
                <span>Номер на фактура</span>
              </Label>
              <Card className="solid-card bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm opacity-90 mb-1.5">Фактура №</p>
                      <p className="text-xl sm:text-2xl md:text-3xl font-bold font-mono truncate">{invoiceData.invoiceNumber || '—'}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <Badge variant="secondary" className="bg-white/20 text-white border-0 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 whitespace-nowrap">
                        {invoiceData.currency}
                      </Badge>
                      <Badge variant="secondary" className="bg-white/10 text-white/90 border-0 text-xs px-2 py-1 whitespace-nowrap">
                        Автоматичен
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Company and Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Building2 className="h-4 w-4 flex-shrink-0" />
                  <span>Вашата фирма</span>
                </Label>
                <Select
                  value={invoiceData.companyId}
                  onValueChange={(value) => handleInputChange('companyId', value)}
                >
                  <SelectTrigger className="h-12 w-full">
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
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="h-4 w-4 flex-shrink-0" />
                  <span>Валута</span>
                </Label>
                <Select
                  value={invoiceData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger className="h-12 w-full">
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
            
            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Дата на издаване</span>
                </Label>
                <Input
                  type="date"
                  value={invoiceData.issueDate}
                  onChange={(e) => handleInputChange('issueDate', e.target.value)}
                  className="h-12 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span>Краен срок за плащане</span>
                </Label>
                <Input
                  type="date"
                  value={invoiceData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="h-12 w-full"
                />
              </div>
            </div>
            
            {/* Supply date and place of issue */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Дата на данъчното събитие</span>
                </Label>
                <Input
                  type="date"
                  value={invoiceData.supplyDate}
                  onChange={(e) => handleInputChange('supplyDate', e.target.value)}
                  className="h-12 w-full"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>Място на издаване</span>
                </Label>
                <Input
                  value={invoiceData.placeOfIssue}
                  onChange={(e) => handleInputChange('placeOfIssue', e.target.value)}
                  placeholder="напр. София"
                  className="h-12 w-full"
                />
              </div>
            </div>

            {/* Payment method */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <CreditCard className="h-4 w-4 flex-shrink-0" />
                <span>Начин на плащане</span>
              </Label>
              <Select
                value={invoiceData.paymentMethod}
                onValueChange={(value) => handleInputChange('paymentMethod', value)}
              >
                <SelectTrigger className="h-12 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Банков превод</SelectItem>
                  <SelectItem value="CASH">В брой</SelectItem>
                  <SelectItem value="CREDIT_CARD">Кредитна/дебитна карта</SelectItem>
                  <SelectItem value="OTHER">Друго</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      // Step 2: Products
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Добавете продукти</h2>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
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
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Преглед на фактурата</h2>
              <p className="text-muted-foreground">Проверете данните преди създаване</p>
            </div>
            
            {/* Invoice preview */}
            <Card className="solid-card overflow-hidden border-2 bg-white dark:bg-slate-900">
              {/* Header */}
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Фактура №</p>
                    <p className="text-3xl font-bold font-mono">{invoiceData.invoiceNumber}</p>
                  </div>
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    {invoiceData.currency}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6 lg:p-8">
                <div className="space-y-8">
                  {/* Client & Company */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">От</p>
                      </div>
                      <p className="text-lg font-semibold">{companies.find(c => c.id === invoiceData.companyId)?.name || '-'}</p>
                      {companies.find(c => c.id === invoiceData.companyId)?.email && (
                        <p className="text-sm text-muted-foreground">{companies.find(c => c.id === invoiceData.companyId)?.email}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">До</p>
                      </div>
                      <p className="text-lg font-semibold">{selectedClient?.name || '-'}</p>
                      {selectedClient?.email && (
                        <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
                      )}
                      {selectedClient?.phone && (
                        <p className="text-sm text-muted-foreground">{selectedClient.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Dates & Payment */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Дата на издаване</p>
                      </div>
                      <p className="text-base font-semibold">{new Date(invoiceData.issueDate).toLocaleDateString('bg-BG', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Краен срок</p>
                      </div>
                      <p className="text-base font-semibold">{new Date(invoiceData.dueDate).toLocaleDateString('bg-BG', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Начин на плащане</p>
                      </div>
                      <p className="text-base font-semibold">
                        {invoiceData.paymentMethod === 'BANK_TRANSFER' ? 'Банков превод' :
                         invoiceData.paymentMethod === 'CASH' ? 'В брой' :
                         invoiceData.paymentMethod === 'CREDIT_CARD' ? 'Кредитна/дебитна карта' : 'Друго'}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Items Table */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Артикули</p>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted/50 px-4 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b">
                        <div className="col-span-1 text-center">№</div>
                        <div className="col-span-6">Описание</div>
                        <div className="col-span-2 text-right">Количество</div>
                        <div className="col-span-3 text-right">Общо</div>
                      </div>
                      <div className="divide-y">
                        {items.filter(i => i.description).map((item, index) => {
                          // Line item total = quantity × unit price (without VAT)
                          const itemTotal = item.quantity * item.unitPrice;
                          return (
                            <div key={item.id} className="px-4 py-4 grid grid-cols-12 gap-4 hover:bg-muted/30 transition-colors">
                              <div className="col-span-1 text-center text-sm font-medium text-muted-foreground">
                                {index + 1}
                              </div>
                              <div className="col-span-6">
                                <p className="font-semibold mb-1">{item.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatPrice(item.unitPrice)} {invoiceData.currency} × {item.quantity} (ДДС {item.taxRate}%)
                                </p>
                              </div>
                              <div className="col-span-2 text-right text-sm font-medium">
                                {item.quantity}
                              </div>
                              <div className="col-span-3 text-right">
                                <p className="font-semibold">
                                  {formatPrice(itemTotal)} {invoiceData.currency}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Totals */}
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-6 space-y-3 border">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">Подсума</span>
                      <span className="font-semibold">{formatPrice(totals.subtotal)} {invoiceData.currency}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-medium">ДДС</span>
                      <span className="font-semibold">{formatPrice(totals.tax)} {invoiceData.currency}</span>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-bold">Общо</span>
                      <span className="text-2xl font-bold text-primary">
                        {getCurrencySymbol(invoiceData.currency)} {formatPrice(totals.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle>Нужна е поне една компания</CardTitle>
                <CardDescription className="mt-1">
                  За да създавате фактури, първо трябва да добавите вашата фирма (компания). След това ще можете да продължите.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardFooter>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/companies/new">
                <Building2 className="mr-2 h-4 w-4" />
                Създай компания
              </Link>
            </Button>
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
              <Button size="sm" className="ml-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
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

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
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
        <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card/80 via-card to-card/90 shadow-xl shadow-primary/5">
          <CardHeader className="pb-4 border-b border-border/40">
            <StepIndicator currentStep={currentStep} steps={steps} />
          </CardHeader>
          <CardContent className="pt-6">
            {renderStepContent()}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-border/40 mt-4">
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
            </div>
            
            <div className="flex justify-end gap-3 w-full sm:w-auto">
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
                    <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                      PRO
                    </span>
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
