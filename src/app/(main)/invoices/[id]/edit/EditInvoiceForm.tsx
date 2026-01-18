"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, MoreVertical, Eye, FileCheck, Printer, Download } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportInvoiceAsPdf } from "@/lib/invoice-export";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    companyId: "",
    currency: "EUR",
    notes: "",
    termsAndConditions: "",
    status: ""
  });
  
  const [items, setItems] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [client, setClient] = useState<any>(null);
  const [productNames, setProductNames] = useState<Record<string, string>>({});

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
          companyId: data.companyId,
          currency: data.currency,
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
        currency: invoiceData.currency,
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
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Зареждане...</p>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/invoices/${invoiceId}`}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Назад
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Редактиране #{invoiceData.invoiceNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
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
                onClick={async () => {
                  try {
                    // Fetch PDF and open in new window for printing
                    const response = await fetch(`/api/invoices/export-pdf?invoiceId=${invoiceId}`);
                    
                    if (!response.ok) {
                      throw new Error('Грешка при генерирането на PDF');
                    }
                    
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    
                    // Create a link element and click it to open PDF in new tab
                    const link = document.createElement('a');
                    link.href = url;
                    link.target = '_blank';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Wait a bit for PDF to open, then try to print
                    setTimeout(() => {
                      // Try to find the new window and print
                      // Note: This may not work in all browsers due to security restrictions
                      // The user may need to manually print from the PDF viewer
                      toast.info("PDF файлът беше отворен. Моля, използвайте бутона за принтиране в браузъра.");
                    }, 500);
                    
                    // Clean up URL after a delay
                    setTimeout(() => {
                      URL.revokeObjectURL(url);
                    }, 1000);
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
          >
            <Save className="w-4 h-4 mr-1.5" />
            {isLoading ? "Запазване..." : "Запази"}
          </Button>
        </div>
      </div>

      <form id="invoice-form" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
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
                    <Label htmlFor="invoiceNumber">Номер на фактура</Label>
                    <Input 
                      id="invoiceNumber" 
                      value={invoiceData.invoiceNumber}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issueDate">Дата на издаване</Label>
                    <Input 
                      id="issueDate" 
                      type="date" 
                      value={invoiceData.issueDate}
                      onChange={(e) => handleInputChange('issueDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Краен срок</Label>
                    <Input 
                      id="dueDate" 
                      type="date" 
                      value={invoiceData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <SelectItem value="EUR">EUR - Евро</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Артикули</CardTitle>
                <CardDescription>
                  Редактирайте артикулите във фактурата
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-4 md:hidden">
                    {items.map((item, index) => {
                      const productName = productNames[item.id] || (item.productId ? products.find(p => p.id === item.productId)?.name : null);
                      return (
                        <div key={item.id} className="rounded-xl border bg-card p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Артикул {index + 1}</p>
                              {productName && (
                                <p className="text-xs text-muted-foreground">Продукт: {productName}</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              disabled={items.length <= 1}
                              title={items.length <= 1 ? "Трябва да има поне един артикул" : "Изтрий артикул"}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label>Описание</Label>
                            <Input
                              placeholder={productName ? `Описание за ${productName}` : "Описание на артикула"}
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            />
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="space-y-2">
                              <Label>Количество</Label>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={item.quantity}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || parseFloat(value) > 0) {
                                    handleItemChange(index, 'quantity', value);
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = parseFloat(e.target.value);
                                  if (isNaN(value) || value <= 0) {
                                    handleItemChange(index, 'quantity', '1');
                                    toast.error("Количеството трябва да е по-голямо от 0. Автоматично е зададено на 1.");
                                  }
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Ед. цена</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>ДДС (%)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={item.taxRate}
                                onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">Описание</th>
                          <th className="text-right py-3 px-4 font-medium w-24">Количество</th>
                          <th className="text-right py-3 px-4 font-medium w-32">Ед. цена</th>
                          <th className="text-right py-3 px-4 font-medium w-32">ДДС (%)</th>
                          <th className="text-right py-3 px-4 font-medium w-24">Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          const productName = productNames[item.id] || (item.productId ? products.find(p => p.id === item.productId)?.name : null);
                          return (
                          <tr key={item.id} className="border-b">
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                {productName && (
                                  <div className="text-xs text-muted-foreground font-medium">
                                    Продукт: {productName}
                                  </div>
                                )}
                                <Input
                                  placeholder={productName ? `Описание за ${productName}` : "Описание на артикула"}
                                  value={item.description}
                                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                className="text-right"
                                value={item.quantity}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || parseFloat(value) > 0) {
                                    handleItemChange(index, 'quantity', value);
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = parseFloat(e.target.value);
                                  if (isNaN(value) || value <= 0) {
                                    handleItemChange(index, 'quantity', '1');
                                    toast.error("Количеството трябва да е по-голямо от 0. Автоматично е зададено на 1.");
                                  }
                                }}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="text-right"
                                value={item.unitPrice}
                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                className="text-right"
                                value={item.taxRate}
                                onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                              />
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(index)}
                                disabled={items.length <= 1}
                                title={items.length <= 1 ? "Трябва да има поне един артикул" : "Изтрий артикул"}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addItem}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Добави артикул
                    </Button>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between gap-8">
                        <span className="text-muted-foreground">Междинна сума:</span>
                        <span className="font-medium">{totals.subtotal} {invoiceData.currency}</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-muted-foreground">ДДС:</span>
                        <span className="font-medium">{totals.taxAmount} {invoiceData.currency}</span>
                      </div>
                      <div className="flex justify-between gap-8 border-t pt-2">
                        <span className="font-medium">Общо:</span>
                        <span className="font-bold">{totals.total} {invoiceData.currency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Допълнителна информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Бележки</Label>
                  <Input
                    id="notes"
                    value={invoiceData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Допълнителна информация за фактурата"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">Общи условия</Label>
                  <Input
                    id="termsAndConditions"
                    value={invoiceData.termsAndConditions}
                    onChange={(e) => handleInputChange('termsAndConditions', e.target.value)}
                    placeholder="Условия за плащане и други допълнителни условия"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Добавяне на продукти</CardTitle>
                <CardDescription>
                  Добавете бързо съществуващи продукти към фактурата
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {products.length > 0 ? (
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="flex justify-between items-center p-3 border rounded-md hover:bg-muted">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {product.price} {invoiceData.currency} / {product.unit}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addProductAsItem(product.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Добави
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Нямате добавени продукти. Добавете продукти от секция "Продукти".
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
} 