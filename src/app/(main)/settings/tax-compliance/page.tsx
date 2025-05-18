import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

export default function TaxCompliancePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tax Compliance</h1>
      </div>
      
      <Tabs defaultValue="bulgaria">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <TabsTrigger value="bulgaria">Bulgaria (НАП)</TabsTrigger>
          <TabsTrigger value="eu">European Union</TabsTrigger>
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
        </TabsList>
        
        <TabsContent value="bulgaria" className="space-y-6 pt-4">
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Bulgarian Tax Compliance Information</AlertTitle>
            <AlertDescription>
              This page explains the compliance requirements for invoices according to the Bulgarian National Revenue Agency (НАП).
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Bulgarian Invoice Requirements (НАП)</CardTitle>
              <CardDescription>
                Legal requirements for invoices issued to Bulgarian customers according to the Value Added Tax Act (ЗДДС)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">Mandatory Elements on Invoices:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Full legal name and address of the seller (company issuing the invoice)</li>
                <li>BULSTAT/EIK (company registration number) of the seller</li>
                <li>VAT identification number (if VAT registered) with BG prefix</li>
                <li>Full legal name and address of the buyer</li>
                <li>BULSTAT/EIK of the buyer (if applicable)</li>
                <li>VAT identification number of the buyer (if applicable)</li>
                <li>Invoice number (sequential and unique within the calendar year)</li>
                <li>Invoice date</li>
                <li>Date of tax event (date of supply or service delivery)</li>
                <li>Place of issue of the invoice</li>
                <li>Description of the goods or services</li>
                <li>Unit price, quantity, and net amount</li>
                <li>VAT rate and VAT amount</li>
                <li>Total invoice amount</li>
                <li>Payment terms and method</li>
                <li>MOL (Материално отговорно лице) - authorized person's name</li>
                <li>Special clauses for exempt supplies or special taxation regimes (if applicable)</li>
                <li>Clear indication if it's an original invoice or a duplicate</li>
              </ul>
              
              <h3 className="font-semibold mt-6">Electronic Invoicing Requirements:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Electronic invoices must contain the same information as paper invoices</li>
                <li>Electronic invoices must ensure authenticity of origin, integrity of content, and legibility</li>
                <li>For invoices above 10,000 BGN, electronic submission to НАП is required</li>
                <li>A qualified electronic signature may be required for certain electronic invoices</li>
                <li>Electronic invoices must be stored in their original format</li>
              </ul>
              
              <h3 className="font-semibold mt-6">Invoice Numbering:</h3>
              <p>
                Bulgarian invoices must follow a specific numbering format that is sequential within each calendar year. Our system automatically generates numbers in the format:
              </p>
              <pre className="bg-slate-100 dark:bg-slate-800 p-2 rounded mt-2">
                YYCCCCNNNNNNИ
              </pre>
              <p className="text-sm mt-2">
                Where:<br />
                YY = Last two digits of the year<br />
                CCCC = Last four digits of your BULSTAT/EIK<br />
                NNNNNN = Sequential number (reset at the beginning of each year)<br />
                И = Type letter ("И" for invoices, "К" for credit notes, "Д" for debit notes)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Reporting Requirements</CardTitle>
              <CardDescription>
                Key requirements for VAT reporting to НАП (National Revenue Agency)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="font-semibold">VAT Returns (Декларация по ДДС):</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Monthly VAT returns must be filed by the 14th of the following month</li>
                <li>VAT payments must be made by the same deadline</li>
                <li>VAT returns must be filed electronically through the НАП e-services portal</li>
                <li>All invoices above 10,000 BGN must be reported in detail</li>
              </ul>
              
              <h3 className="font-semibold mt-6">Sales and Purchase Ledgers:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Sales and purchase ledgers must be maintained and submitted with VAT returns</li>
                <li>Ledgers must include a detailed breakdown of all invoices</li>
                <li>Electronic submission is mandatory</li>
              </ul>
              
              <h3 className="font-semibold mt-6">VIES Declarations:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>VIES declarations for intra-EU supplies must be submitted monthly</li>
                <li>Declaration deadline is the 14th of the following month</li>
                <li>Must include details of all supplies to EU VAT-registered customers</li>
              </ul>
              
              <Alert className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Important Note</AlertTitle>
                <AlertDescription>
                  Late submission of VAT returns or inaccurate reporting can result in significant penalties ranging from 500 to 10,000 BGN. Ensure all documentation is complete and submitted on time.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Record Keeping Requirements</CardTitle>
              <CardDescription>
                Legal requirements for invoice storage and retention
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc pl-6 space-y-2">
                <li>All invoices must be kept for at least 10 years from the end of the year of issue</li>
                <li>Invoices must be stored in their original format (paper or electronic)</li>
                <li>For electronic invoices, backups must be maintained</li>
                <li>Storage must allow quick and easy access upon request by tax authorities</li>
                <li>Documents must be preserved with all original data intact</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Official Resources</CardTitle>
              <CardDescription>
                Links to official Bulgarian tax authorities and regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <ExternalLink className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <a href="https://nra.bg/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                      National Revenue Agency (НАП)
                    </a>
                    <p className="text-sm text-gray-500">Official website of the Bulgarian tax authority</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <ExternalLink className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <a href="https://www.lex.bg/laws/ldoc/2135533201" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                      Value Added Tax Act (ЗДДС)
                    </a>
                    <p className="text-sm text-gray-500">Full text of the Bulgarian VAT legislation</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <ExternalLink className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <a href="https://www.minfin.bg/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline font-medium">
                      Ministry of Finance
                    </a>
                    <p className="text-sm text-gray-500">Official website of the Bulgarian Ministry of Finance</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="eu" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>EU VAT Compliance</CardTitle>
              <CardDescription>
                Information about EU-wide VAT requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>EU VAT compliance information will be added in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="global" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Tax Compliance</CardTitle>
              <CardDescription>
                Information about international tax requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Global tax compliance information will be added in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="setup" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Setup Guide</CardTitle>
              <CardDescription>
                Step-by-step guide to configuring tax compliance in the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center">
                  <span className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm mr-2">1</span>
                  Set up your company details
                </h3>
                <p className="mt-2 text-sm">
                  Go to <Link href="/settings/company" className="text-blue-500 hover:underline">Company Settings</Link> and ensure all required fields are completed, especially tax identification numbers.
                </p>
              </div>
              
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center">
                  <span className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm mr-2">2</span>
                  Configure Bulgarian tax settings
                </h3>
                <p className="mt-2 text-sm">
                  For Bulgarian invoices, make sure to fill in the Bulgarian-specific fields:
                </p>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>BULSTAT/EIK number</li>
                  <li>VAT registration number (if applicable)</li>
                  <li>MOL (Материално отговорно лице)</li>
                  <li>Default place of issue</li>
                </ul>
              </div>
              
              <div className="rounded-lg border p-4">
                <h3 className="font-semibold flex items-center">
                  <span className="flex h-6 w-6 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm mr-2">3</span>
                  Create invoices with proper tax settings
                </h3>
                <p className="mt-2 text-sm">
                  When creating invoices, select BGN as the currency to activate all Bulgarian tax compliance features automatically:
                </p>
                <ul className="list-disc pl-6 mt-2 text-sm space-y-1">
                  <li>Invoice numbers will follow the НАП-compliant format</li>
                  <li>All required fields for Bulgarian invoices will be displayed</li>
                  <li>PDFs will be generated in the correct Bulgarian format</li>
                </ul>
              </div>
              
              <Alert className="mt-4" variant="default">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Ready for compliance</AlertTitle>
                <AlertDescription>
                  Once you've completed these steps, your system will be configured for Bulgarian tax compliance. Remember to keep your invoice records for at least 10 years as required by law.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 