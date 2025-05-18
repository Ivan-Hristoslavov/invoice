"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Building, FileCheck, Flag, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Company schema with validation
const companySchema = z.object({
  // Basic Info
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  
  // Address
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  
  // Tax Information
  vatNumber: z.string().optional().or(z.literal("")),
  taxIdNumber: z.string().optional().or(z.literal("")),
  registrationNumber: z.string().optional().or(z.literal("")),
  
  // Bulgarian-specific fields
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mол: z.string().optional().or(z.literal("")),
  accountablePerson: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).default("BULSTAT"),
  
  // Banking Details
  bankName: z.string().optional().or(z.literal("")),
  bankAccount: z.string().optional().or(z.literal("")),
  bankSwift: z.string().optional().or(z.literal("")),
  bankIban: z.string().optional().or(z.literal("")),
  
  // Tax compliance system selection
  taxComplianceSystem: z.string().default("general"),
});

type CompanyFormValues = z.infer<typeof companySchema>;

type TaxComplianceSystem = "bulgarian" | "eu" | "general";

export default function NewCompanyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [taxSystem, setTaxSystem] = useState<TaxComplianceSystem>("general");
  const [showComplianceSelection, setShowComplianceSelection] = useState(true);

  // Initialize form with default values
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      vatNumber: "",
      taxIdNumber: "",
      registrationNumber: "",
      bulstatNumber: "",
      vatRegistered: false,
      vatRegistrationNumber: "",
      mол: "",
      accountablePerson: "",
      uicType: "BULSTAT",
      bankName: "",
      bankAccount: "",
      bankSwift: "",
      bankIban: "",
      taxComplianceSystem: "general",
    },
  });

  // Select tax compliance system
  const selectTaxSystem = (system: TaxComplianceSystem) => {
    setTaxSystem(system);
    form.setValue("taxComplianceSystem", system);
    
    // Set appropriate country defaults based on selection
    if (system === "bulgarian") {
      form.setValue("country", "Bulgaria");
    } else if (system === "eu") {
      // Keep country blank for EU, but could set other defaults
    }
    
    setShowComplianceSelection(false);
  };
  
  // Handle going back to tax system selection
  const backToTaxSelection = () => {
    setShowComplianceSelection(true);
  };

  // Handle form submission
  async function onSubmit(data: CompanyFormValues) {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create company");
      }

      toast.success("Company created", {
        description: "Your company has been created successfully."
      });
      
      router.push("/companies");
      router.refresh();
    } catch (error) {
      console.error("Error creating company:", error);
      toast.error("Error", {
        description: "There was an error creating your company. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Tax Compliance Selection Step
  if (showComplianceSelection) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/companies">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">New Company</h1>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Tax Compliance System</CardTitle>
            <CardDescription>
              Choose the tax compliance system that applies to your company
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bulgarian NAP Card */}
              <Card 
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                onClick={() => selectTaxSystem("bulgarian")}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="mb-4 p-3 rounded-full bg-primary/10">
                    <Flag className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Bulgarian Tax Authority (НАП)</h3>
                  <p className="text-sm text-muted-foreground">
                    Comply with Bulgarian НАП requirements for invoices and reporting
                  </p>
                </CardContent>
              </Card>
              
              {/* EU VAT Card */}
              <Card 
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                onClick={() => selectTaxSystem("eu")}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="mb-4 p-3 rounded-full bg-primary/10">
                    <FileCheck className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">European Union VAT</h3>
                  <p className="text-sm text-muted-foreground">
                    Standard EU VAT compliance for companies based in the European Union
                  </p>
                </CardContent>
              </Card>
              
              {/* General Card */}
              <Card 
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                onClick={() => selectTaxSystem("general")}
              >
                <CardContent className="p-6 flex flex-col items-center text-center">
                  <div className="mb-4 p-3 rounded-full bg-primary/10">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">General / International</h3>
                  <p className="text-sm text-muted-foreground">
                    Standard company details without specific regional tax compliance
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Form View after selecting tax system
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={backToTaxSelection}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tax Selection
          </Button>
          <h1 className="text-3xl font-bold">New Company</h1>
        </div>
        <Button 
          type="submit" 
          form="company-form" 
          disabled={isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save Company"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>
                Add your company information for invoices
              </CardDescription>
            </div>
            {taxSystem === "bulgarian" && (
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Bulgarian НАП
              </div>
            )}
            {taxSystem === "eu" && (
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                EU VAT
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="company-form" onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="address">Address</TabsTrigger>
                  <TabsTrigger value="tax">Tax Information</TabsTrigger>
                  <TabsTrigger value="banking">Banking</TabsTrigger>
                </TabsList>
                
                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@example.com" {...field} />
                          </FormControl>
                          <FormDescription>Company contact email for invoices</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                {/* Address Tab */}
                <TabsContent value="address" className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Business Ave" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal/ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                {/* Tax Information Tab */}
                <TabsContent value="tax" className="space-y-6 pt-4">
                  {/* General Tax Fields for All Systems */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="vatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT Number</FormLabel>
                          <FormControl>
                            <Input placeholder="EU VAT Number" {...field} />
                          </FormControl>
                          <FormDescription>For European businesses</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="taxIdNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Tax ID" {...field} />
                          </FormControl>
                          <FormDescription>Business tax identifier</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Company registration number" {...field} />
                          </FormControl>
                          <FormDescription>Official registration ID</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Bulgarian-specific Tax Fields */}
                  {taxSystem === "bulgarian" && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Bulgarian Tax Authority (НАП) Compliance</h3>
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="bulstatNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>БУЛСТАТ/ЕИК</FormLabel>
                              <FormControl>
                                <Input placeholder="Example: 123456789" {...field} />
                              </FormControl>
                              <FormDescription>
                                Unique Bulgarian company identifier
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="uicType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>UIC Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select UIC type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="BULSTAT">BULSTAT</SelectItem>
                                  <SelectItem value="EGN">EGN</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Type of identifier (BULSTAT or EGN)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-4">
                        <FormField
                          control={form.control}
                          name="vatRegistered"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Регистрация по ЗДДС</FormLabel>
                                <FormDescription>
                                  Компанията е регистрирана по ЗДДС
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="vatRegistrationNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>VAT Registration Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Example: BG123456789" {...field} />
                              </FormControl>
                              <FormDescription>
                                № по ЗДДС (Required if VAT registered)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-4">
                        <FormField
                          control={form.control}
                          name="mол"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>МОЛ (Представляващ)</FormLabel>
                              <FormControl>
                                <Input placeholder="Име на представляващия" {...field} />
                              </FormControl>
                              <FormDescription>
                                Материално отговорно лице / Представляващ компанията
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="accountablePerson"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Счетоводител</FormLabel>
                              <FormControl>
                                <Input placeholder="Име на счетоводителя" {...field} />
                              </FormControl>
                              <FormDescription>
                                Лице, отговорно за счетоводството
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* EU-specific Tax Fields */}
                  {taxSystem === "eu" && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">European Union VAT Compliance</h3>
                      <p className="text-muted-foreground mb-4">
                        Make sure your VAT number is correctly formatted and valid for VIES verification.
                      </p>
                      
                      {/* Additional EU-specific fields could be added here */}
                    </div>
                  )}
                </TabsContent>
                
                {/* Banking Details Tab */}
                <TabsContent value="banking" className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Bank of Example" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="bankAccount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Account Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Account number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bankSwift"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SWIFT/BIC Code</FormLabel>
                          <FormControl>
                            <Input placeholder="SWIFT/BIC code" {...field} />
                          </FormControl>
                          <FormDescription>International bank code</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="bankIban"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IBAN</FormLabel>
                        <FormControl>
                          <Input placeholder="International Bank Account Number" {...field} />
                        </FormControl>
                        <FormDescription>For international payments</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 