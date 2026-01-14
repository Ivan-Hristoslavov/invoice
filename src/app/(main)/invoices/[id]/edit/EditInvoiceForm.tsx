"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
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
        
        // Set items
        setItems(data.items.map((item: any, index: number) => ({
          id: index + 1,
          itemId: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate
        })));
        
        // Fetch companies for dropdown
        const companiesResponse = await fetch("/api/companies");
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json();
          setCompanies(companiesData);
        }
        
        // Fetch products for dropdown
        const productsResponse = await fetch("/api/products");
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData);
        }
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
    newItems[index][field] = value;
    
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
        unitPrice: 0,
        taxRate: 20
      }
    ]);
  };
  
  // Remove item
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  
  // Add product as item
  const addProductAsItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setItems([
        ...items,
        {
          id: items.length + 1,
          description: product.name,
          quantity: 1,
          unitPrice: product.price,
          taxRate: product.taxRate || 20
        }
      ]);
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
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2)
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
          id: item.id,
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
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад към фактурата
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Редактиране на фактура #{invoiceData.invoiceNumber}</h1>
        </div>
        <Button 
          type="submit" 
          form="invoice-form" 
          disabled={isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Запазване..." : "Запази промените"}
        </Button>
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
                      <SelectItem value="BGN">BGN - Български лев</SelectItem>
                      <SelectItem value="EUR">EUR - Евро</SelectItem>
                      <SelectItem value="USD">USD - Щатски долар</SelectItem>
                      <SelectItem value="GBP">GBP - Британска лира</SelectItem>
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
                  <div className="overflow-x-auto">
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
                        {items.map((item, index) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-3 px-4">
                              <Input
                                placeholder="Описание на артикула"
                                value={item.description}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="text-right"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
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
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </td>
                          </tr>
                        ))}
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