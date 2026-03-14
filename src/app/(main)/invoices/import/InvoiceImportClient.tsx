"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, FileText, Upload, Download, CheckCircle, X, Info } from "lucide-react";
import {
  parseInvoiceCsv,
  importInvoices,
  generateCsvTemplate,
  downloadCsv,
} from "@/lib/invoice-import";

type Client = {
  id: string;
  name: string;
  email?: string | null;
};

type Company = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  price: any; // Using any due to Decimal in Prisma
  taxRate: any; // Using any due to Decimal in Prisma
};

interface InvoiceImportClientProps {
  clients: Client[];
  companies: Company[];
  products: Product[];
}

export default function InvoiceImportClient({ clients, companies, products }: InvoiceImportClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Handler for file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setImportResult(null);
    
    if (selectedFile && !selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.csv')) {
      setFile(droppedFile);
      setImportResult(null);
    } else {
      toast.error('Please drop a CSV file');
    }
  }, []);
  
  // Process CSV file and import invoices
  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Parse the CSV file
      const invoices = await parseInvoiceCsv(file);
      
      if (invoices.length === 0) {
        toast.error('No valid invoices found in the CSV file');
        setIsProcessing(false);
        return;
      }
      
      // Upload and process the invoices
      setIsUploading(true);
      const result = await importInvoices(invoices);
      setImportResult(result);
      
      if (result.imported > 0) {
        toast.success(`Successfully imported ${result.imported} invoices`);
      }
      
      if (result.failed > 0) {
        toast.error(`Failed to import ${result.failed} invoices`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error((error as Error).message || 'Failed to process the CSV file');
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };
  
  // Download CSV template
  const handleDownloadTemplate = () => {
    const csvContent = generateCsvTemplate();
    downloadCsv(csvContent, 'invoice_import_template.csv');
    toast.success('Template downloaded successfully');
  };
  
  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-6">
        <TabsTrigger value="upload">Upload CSV</TabsTrigger>
        <TabsTrigger value="instructions">Instructions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>
                Upload a CSV file containing invoice data for import
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  file ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center space-y-4">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  
                  {file ? (
                    <div className="flex items-center justify-center p-2 bg-muted rounded-md">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="font-medium">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-2"
                        onClick={() => {
                          setFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-muted-foreground">
                        Drag and drop your CSV file here, or click to browse
                      </p>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        className="max-w-xs"
                        onChange={handleFileChange}
                      />
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between mt-6 gap-4">
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
                
                <Button 
                  onClick={handleImport} 
                  disabled={!file || isProcessing}
                  className="flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 border-2 border-t-transparent border-primary-foreground rounded-full animate-spin mr-2"></div>
                      {isUploading ? 'Importing...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Invoices
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Help & Resources</CardTitle>
              <CardDescription>
                Information to help with your import
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">CSV Format</h4>
                  <p className="text-xs text-muted-foreground">
                    Your CSV file must include invoiceNumber, clientId, companyId, issueDate, dueDate and at least one item.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Client & Company IDs</h4>
                  <p className="text-xs text-muted-foreground">
                    Use the following client IDs in your CSV file:
                  </p>
                  <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                    {clients.slice(0, 3).map(client => (
                      <li key={client.id}>{client.name}: <code className="bg-muted p-0.5 rounded">{client.id}</code></li>
                    ))}
                    {clients.length > 3 && <li>+ {clients.length - 3} more clients</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <a href="/docs/invoice-import" target="_blank">
                  View Full Documentation
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Import Results */}
        {importResult && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Import Results</CardTitle>
              <CardDescription>
                {importResult.imported} imported successfully, {importResult.failed} failed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {importResult.results.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Successfully Imported
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {importResult.results.slice(0, 10).map((result: any) => (
                      <li key={result.id} className="bg-muted p-2 rounded flex justify-between">
                        <span>Invoice #{result.invoiceNumber}</span>
                        <span className="font-medium">{result.status}</span>
                      </li>
                    ))}
                    {importResult.results.length > 10 && (
                      <li className="text-center text-muted-foreground">
                        + {importResult.results.length - 10} more invoices
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {importResult.errors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    Failed to Import
                  </h3>
                  <ul className="space-y-1 text-sm">
                    {importResult.errors.map((error: any, index: number) => (
                      <li key={index} className="bg-red-50 text-red-800 p-2 rounded">
                        <span className="font-medium">Invoice #{error.invoiceNumber || 'Unknown'}</span>: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={() => router.push('/invoices')} className="w-full">
                Go to Invoices
              </Button>
            </CardFooter>
          </Card>
        )}
      </TabsContent>
      
      <TabsContent value="instructions">
        <Card>
          <CardHeader>
            <CardTitle>CSV Import Instructions</CardTitle>
            <CardDescription>
              How to prepare your CSV file for bulk importing invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Required Fields</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><code className="bg-muted p-1 rounded">invoiceNumber</code> - Unique invoice identifier</li>
                <li><code className="bg-muted p-1 rounded">clientId</code> - ID of the client for this invoice</li>
                <li><code className="bg-muted p-1 rounded">companyId</code> - ID of your company issuing the invoice</li>
                <li><code className="bg-muted p-1 rounded">issueDate</code> - Date the invoice was issued (YYYY-MM-DD)</li>
                <li><code className="bg-muted p-1 rounded">dueDate</code> - Payment due date (YYYY-MM-DD)</li>
                <li><code className="bg-muted p-1 rounded">item_1_description</code> - Description of the first item</li>
                <li><code className="bg-muted p-1 rounded">item_1_quantity</code> - Quantity of the first item</li>
                <li><code className="bg-muted p-1 rounded">item_1_unitPrice</code> - Unit price of the first item</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Optional Fields</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li><code className="bg-muted p-1 rounded">status</code> - Invoice status (DRAFT, ISSUED, VOIDED, CANCELLED)</li>
                <li><code className="bg-muted p-1 rounded">currency</code> - Currency code (USD, EUR, etc.)</li>
                <li><code className="bg-muted p-1 rounded">notes</code> - Additional notes for the invoice</li>
                <li><code className="bg-muted p-1 rounded">termsAndConditions</code> - Terms and conditions</li>
                <li><code className="bg-muted p-1 rounded">item_1_taxRate</code> - Tax rate for the first item (percentage)</li>
                <li><code className="bg-muted p-1 rounded">item_1_productId</code> - ID of a product (if applicable)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Multiple Items</h3>
              <p className="text-muted-foreground mb-2">
                For invoices with multiple items, add fields with incrementing numbers:
              </p>
              <ul className="list-disc pl-5">
                <li><code className="bg-muted p-1 rounded">item_1_description</code>, <code className="bg-muted p-1 rounded">item_1_quantity</code>, <code className="bg-muted p-1 rounded">item_1_unitPrice</code>, ...</li>
                <li><code className="bg-muted p-1 rounded">item_2_description</code>, <code className="bg-muted p-1 rounded">item_2_quantity</code>, <code className="bg-muted p-1 rounded">item_2_unitPrice</code>, ...</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <div className="flex items-center mb-2">
                <Info className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-base font-medium text-blue-800">Tip</h3>
              </div>
              <p className="text-blue-700 text-sm">
                The easiest way to get started is to download our template CSV file, which includes all the required columns and sample data. You can then modify it with your own data.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 bg-white"
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
} 