"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Building, FileCheck } from "lucide-react";
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
  name: z.string().min(1, "Името на компанията е задължително"),
  email: z.string().email("Моля, въведете валиден имейл").optional().or(z.literal("")),
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
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function NewCompanyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
      country: "България",
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
    },
  });

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
        throw new Error("Неуспешно създаване на компания");
      }

      toast.success("Компанията е създадена", {
        description: "Вашата компания беше създадена успешно."
      });
      
      router.push("/companies");
    } catch (error) {
      console.error("Грешка при създаване на компания:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при създаване на вашата компания. Моля, опитайте отново."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
            <Link href="/companies">
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Назад</span>
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Нова компания</h1>
        </div>
        <Button 
          type="submit" 
          form="company-form" 
          disabled={isLoading}
          className="w-full sm:w-auto flex-shrink-0"
        >
          <Save className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">{isLoading ? "Запазване..." : "Запази компания"}</span>
          <span className="sm:hidden">{isLoading ? "Запазване..." : "Запази"}</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Данни за компанията</CardTitle>
              <CardDescription>
                Добавете информацията за вашата компания за фактури
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="company-form" onSubmit={form.handleSubmit(onSubmit)}>
              <Tabs defaultValue="basic" className="w-full">
                <div className="overflow-x-auto -mx-6 px-6">
                  <TabsList className="inline-flex w-full min-w-max sm:grid sm:grid-cols-4">
                    <TabsTrigger value="basic" className="whitespace-nowrap text-xs sm:text-sm">Основна</TabsTrigger>
                    <TabsTrigger value="address" className="whitespace-nowrap text-xs sm:text-sm">Адрес</TabsTrigger>
                    <TabsTrigger value="tax" className="whitespace-nowrap text-xs sm:text-sm">Данъчна</TabsTrigger>
                    <TabsTrigger value="banking" className="whitespace-nowrap text-xs sm:text-sm">Банкова</TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Име на компанията</FormLabel>
                        <FormControl>
                          <Input placeholder="Фирма ООД" {...field} />
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
                          <FormLabel>Имейл</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@example.com" {...field} />
                          </FormControl>
                          <FormDescription>Имейл за контакт за фактури</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон</FormLabel>
                          <FormControl>
                            <Input placeholder="+359 2 123 4567" {...field} />
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
                        <FormLabel>Адрес</FormLabel>
                        <FormControl>
                          <Input placeholder="ул. Бизнес 123" {...field} />
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
                          <FormLabel>Град</FormLabel>
                          <FormControl>
                            <Input placeholder="Град" {...field} />
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
                          <FormLabel>Област</FormLabel>
                          <FormControl>
                            <Input placeholder="Област" {...field} />
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
                          <FormLabel>Пощенски код</FormLabel>
                          <FormControl>
                            <Input placeholder="1000" {...field} />
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
                          <FormLabel>Държава</FormLabel>
                          <FormControl>
                            <Input placeholder="България" value="България" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                {/* Tax Information Tab */}
                <TabsContent value="tax" className="space-y-6 pt-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="vatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ДДС номер</FormLabel>
                          <FormControl>
                            <Input placeholder="BG123456789" {...field} />
                          </FormControl>
                          <FormDescription>ДДС номер на компанията</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="taxIdNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Данъчен номер</FormLabel>
                          <FormControl>
                            <Input placeholder="Данъчен номер" {...field} />
                          </FormControl>
                          <FormDescription>Бизнес данъчен идентификатор</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="registrationNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Регистрационен номер</FormLabel>
                          <FormControl>
                            <Input placeholder="Регистрационен номер на компанията" {...field} />
                          </FormControl>
                          <FormDescription>Официален регистрационен номер</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Информация за НАП</h3>
                    
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="bulstatNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>БУЛСТАТ/ЕИК</FormLabel>
                            <FormControl>
                              <Input placeholder="Например: 123456789" {...field} />
                            </FormControl>
                            <FormDescription>
                              Уникален български фирмен идентификатор
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
                            <FormLabel>Тип идентификатор</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Изберете тип" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="BULSTAT">БУЛСТАТ</SelectItem>
                                <SelectItem value="EGN">ЕГН</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Тип на идентификатора (БУЛСТАТ или ЕГН)
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
                            <FormLabel>ДДС номер</FormLabel>
                            <FormControl>
                              <Input placeholder="Например: BG123456789" {...field} />
                            </FormControl>
                            <FormDescription>
                              № по ЗДДС (Задължително, ако е регистрирана по ДДС)
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
                </TabsContent>
                
                {/* Banking Details Tab */}
                <TabsContent value="banking" className="space-y-6 pt-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Име на банката</FormLabel>
                        <FormControl>
                          <Input placeholder="Банка Пример" {...field} />
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
                          <FormLabel>Номер на сметка</FormLabel>
                          <FormControl>
                            <Input placeholder="Номер на сметка" {...field} />
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
                          <FormLabel>SWIFT/BIC код</FormLabel>
                          <FormControl>
                            <Input placeholder="SWIFT/BIC код" {...field} />
                          </FormControl>
                          <FormDescription>Международен банков код</FormDescription>
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
                          <Input placeholder="Международен номер на банкова сметка" {...field} />
                        </FormControl>
                        <FormDescription>За международни плащания</FormDescription>
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