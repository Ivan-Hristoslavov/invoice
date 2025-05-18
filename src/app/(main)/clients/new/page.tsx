"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Flag, FileCheck, Globe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

// Define validation schema for client
const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
  taxIdNumber: z.string().optional().or(z.literal("")),
  
  // Bulgarian-specific fields
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mол: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).default("BULSTAT"),
  
  locale: z.string().default("en"),
  
  // Tax compliance system selection
  taxComplianceSystem: z.string().default("general"),
});

type ClientFormValues = z.infer<typeof clientSchema>;

type TaxComplianceSystem = "bulgarian" | "eu" | "general";

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [taxSystem, setTaxSystem] = useState<TaxComplianceSystem>("general");
  const [showComplianceSelection, setShowComplianceSelection] = useState(true);

  // Form setup
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
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
      
      // Bulgarian-specific fields
      bulstatNumber: "",
      vatRegistered: false,
      vatRegistrationNumber: "",
      mол: "",
      uicType: "BULSTAT",
      
      locale: "en",
      taxComplianceSystem: "general",
    },
  });
  
  // Select tax compliance system
  const selectTaxSystem = (system: TaxComplianceSystem) => {
    setTaxSystem(system);
    form.setValue("taxComplianceSystem", system);
    
    // Set appropriate country and locale defaults based on selection
    if (system === "bulgarian") {
      form.setValue("country", "Bulgaria");
      form.setValue("locale", "bg");
    } else if (system === "eu") {
      // Keep country blank for EU
      form.setValue("locale", "en");
    }
    
    setShowComplianceSelection(false);
  };
  
  // Handle going back to tax system selection
  const backToTaxSelection = () => {
    setShowComplianceSelection(true);
  };

  // Form submission handler
  async function onSubmit(data: ClientFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create client");
      }

      toast.success("Client created", {
        description: "Your client has been created successfully.",
      });

      router.push("/clients");
      router.refresh();
    } catch (error) {
      console.error("Error creating client:", error);
      toast.error("Error", {
        description: "There was an error creating your client. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  // Tax Compliance Selection Step
  if (showComplianceSelection) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/clients">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">New Client</h1>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Client's Tax System</CardTitle>
            <CardDescription>
              Choose the tax compliance system that applies to this client
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
                  <h3 className="text-lg font-semibold mb-2">Bulgarian Client</h3>
                  <p className="text-sm text-muted-foreground">
                    Client with Bulgarian НАП requirements for invoicing
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
                  <h3 className="text-lg font-semibold mb-2">EU Client</h3>
                  <p className="text-sm text-muted-foreground">
                    Client from the European Union with VAT requirements
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
                  <h3 className="text-lg font-semibold mb-2">International Client</h3>
                  <p className="text-sm text-muted-foreground">
                    Client without specific regional tax requirements
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={backToTaxSelection}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tax Selection
          </Button>
          <h1 className="text-3xl font-bold">New Client</h1>
        </div>
        <Button type="submit" form="client-form" disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save Client"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Client Details</CardTitle>
              <CardDescription>
                Add information about your client
              </CardDescription>
            </div>
            {taxSystem === "bulgarian" && (
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                Bulgarian Client
              </div>
            )}
            {taxSystem === "eu" && (
              <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                EU Client
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="address">Address</TabsTrigger>
                  <TabsTrigger value="tax">Tax Info</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Acme Corporation" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="client@example.com" {...field} />
                          </FormControl>
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

                  <FormField
                    control={form.control}
                    name="locale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Locale</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select locale" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="bg">Bulgarian</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Preferred language for client communications
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Address Tab */}
                <TabsContent value="address" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Business St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  </div>

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
                </TabsContent>

                {/* Tax Info Tab */}
                <TabsContent value="tax" className="space-y-4 pt-4">
                  {/* Common Tax Fields */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="vatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VAT Number</FormLabel>
                          <FormControl>
                            <Input placeholder="VAT Number" {...field} />
                          </FormControl>
                          <FormDescription>
                            For European businesses
                          </FormDescription>
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
                            <Input placeholder="Tax ID Number" {...field} />
                          </FormControl>
                          <FormDescription>
                            For business identification
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Bulgarian NAP Fields */}
                  {taxSystem === "bulgarian" && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Bulgarian Tax Authority (НАП) Fields</h3>
                      
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                Unique Bulgarian identifier
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
                      
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
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
                                  Клиентът е регистриран по ЗДДС
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
                              <FormLabel>ДДС Номер</FormLabel>
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
                              Материално отговорно лице / Представляващ
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  {/* EU-specific Tax Fields */}
                  {taxSystem === "eu" && (
                    <div className="mt-8 border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">European Union VAT Information</h3>
                      <p className="text-muted-foreground mb-4">
                        Make sure the VAT number is correctly formatted with the country prefix (e.g., DE123456789) for VIES verification.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 