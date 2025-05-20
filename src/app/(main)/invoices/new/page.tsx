"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Search, X, Check, Edit, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { generateBulgarianInvoiceNumber } from "@/lib/bulgarian-invoice";
import { DEFAULT_VAT_RATE } from "@/config/constants";

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isClientSelectionStep, setIsClientSelectionStep] = useState(!preselectedClientId);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(preselectedClientId);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  
  const [items, setItems] = useState([
    { id: 1, description: "", quantity: 1, unitPrice: 0, taxRate: DEFAULT_VAT_RATE }
  ]);
  const [clients, setClients] = useState<any[]>([]);
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    issueDate: new Date().toISOString().substr(0, 10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substr(0, 10),
    companyId: "",
    currency: "BGN",
    bulstatNumber: "",
    isOriginal: true,
    placeOfIssue: "София",
    paymentMethod: "BANK_TRANSFER",
    supplyDate: new Date().toISOString().substr(0, 10),
    isEInvoice: false
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch data from API
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingData(true);
        
        const clientsResponse = await fetch('/api/clients');
        if (!clientsResponse.ok) throw new Error('Грешка при зареждане на клиенти');
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
        setFilteredClients(clientsData);
        
        const companiesResponse = await fetch('/api/companies');
        if (!companiesResponse.ok) throw new Error('Грешка при зареждане на компании');
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData);
        
        if (companiesData.length > 0) {
          setInvoiceData(prev => ({
            ...prev,
            companyId: companiesData[0].id
          }));
        }
        
        const productsResponse = await fetch('/api/products');
        if (!productsResponse.ok) throw new Error('Грешка при зареждане на продукти');
        const productsData = await productsResponse.json();
        setProducts(productsData);
        
        if (preselectedClientId) {
          const foundClient = clientsData.find((c: any) => c.id === preselectedClientId);
          if (foundClient) {
            setSelectedClient(foundClient);
            setSelectedClientId(foundClient.id);
            setIsClientSelectionStep(false);
          }
        }
        
      } catch (error) {
        console.error('Грешка при зареждане на данни:', error);
        toast.error('Грешка при зареждане', {
          description: 'Възникна проблем при зареждането на данните. Моля, опитайте отново.'
        });
      } finally {
        setIsLoadingData(false);
      }
    }
    
    fetchData();
  }, [preselectedClientId]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients(clients);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = clients.filter(client => 
        client.name.toLowerCase().includes(lowercaseQuery) ||
        (client.email && client.email.toLowerCase().includes(lowercaseQuery)) ||
        (client.city && client.city.toLowerCase().includes(lowercaseQuery)) ||
        (client.country && client.country.toLowerCase().includes(lowercaseQuery))
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  const selectClient = useCallback((client: any) => {
    setSelectedClient(client);
    setSelectedClientId(client.id);
    setIsClientSelectionStep(false);
  }, []);

  const changeClient = useCallback(() => {
    setSearchQuery("");
    setIsClientSelectionStep(true);
  }, []);

  const addItem = useCallback(() => {
    const newItem = {
      id: items.length + 1,
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: DEFAULT_VAT_RATE // Use default VAT rate
    };
    setItems([...items, newItem]);
  }, [items]);

  const removeItem = useCallback((id: number) => {
    setItems(items.filter(item => item.id !== id));
  }, [items]);

  const updateItem = useCallback((id: number, field: string, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, [items]);

  // Add effect to generate invoice number when company is selected
  useEffect(() => {
    async function generateInvoiceNumber() {
      if (!invoiceData.companyId) return;

      try {
        const response = await fetch(`/api/invoices/next-number?companyId=${invoiceData.companyId}`);
        if (!response.ok) throw new Error('Failed to generate invoice number');
        
        const data = await response.json();
        setInvoiceData(prev => ({
          ...prev,
          invoiceNumber: data.invoiceNumber
        }));
      } catch (error) {
        console.error('Error generating invoice number:', error);
        toast.error('Грешка при генериране на номер', {
          description: 'Възникна проблем при генерирането на номер на фактурата.'
        });
      }
    }

    generateInvoiceNumber();
  }, [invoiceData.companyId]);

  // Update the company selection handler
  const handleInputChange = useCallback((field: string, value: string) => {
    setInvoiceData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      if (field === 'companyId') {
        const selectedCompany = companies.find(c => c.id === value);
        const bulstatNumber = selectedCompany?.bulstatNumber || selectedCompany?.vatNumber?.replace(/^BG/, '') || '';
        
        return {
          ...newData,
          bulstatNumber: bulstatNumber,
          placeOfIssue: selectedCompany?.city || "София",
        };
      }
      
      return newData;
    });
  }, [companies]);

  const calculateTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (1 + item.taxRate/100)), 0);
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!selectedClientId) {
        toast.error("Моля, изберете клиент");
        setIsLoading(false);
        return;
      }
      
      if (!invoiceData.companyId) {
        toast.error("Моля, изберете фирма");
        setIsLoading(false);
        return;
      }
      
      if (!invoiceData.invoiceNumber) {
        toast.error("Номерът на фактурата е задължителен");
        setIsLoading(false);
        return;
      }
      
      const hasEmptyItems = items.some(item => !item.description);
      if (hasEmptyItems) {
        toast.error("Всички артикули трябва да имат описание");
        setIsLoading(false);
        return;
      }
      
      const data = {
        invoiceNumber: invoiceData.invoiceNumber,
        clientId: selectedClientId,
        companyId: invoiceData.companyId,
        issueDate: invoiceData.issueDate,
        dueDate: invoiceData.dueDate,
        currency: invoiceData.currency,
        items: items.map(item => ({
          id: item.id,
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          taxRate: Number(item.taxRate)
        }))
      };
      
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Грешка при създаване на фактура");
      }
      
      toast.success("Фактурата е създадена", { 
        description: "Вашата фактура беше създадена успешно."
      });
      router.push("/invoices");
    } catch (error) {
      console.error('Грешка при създаване на фактура:', error);
      toast.error('Грешка при създаване на фактура', {
        description: 'Възникна проблем при създаването на фактурата. Моля, опитайте отново.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isClientSelectionStep) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Нова фактура</h1>
          </div>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Избор на клиент</CardTitle>
            <CardDescription>
              Изберете клиент за тази фактура или <Link href="/clients/new" className="text-primary hover:underline">създайте нов</Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Търсете по име, имейл, град..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-1 top-1 h-7 w-7 p-0" 
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {isLoadingData ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Зареждане на клиенти...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-8 text-center">
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
                  <Card key={client.id} className="overflow-hidden cursor-pointer hover:border-primary transition-colors" onClick={() => selectClient(client)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="font-medium truncate flex-1">{client.name}</div>
                      </div>
                      
                      <div className="mt-2 text-sm text-muted-foreground space-y-1">
                        {client.email && (
                          <div className="truncate">
                            {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="truncate">
                            {client.phone}
                          </div>
                        )}
                        {client.country && (
                          <div className="truncate">
                            {[client.city, client.country].filter(Boolean).join(", ")}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Нова фактура</h1>
        </div>
        <Button type="submit" form="invoice-form" disabled={isLoading || isLoadingData}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Запазване..." : "Запази фактура"}
        </Button>
      </div>

      {selectedClient && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="inline-flex items-center mb-1">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <h3 className="font-medium">Фактура за</h3>
                </div>
                <div className="text-xl font-bold">{selectedClient.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {[
                    selectedClient.email,
                    selectedClient.phone,
                    [selectedClient.city, selectedClient.country].filter(Boolean).join(", ")
                  ].filter(Boolean).join(" • ")}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={changeClient}>
                <Edit className="h-4 w-4 mr-2" />
                Промяна на клиент
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form id="invoice-form" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Детайли на фактурата</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Номер на фактура</Label>
                <Input 
                  id="invoiceNumber" 
                  value={invoiceData.invoiceNumber}
                  readOnly
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Номерът на фактурата се генерира автоматично според изискванията на НАП
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="company">Вашата фирма</Label>
                <Select 
                  value={invoiceData.companyId}
                  onValueChange={(value) => handleInputChange('companyId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Изберете фирма" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingData ? (
                      <SelectItem value="loading" disabled>Зареждане на фирми...</SelectItem>
                    ) : companies.length > 0 ? (
                      companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Няма намерени фирми</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Валута</Label>
                <Select 
                  value={invoiceData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
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
              
              {invoiceData.currency === 'BGN' && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-base font-medium mb-4">Съответствие с изискванията на НАП</h3>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bulstatNumber">БУЛСТАТ/ЕИК</Label>
                      <Input 
                        id="bulstatNumber" 
                        placeholder="Пример: 123456789" 
                        value={invoiceData.bulstatNumber}
                        onChange={(e) => handleInputChange('bulstatNumber', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placeOfIssue">Място на издаване</Label>
                      <Input 
                        id="placeOfIssue" 
                        placeholder="Пример: София" 
                        value={invoiceData.placeOfIssue}
                        onChange={(e) => handleInputChange('placeOfIssue', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplyDate">Дата на данъчно събитие</Label>
                      <Input 
                        id="supplyDate" 
                        type="date" 
                        value={invoiceData.supplyDate}
                        onChange={(e) => handleInputChange('supplyDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">Начин на плащане</Label>
                      <Select 
                        value={invoiceData.paymentMethod}
                        onValueChange={(value) => handleInputChange('paymentMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Изберете начин на плащане" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BANK_TRANSFER">Банков превод</SelectItem>
                          <SelectItem value="CASH">В брой</SelectItem>
                          <SelectItem value="CREDIT_CARD">Кредитна/дебитна карта</SelectItem>
                          <SelectItem value="WIRE_TRANSFER">Нареждане за превод</SelectItem>
                          <SelectItem value="OTHER">Друго</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isOriginal"
                        checked={invoiceData.isOriginal}
                        onChange={(e) => handleInputChange('isOriginal', e.target.checked.toString())}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <Label htmlFor="isOriginal">Оригинал (не е дубликат)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isEInvoice"
                        checked={invoiceData.isEInvoice}
                        onChange={(e) => handleInputChange('isEInvoice', e.target.checked.toString())}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <Label htmlFor="isEInvoice">Електронна фактура</Label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Избор на продукти</CardTitle>
              <CardDescription>
                Изберете продукти от каталога или добавете ръчно артикули по-долу
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Можете да изберете продукти от вашия каталог, за да ги добавите бързо към фактурата.
              </div>
              <div className="flex flex-wrap gap-2">
                {products.slice(0, 5).map(product => (
                  <Badge 
                    key={product.id} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-secondary transition-colors py-2"
                    onClick={() => {
                      const newItem = {
                        id: items.length + 1,
                        description: product.name,
                        quantity: 1,
                        unitPrice: Number(product.price),
                        taxRate: Number(product.taxRate)
                      };
                      setItems([...items, newItem]);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {product.name}
                  </Badge>
                ))}
                {products.length > 5 && (
                  <Badge variant="outline" className="cursor-pointer hover:bg-secondary transition-colors py-2">
                    +{products.length - 5} още
                  </Badge>
                )}
                {products.length === 0 && (
                  <div className="text-sm text-muted-foreground">Няма намерени продукти. Можете да добавите артикули ръчно по-долу.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Артикули във фактурата</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 border-b pb-4">
                  <div className="col-span-12 sm:col-span-5">
                    <Label htmlFor={`item-${item.id}-description`}>Описание</Label>
                    <div className="mt-1">
                      <Input
                        id={`item-${item.id}-description`}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Описание на артикула"
                      />
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label htmlFor={`item-${item.id}-quantity`}>Количество</Label>
                    <div className="mt-1">
                      <Input
                        id={`item-${item.id}-quantity`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label htmlFor={`item-${item.id}-price`}>Ед. цена</Label>
                    <div className="mt-1">
                      <Input
                        id={`item-${item.id}-price`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="col-span-3 sm:col-span-2">
                    <Label htmlFor={`item-${item.id}-tax`}>ДДС (%)</Label>
                    <div className="mt-1">
                      <Input
                        id={`item-${item.id}-tax`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.taxRate}
                        onChange={(e) => updateItem(item.id, "taxRate", parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="col-span-1 mt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeItem(item.id)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" className="mt-4" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Добави артикул
            </Button>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between border-t p-6 space-y-4 sm:space-y-0">
            <div>
              <Button type="button" variant="ghost" className="mb-2">
                Запази като чернова
              </Button>
            </div>
            <div className="text-right bg-secondary/10 p-4 rounded-lg">
              <div className="text-lg font-semibold mb-1">
                Общо: {invoiceData.currency === 'USD' ? '$' : invoiceData.currency === 'EUR' ? '€' : invoiceData.currency === 'GBP' ? '£' : invoiceData.currency === 'BGN' ? 'лв ' : ''}{calculateTotal().toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Включително ДДС
              </div>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 