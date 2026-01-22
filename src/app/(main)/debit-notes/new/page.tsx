"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorBoundary } from "./ErrorBoundary";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Building2,
  Calendar,
  FileText,
  Check,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input, NumericInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DEFAULT_VAT_RATE } from "@/config/constants";
import { Badge } from "@/components/ui/badge";

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

function NewDebitNotePageContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);
  
  const [formData, setFormData] = useState({
    companyId: "",
    clientId: "",
    invoiceId: "",
    issueDate: new Date().toISOString().split('T')[0],
    reason: "",
    currency: "EUR",
    notes: "",
  });

  const [items, setItems] = useState<Array<{
    id: number;
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>>([
    {
      id: 1,
      productId: undefined,
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: DEFAULT_VAT_RATE,
    }
  ]);

  // Fetch clients, companies, and products
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingData(true);
        const [clientsRes, companiesRes, productsRes] = await Promise.all([
          fetch('/api/clients').catch(() => ({ ok: false, json: async () => ({ clients: [] }) })),
          fetch('/api/companies').catch(() => ({ ok: false, json: async () => ({ companies: [] }) })),
          fetch('/api/products').catch(() => ({ ok: false, json: async () => ({ products: [] }) })),
        ]);

        const clientsData = await clientsRes.json();
        const companiesData = await companiesRes.json();
        const productsData = await productsRes.json();

        // APIs return arrays directly, not wrapped in objects
        const clientsArray = Array.isArray(clientsData) ? clientsData : (clientsData.clients || []);
        const companiesArray = Array.isArray(companiesData) ? companiesData : (companiesData.companies || []);
        const productsArray = Array.isArray(productsData) ? productsData : (productsData.products || []);
        
        // Filter out invalid items (missing id or name)
        setClients(clientsArray.filter((c: any) => c?.id && c?.name));
        setCompanies(companiesArray.filter((c: any) => c?.id && c?.name));
        setProducts(productsArray.filter((p: any) => p?.id && p?.name));
        
        console.log('Fetched data:', {
          clients: clientsArray.filter((c: any) => c?.id && c?.name).length,
          companies: companiesArray.filter((c: any) => c?.id && c?.name).length,
          products: productsArray.filter((p: any) => p?.id && p?.name).length,
        });
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error?.message || 'Грешка при зареждане на данни');
        toast.error('Грешка при зареждане на данни');
        // Set empty arrays on error to prevent white page
        setClients([]);
        setCompanies([]);
        setProducts([]);
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    if (!productSearchQuery.trim()) return products;
    const query = productSearchQuery.toLowerCase();
    return products.filter(product =>
      product?.name?.toLowerCase().includes(query) ||
      product?.description?.toLowerCase().includes(query)
    );
  }, [products, productSearchQuery]);

  const addItem = useCallback(() => {
    setItems(prev => {
      const maxId = prev.length > 0 ? Math.max(...prev.map(i => i.id)) : 0;
      return [...prev, {
        id: maxId + 1,
        productId: undefined,
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: DEFAULT_VAT_RATE,
      }];
    });
  }, []);

  const selectProductForItem = useCallback((itemId: number, productId: string) => {
    if (!productId) {
      // Clear product selection
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, productId: undefined } : item
      ));
      return;
    }
    
    if (!products || products.length === 0) return;
    
    const product = products.find(p => p?.id === productId);
    if (product) {
      setItems(prev => prev.map(item =>
        item.id === itemId ? {
          ...item,
          productId: productId,
          description: product.name || "",
          unitPrice: Number(product.price) || 0,
          taxRate: Number(product.taxRate) || DEFAULT_VAT_RATE,
        } : item
      ));
    }
  }, [products]);

  const removeItem = useCallback((id: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    } else {
      toast.error('Трябва да има поне един артикул');
    }
  }, [items.length]);

  const updateItem = useCallback((id: number, field: string, value: string | number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  const addProduct = useCallback((product: any) => {
    setItems(prev => {
      const maxId = prev.length > 0 ? Math.max(...prev.map(i => i.id)) : 0;
      const newItem = {
        id: maxId + 1,
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: Number(product.price),
        taxRate: Number(product.taxRate) || DEFAULT_VAT_RATE
      };
      return [...prev, newItem];
    });
    setShowProductSearch(false);
    setProductSearchQuery("");
    toast.success(`"${product.name}" добавен`, {
      description: `${formatPrice(Number(product.price))} ${formData.currency}`
    });
  }, [formData.currency]);

  // Calculate totals
  const totals = items.reduce((acc, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemTax = itemSubtotal * (item.taxRate / 100);
    const itemTotal = itemSubtotal + itemTax;
    
    return {
      subtotal: acc.subtotal + itemSubtotal,
      taxAmount: acc.taxAmount + itemTax,
      total: acc.total + itemTotal,
    };
  }, { subtotal: 0, taxAmount: 0, total: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyId || !formData.clientId) {
      toast.error('Моля, изберете компания и клиент');
      return;
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast.error('Моля, попълнете всички полета на артикулите');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/debit-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detailed error message if available
        const errorMessage = data.details 
          ? `${data.error || 'Грешка при създаване на дебитно известие'}: ${JSON.stringify(data.details)}`
          : data.error || 'Грешка при създаване на дебитно известие';
        throw new Error(errorMessage);
      }

      toast.success('Дебитното известие е създадено успешно', {
        description: `Номер: ${data.debitNote.debitNoteNumber}`,
      });

      router.push(`/debit-notes/${data.debitNote.id}`);
    } catch (error: any) {
      console.error('Error creating debit note:', error);
      toast.error(error.message || 'Грешка при създаване на дебитно известие');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Зареждане...</p>
        </div>
      </div>
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/debit-notes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
          <h1 className="text-3xl font-bold mt-4">Ново дебитно известие</h1>
          <p className="text-muted-foreground mt-1">
            Създайте дебитно известие за доплащане при замяна на продукт
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Company & Client */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Компания и клиент
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyId">Компания *</Label>
                  <Select
                    value={formData.companyId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Изберете компания" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] max-h-[300px]">
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Изберете клиент" />
                    </SelectTrigger>
                    <SelectContent className="z-[100] max-h-[300px]">
                      {(clients || []).map((client) => (
                        <SelectItem key={client?.id} value={client?.id}>
                          {client?.name || ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoiceId">Свързана фактура (опционално)</Label>
                  <Input
                    id="invoiceId"
                    value={formData.invoiceId}
                    onChange={(e) => setFormData(prev => ({ ...prev, invoiceId: e.target.value }))}
                    placeholder="ID на фактурата (ако е свързана)"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Детайли
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Дата на издаване *</Label>
                  <div className="relative">
                    <Input
                      id="issueDate"
                      type="date"
                      value={formData.issueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                      className="pr-10"
                      required
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Причина (опционално)</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Например: Замяна на продукт с доплащане"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Валута</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Допълнителни бележки..."
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Items */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Артикули
                  </CardTitle>
                  <div className="flex gap-2">
                    {products.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowProductSearch(!showProductSearch)}
                      >
                        <Search className="h-4 w-4 mr-1" />
                        Продукти
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Добави
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Product Search */}
                {showProductSearch && products.length > 0 && (
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
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
                            className="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              {product.description && (
                                <p className="text-xs text-muted-foreground truncate">{product.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 ml-2">
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
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg space-y-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Артикул {index + 1}
                      </span>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-7 w-7 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Продукт (опционално)</Label>
                      <div className="flex gap-2">
                        <Select
                          value={item.productId || undefined}
                          onValueChange={(value) => selectProductForItem(item.id, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Изберете продукт..." />
                          </SelectTrigger>
                          <SelectContent className="z-[100] max-h-[300px]">
                            {(products || []).map((product) => (
                              <SelectItem key={product?.id} value={product?.id || ""}>
                                {product?.name || ""} - {formatPrice(Number(product?.price || 0))} {formData.currency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {item.productId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => selectProductForItem(item.id, "")}
                            className="flex-shrink-0"
                          >
                            Изчисти
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Описание *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Описание на артикула..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-2">
                        <Label className="text-xs">К-во</Label>
                        <NumericInput
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                          className="h-9"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Цена</Label>
                        <NumericInput
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="h-9"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">ДДС %</Label>
                        <NumericInput
                          value={item.taxRate}
                          onChange={(e) => updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)}
                          className="h-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Общо:</span>
                        <span className="font-bold text-emerald-600">
                          {formatPrice((item.quantity * item.unitPrice) * (1 + item.taxRate / 100))} {formData.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-lg">Общо</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Сума без ДДС:</span>
                  <span>{formatPrice(totals.subtotal)} {formData.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ДДС:</span>
                  <span>{formatPrice(totals.taxAmount)} {formData.currency}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Общо:</span>
                    <span className="text-emerald-600">
                      +{formatPrice(totals.total)} {formData.currency}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            asChild
          >
            <Link href="/debit-notes">Отказ</Link>
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Създаване...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Създай дебитно известие
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewDebitNotePage() {
  return (
    <ErrorBoundary>
      <NewDebitNotePageContent />
    </ErrorBoundary>
  );
}
