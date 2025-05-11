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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
    { id: 1, description: "", quantity: 1, unitPrice: 0, taxRate: 0 }
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
    currency: "USD"
  });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Fetch data from API
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoadingData(true);
        
        // Fetch clients
        const clientsResponse = await fetch('/api/clients');
        if (!clientsResponse.ok) throw new Error('Failed to fetch clients');
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
        setFilteredClients(clientsData);
        
        // Fetch companies
        const companiesResponse = await fetch('/api/companies');
        if (!companiesResponse.ok) throw new Error('Failed to fetch companies');
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData);
        
        // Default company if available
        if (companiesData.length > 0) {
          setInvoiceData(prev => ({
            ...prev,
            companyId: companiesData[0].id
          }));
        }
        
        // Fetch products
        const productsResponse = await fetch('/api/products');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        const productsData = await productsResponse.json();
        setProducts(productsData);
        
        // If client ID is provided in URL, fetch that client
        if (preselectedClientId) {
          const foundClient = clientsData.find((c: any) => c.id === preselectedClientId);
          if (foundClient) {
            setSelectedClient(foundClient);
            setSelectedClientId(foundClient.id);
            setIsClientSelectionStep(false);
          }
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data', {
          description: 'Could not load clients and companies data. Please try again.'
        });
      } finally {
        setIsLoadingData(false);
      }
    }
    
    fetchData();
  }, [preselectedClientId]);

  // Filter clients based on search query
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

  // Select a client and move to invoice details
  const selectClient = useCallback((client: any) => {
    setSelectedClient(client);
    setSelectedClientId(client.id);
    setIsClientSelectionStep(false);
  }, []);

  // Change client selection
  const changeClient = useCallback(() => {
    setSearchQuery("");
    setIsClientSelectionStep(true);
  }, []);

  // Add a new empty item to the invoice
  const addItem = useCallback(() => {
    const newItem = {
      id: items.length + 1,
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 0
    };
    setItems([...items, newItem]);
  }, [items]);

  // Remove an item from the invoice
  const removeItem = useCallback((id: number) => {
    setItems(items.filter(item => item.id !== id));
  }, [items]);

  // Update an item's data
  const updateItem = useCallback((id: number, field: string, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, [items]);

  // Handle form input changes
  const handleInputChange = useCallback((field: string, value: string) => {
    setInvoiceData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Calculate invoice totals
  const calculateTotal = useCallback(() => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * (1 + item.taxRate/100)), 0);
  }, [items]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validate
      if (!selectedClientId) {
        toast.error("Please select a client");
        setIsLoading(false);
        return;
      }
      
      if (!invoiceData.companyId) {
        toast.error("Please select your company");
        setIsLoading(false);
        return;
      }
      
      // Implementation for submitting the form would go here
      toast.success("Invoice created", { 
        description: "Your invoice has been created successfully."
      });
      router.push("/invoices");
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice', {
        description: 'There was an error creating your invoice. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If we're in the client selection step
  if (isClientSelectionStep) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">New Invoice</h1>
          </div>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Client</CardTitle>
            <CardDescription>
              Choose a client for this invoice or <Link href="/clients/new" className="text-primary hover:underline">create a new one</Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-6">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search clients by name, email, city..."
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
                <p className="text-muted-foreground">Loading clients...</p>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground mb-4">No clients found</p>
                <Button asChild>
                  <Link href="/clients/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Client
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

  // After client selection, show the invoice creation form
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/invoices">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">New Invoice</h1>
        </div>
        <Button type="submit" form="invoice-form" disabled={isLoading || isLoadingData}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save Invoice"}
        </Button>
      </div>

      {/* Client Summary */}
      {selectedClient && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="inline-flex items-center mb-1">
                  <User className="h-4 w-4 mr-2 text-muted-foreground" />
                  <h3 className="font-medium">Invoice for</h3>
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
                Change Client
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form id="invoice-form" onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input 
                  id="invoiceNumber" 
                  placeholder="INV-001" 
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input 
                    id="issueDate" 
                    type="date" 
                    value={invoiceData.issueDate}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input 
                    id="dueDate" 
                    type="date" 
                    value={invoiceData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Your Company</Label>
                <Select 
                  value={invoiceData.companyId}
                  onValueChange={(value) => handleInputChange('companyId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingData ? (
                      <SelectItem value="loading" disabled>Loading companies...</SelectItem>
                    ) : companies.length > 0 ? (
                      companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No companies found</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select 
                  value={invoiceData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="BGN">BGN - Bulgarian Lev</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Add a spacing card for products catalog later */}
          <Card>
            <CardHeader>
              <CardTitle>Select Products</CardTitle>
              <CardDescription>
                Choose products from your catalog or add custom items below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                You can select products from your catalog to quickly add them to your invoice.
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
                    +{products.length - 5} more
                  </Badge>
                )}
                {products.length === 0 && (
                  <div className="text-sm text-muted-foreground">No products found. You can add custom items below.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 border-b pb-4">
                  <div className="col-span-12 sm:col-span-5">
                    <Label htmlFor={`item-${item.id}-description`}>Description</Label>
                    <div className="mt-1">
                      <Input
                        id={`item-${item.id}-description`}
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label htmlFor={`item-${item.id}-quantity`}>Quantity</Label>
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
                    <Label htmlFor={`item-${item.id}-price`}>Unit Price</Label>
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
                    <Label htmlFor={`item-${item.id}-tax`}>Tax Rate (%)</Label>
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
              Add Item
            </Button>
          </CardContent>
          <CardFooter className="justify-between border-t p-4">
            <div>
              <Button type="button" variant="ghost">Save as Draft</Button>
            </div>
            <div className="text-right">
              <div className="font-medium">Total: {invoiceData.currency === 'USD' ? '$' : invoiceData.currency === 'EUR' ? '€' : invoiceData.currency === 'GBP' ? '£' : invoiceData.currency === 'BGN' ? 'лв ' : ''}{calculateTotal().toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Including taxes</div>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
} 