"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, MoreVertical, Eye, FileCheck, Printer, Download, Search, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportInvoiceAsPdf, printInvoicePdf } from "@/lib/invoice-export";

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
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Input, NumericInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormDatePicker } from "@/components/ui/date-picker";
import { Loading } from "@/components/ui/loading";
import { toast } from "sonner";

interface EditInvoiceFormProps {
  invoiceId: string;
}

export default function EditInvoiceForm({ invoiceId }: EditInvoiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    issueDate: "",
    dueDate: "",
    supplyDate: "",
    companyId: "",
    currency: "EUR",
    placeOfIssue: "София",
    paymentMethod: "BANK_TRANSFER",
    isEInvoice: false,
    isOriginal: true,
    notes: "",
    termsAndConditions: "",
    status: ""
  });
  
  const [items, setItems] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Invoice item card component
  const InvoiceItemCard = ({
    item,
    index,
    onDescriptionChange,
    onQuantityChange,
    onPriceChange,
    onTaxChange,
    onRemove,
    canRemove,
    productName
  }: {
    item: any;
    index: number;
    onDescriptionChange: (value: string) => void;
    onQuantityChange: (value: string) => void;
    onPriceChange: (value: string) => void;
    onTaxChange: (value: string) => void;
    onRemove: () => void;
    canRemove: boolean;
    productName?: string;
  }) => {
    const itemTotal = parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0);
    const itemTax = itemTotal * (parseFloat(item.taxRate || 0) / 100);
    const itemTotalWithTax = itemTotal + itemTax;

    return (
      <div className="group rounded-2xl border border-border/60 bg-card/95 shadow-xs transition-all duration-200 hover:border-primary/35 hover:shadow-sm">
        <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-xs">
              {index + 1}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-none">Артикул</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {productName || "Ръчно добавен ред"}
              </p>
            </div>
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 rounded-xl p-0 text-destructive opacity-60 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
              onClick={onRemove}
              aria-label={`Премахни артикул ${index + 1}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground">Описание</label>
            <Input
              value={item.description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Описание на артикула..."
              className="h-10 w-full border-border/60 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">К-во</label>
              <NumericInput
                value={item.quantity}
                onChange={(e) => onQuantityChange(e.target.value)}
                className="h-10 text-center text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Цена</label>
              <NumericInput
                value={item.unitPrice}
                onChange={(e) => onPriceChange(e.target.value)}
                className="h-10 text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">ДДС %</label>
              <NumericInput
                value={item.taxRate}
                onChange={(e) => onTaxChange(e.target.value)}
                className="h-10 text-center text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Общо</label>
              <div className="flex h-10 items-center rounded-md border border-primary/15 bg-primary/5 px-3 text-sm font-semibold text-primary">
                {formatPrice(itemTotalWithTax)} {invoiceData.currency}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Fetch invoice data on component mount
  useEffect(() => {
    async function fetchInvoiceData() {
      setIsLoadingData(true);
      try {
        // Fetch invoice
        const response = await fetch(`/api/invoices/${invoiceId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Фактурата не е намерена");
            return;
          }
          throw new Error("Грешка при зареждане на фактурата");
        }
        
        const data = await response.json();
        setInvoice(data);
        
        // Set invoice data
        setInvoiceData({
          invoiceNumber: data.invoiceNumber,
          issueDate: new Date(data.issueDate).toISOString().substr(0, 10),
          dueDate: new Date(data.dueDate).toISOString().substr(0, 10),
          supplyDate: data.supplyDate ? new Date(data.supplyDate).toISOString().substr(0, 10) : new Date(data.issueDate).toISOString().substr(0, 10),
          companyId: data.companyId,
          currency: data.currency || "EUR",
          placeOfIssue: data.placeOfIssue || "София",
          paymentMethod: data.paymentMethod || "BANK_TRANSFER",
          isEInvoice: data.isEInvoice || false,
          isOriginal: data.isOriginal !== false,
          notes: data.notes || "",
          termsAndConditions: data.termsAndConditions || "",
          status: data.status
        });
        
        // Set client
        setClient(data.client);
        
        // Fetch companies for dropdown
        const companiesResponse = await fetch("/api/companies");
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json();
          setCompanies(companiesData);
        }
        
        // Fetch products for dropdown
        const productsResponse = await fetch("/api/products");
        let productsData: any[] = [];
        if (productsResponse.ok) {
          productsData = await productsResponse.json();
          setProducts(productsData);
        }
        
        // Set items - ensure quantity is at least 1
        const itemsData = data.items.map((item: any, index: number) => ({
          id: index + 1,
          itemId: item.id,
          description: item.description,
          quantity: Math.max(1, parseFloat(item.quantity) || 1),
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          productId: item.productId || null
        }));
        setItems(itemsData);
        
        // Store product names for items that have products
        const productNamesMap: Record<string, string> = {};
        itemsData.forEach((item: any) => {
          if (item.productId) {
            const product = productsData.find((p: any) => p.id === item.productId);
            if (product) {
              productNamesMap[item.id] = product.name;
            }
          }
        });
        setProductNames(productNamesMap);
      } catch (error) {
        console.error("Error fetching invoice data:", error);
        setError("Грешка при зареждане на данните");
      } finally {
        setIsLoadingData(false);
      }
    }
    
    fetchInvoiceData();
  }, [invoiceId]);
  
  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle item change
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    
    // Validate quantity - cannot be 0 or negative
    if (field === 'quantity') {
      const quantity = parseFloat(value);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error("Количеството трябва да е по-голямо от 0");
        return;
      }
      newItems[index][field] = value;
    } else {
      newItems[index][field] = value;
    }
    
    // Auto-calculate subtotal based on quantity and unit price
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? parseFloat(value) : parseFloat(newItems[index].quantity);
      const unitPrice = field === 'unitPrice' ? parseFloat(value) : parseFloat(newItems[index].unitPrice);
      
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        newItems[index].subtotal = quantity * unitPrice;
      }
    }
    
    setItems(newItems);
  };
  
  // Add new item
  const addItem = () => {
    setItems([
      ...items,
      {
        id: items.length + 1,
        description: "",
        quantity: 1,
        unitPrice: 0, // Default to 0, user should set the price or select a product
        taxRate: 20
      }
    ]);
  };
  
  // Remove item with validation
  const removeItem = (index: number) => {
    // Cannot remove if only one item remains
    if (items.length <= 1) {
      toast.error("Трябва да има поне един артикул във фактурата");
      return;
    }
    
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  
  // Add product as item
  const addProductAsItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      const newItemId = items.length + 1;
      setItems([
        ...items,
        {
          id: newItemId,
          description: product.name,
          quantity: 1,
          unitPrice: product.price,
          taxRate: product.taxRate || 20,
          productId: product.id
        }
      ]);
      // Store product name for this item
      setProductNames(prev => ({
        ...prev,
        [newItemId]: product.name
      }));
    }
  };

  const filteredProducts = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      product.name?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
  }, [productSearchQuery, products]);
  
  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    
    items.forEach(item => {
      const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
      const itemTaxAmount = itemSubtotal * (parseFloat(item.taxRate) / 100);
      
      subtotal += itemSubtotal;
      taxAmount += itemTaxAmount;
    });
    
    const total = subtotal + taxAmount;
    
    return {
      subtotal: formatPrice(subtotal),
      taxAmount: formatPrice(taxAmount),
      total: formatPrice(total)
    };
  };
  
  const totals = calculateTotals();

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Only allow editing DRAFT invoices
    if (invoice.status !== "DRAFT") {
      toast.error("Можете да редактирате само фактури в статус DRAFT. За отмяна на издадена фактура използвайте функцията за създаване на кредитно известие.");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Validate form
      if (items.length === 0) {
        toast.error("Трябва да добавите поне един артикул");
        setIsLoading(false);
        return;
      }
      
      const hasEmptyItems = items.some(item => !item.description);
      if (hasEmptyItems) {
        toast.error("Всички артикули трябва да имат описание");
        setIsLoading(false);
        return;
      }
      
      // Validate quantities - all must be greater than 0
      const hasInvalidQuantities = items.some(item => {
        const quantity = parseFloat(item.quantity);
        return isNaN(quantity) || quantity <= 0;
      });
      
      if (hasInvalidQuantities) {
        toast.error("Всички артикули трябва да имат количество по-голямо от 0");
        setIsLoading(false);
        return;
      }
      
      // Create request data
      const data = {
        invoiceNumber: invoiceData.invoiceNumber,
        clientId: client.id,
        companyId: invoiceData.companyId,
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        supplyDate: invoiceData.supplyDate,
        currency: invoiceData.currency,
        placeOfIssue: invoiceData.placeOfIssue,
        paymentMethod: invoiceData.paymentMethod,
        isEInvoice: invoiceData.isEInvoice,
        isOriginal: invoiceData.isOriginal,
        notes: invoiceData.notes,
        termsAndConditions: invoiceData.termsAndConditions,
        items: items.map(item => ({
          id: item.itemId || undefined, // Use existing itemId if available
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate)
        }))
      };
      
      // Send API request to update invoice
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Грешка при обновяване на фактура");
      }
      
      toast.success("Фактурата е обновена", { 
        description: "Промените бяха запазени успешно."
      });
      
      // Navigate back to invoice details
      router.push(`/invoices/${invoiceId}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Грешка при обновяване на фактурата", {
        description: error instanceof Error ? error.message : "Моля, опитайте отново по-късно."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // If still loading, show loading state
  if (isLoadingData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }
  
  // If error or invoice not found, show error
  if (error || !invoice) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-lg text-muted-foreground">{error || "Фактурата не е намерена"}</p>
        <Button asChild>
          <Link href="/invoices">Към всички фактури</Link>
        </Button>
      </div>
    );
  }
  
  // Only allow editing DRAFT invoices
  if (invoice.status !== "DRAFT") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-lg text-muted-foreground">Можете да редактирате само фактури в статус DRAFT. За отмяна на издадена фактура използвайте функцията за създаване на кредитно известие.</p>
        <Button asChild>
          <Link href={`/invoices/${invoiceId}`}>Назад към детайли на фактурата</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="back-btn rounded-full px-3">
            <Link href={`/invoices/${invoiceId}`}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Назад
            </Link>
          </Button>
          <h1 className="truncate text-lg font-bold sm:text-xl">Редактиране #{invoiceData.invoiceNumber}</h1>
        </div>
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 px-3 border rounded-md hover:bg-muted">
              <MoreVertical className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/invoices/${invoiceId}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Преглед
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {invoiceData.status === "DRAFT" && (
                <DropdownMenuItem
                  onClick={() => {
                    router.push(`/invoices/${invoiceId}?action=issue`);
                  }}
                  className="text-emerald-600 focus:text-emerald-600"
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Издай фактура
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  try {
                    printInvoicePdf(invoiceId);
                    toast.info("PDF файлът беше отворен в нов раздел. Използвайте Print от PDF прегледа.");
                  } catch (error) {
                    console.error("Error printing invoice:", error);
                    toast.error("Грешка при принтирането на фактурата");
                  }
                }}
              >
                <Printer className="mr-2 h-4 w-4" />
                Принтирай
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await exportInvoiceAsPdf(invoiceId);
                  } catch (error) {
                    console.error("Error exporting PDF:", error);
                    toast.error("Грешка при експортиране на PDF");
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Изтегли PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            type="submit" 
            form="invoice-form" 
            size="sm"
            disabled={isLoading}
            className="hidden sm:inline-flex"
          >
            <Save className="w-4 h-4 mr-1.5" />
            {isLoading ? "Запазване..." : "Запази"}
          </Button>
        </div>
      </div>

      <form id="invoice-form" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Детайли на фактурата</CardTitle>
                <CardDescription>
                  Редактирайте основната информация за фактурата
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber" className="text-sm font-medium">Номер на фактура</Label>
                    <Input 
                      id="invoiceNumber" 
                      value={invoiceData.invoiceNumber}
                      readOnly
                      className="bg-muted h-10 sm:h-11 w-full"
                    />
                  </div>
                  <FormDatePicker
                    id="issueDate"
                    label="Дата на издаване"
                    value={invoiceData.issueDate}
                    onChange={(val) => handleInputChange('issueDate', val)}
                  />
                  <FormDatePicker
                    id="dueDate"
                    label="Краен срок"
                    value={invoiceData.dueDate}
                    onChange={(val) => handleInputChange('dueDate', val)}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Company and Client fields with proper label alignment */}
                  <div className="space-y-2">
                    <Label htmlFor="client">Клиент</Label>
                    <Input 
                      id="client" 
                      value={client.name}
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Клиентът не може да бъде променен. За да смените клиента, създайте нова фактура.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Компания</Label>
                    <Select 
                      value={invoiceData.companyId || undefined}
                      onValueChange={(value) => handleInputChange('companyId', value)}
                    >
                      <SelectTrigger id="company">
                        <SelectValue placeholder="Изберете компания" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Валута</Label>
                  <Select
                    value={invoiceData.currency}
                    onValueChange={(value) => handleInputChange('currency', value)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Изберете валута" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BGN">BGN - Лев</SelectItem>
                      <SelectItem value="EUR">EUR - Евро</SelectItem>
                      <SelectItem value="USD">USD - Долар</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormDatePicker
                    id="supplyDate"
                    label="Дата на данъчното събитие"
                    value={invoiceData.supplyDate}
                    onChange={(val) => handleInputChange('supplyDate', val)}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="placeOfIssue" className="text-sm font-medium">Място на издаване</Label>
                    <Input
                      id="placeOfIssue"
                      value={invoiceData.placeOfIssue}
                      onChange={(e) => handleInputChange('placeOfIssue', e.target.value)}
                      placeholder="напр. София"
                      className="h-10 sm:h-11 w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Начин на плащане</Label>
                  <Select
                    value={invoiceData.paymentMethod}
                    onValueChange={(value) => handleInputChange('paymentMethod', value)}
                  >
                    <SelectTrigger id="paymentMethod">
                      <SelectValue placeholder="Начин на плащане" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Банков превод</SelectItem>
                      <SelectItem value="CASH">В брой</SelectItem>
                      <SelectItem value="CREDIT_CARD">Кредитна/дебитна карта</SelectItem>
                      <SelectItem value="OTHER">Друго</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Артикули</CardTitle>
                    <CardDescription className="text-xs">
                      {items.length} артикул(а)
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Ръчно
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Добави от продукти</p>
                      <p className="text-xs text-muted-foreground">
                        Избери готов продукт или добави ръчно нов ред.
                      </p>
                    </div>
                    {products.length > 0 && (
                      <div className="relative w-full sm:w-72">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="search"
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          placeholder="Търси продукт..."
                          className="h-10 pl-10"
                        />
                      </div>
                    )}
                  </div>

                  {products.length > 0 ? (
                    filteredProducts.length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => addProductAsItem(product.id)}
                            className="rounded-2xl border border-border/60 bg-background p-3 text-left transition-all hover:border-primary/35 hover:bg-primary/5"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{product.name}</p>
                                {product.description ? (
                                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                    {product.description}
                                  </p>
                                ) : null}
                              </div>
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <Plus className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Цена</span>
                              <span className="font-semibold">
                                {formatPrice(Number(product.price || 0))} {invoiceData.currency}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                        Няма намерени продукти по това търсене.
                      </div>
                    )
                  ) : (
                    <div className="mt-4 rounded-2xl border border-dashed border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
                      Нямате добавени продукти. Можете да продължите с ръчно добавени артикули.
                    </div>
                  )}
                </div>

                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 py-10 text-center text-muted-foreground">
                    <Package className="mx-auto mb-3 h-10 w-10 opacity-40" />
                    <p className="font-medium">Няма артикули</p>
                    <p className="mt-1 text-sm">Добавете продукт отгоре или създайте ръчен ред.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      {items.map((item, index) => {
                        const productName = productNames[item.id] || (item.productId ? products.find(p => p.id === item.productId)?.name : null);
                        return (
                          <InvoiceItemCard
                            key={item.id}
                            item={item}
                            index={index}
                            productName={productName}
                            onDescriptionChange={(value) => handleItemChange(index, 'description', value)}
                            onQuantityChange={(value) => {
                              if (value === '' || parseFloat(value) > 0) {
                                handleItemChange(index, 'quantity', value);
                              }
                            }}
                            onPriceChange={(value) => handleItemChange(index, 'unitPrice', value)}
                            onTaxChange={(value) => handleItemChange(index, 'taxRate', value)}
                            onRemove={() => removeItem(index)}
                            canRemove={items.length > 1}
                          />
                        );
                      })}
                    </div>
                    
                    {/* Totals */}
                    <div className="mt-4 flex justify-end border-t pt-4">
                      <div className="w-full space-y-2 rounded-2xl bg-linear-to-br from-muted/50 to-muted/30 p-4 sm:min-w-[240px] sm:w-auto">
                        <div className="flex justify-between gap-6 text-sm">
                          <span className="text-muted-foreground">Междинна сума:</span>
                          <span className="font-medium">{totals.subtotal} {invoiceData.currency}</span>
                        </div>
                        <div className="flex justify-between gap-6 text-sm">
                          <span className="text-muted-foreground">ДДС:</span>
                          <span className="font-medium">{totals.taxAmount} {invoiceData.currency}</span>
                        </div>
                        <div className="flex justify-between gap-6 border-t pt-2">
                          <span className="font-semibold">Общо:</span>
                          <span className="font-bold text-primary text-lg">{totals.total} {invoiceData.currency}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Допълнителна информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Бележки</Label>
                  <Textarea
                    id="notes"
                    value={invoiceData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Допълнителна информация за фактурата"
                    className="min-h-28"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">Общи условия</Label>
                  <Textarea
                    id="termsAndConditions"
                    value={invoiceData.termsAndConditions}
                    onChange={(e) => handleInputChange('termsAndConditions', e.target.value)}
                    placeholder="Условия за плащане и други допълнителни условия"
                    className="min-h-28"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="sticky bottom-0 mt-6 rounded-2xl border border-border/70 bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/85 sm:static sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0">
            <div className="grid grid-cols-2 gap-3 sm:border-t sm:pt-6">
              <Button variant="outline" asChild className="h-11 w-full justify-center sm:min-w-[120px]">
                <Link href={`/invoices/${invoiceId}`}>Отказ</Link>
              </Button>
              <Button type="submit" form="invoice-form" disabled={isLoading} className="h-11 w-full justify-center sm:min-w-[160px]">
                <Save className="mr-1.5 h-4 w-4" />
                {isLoading ? "Запазване..." : "Запази промените"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 