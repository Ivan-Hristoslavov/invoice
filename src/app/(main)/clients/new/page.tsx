"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
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
  name: z.string().min(1, "Името на клиента е задължително"),
  email: z.string().email("Моля, въведете валиден имейл").optional().or(z.literal("")),
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
  
  locale: z.string().default("bg"),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
      country: "България",
      vatNumber: "",
      taxIdNumber: "",
      
      // Bulgarian-specific fields
      bulstatNumber: "",
      vatRegistered: false,
      vatRegistrationNumber: "",
      mол: "",
      uicType: "BULSTAT",
      
      locale: "bg",
    },
  });

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
        throw new Error("Неуспешно създаване на клиент");
      }

      toast.success("Клиентът е създаден", {
        description: "Вашият клиент беше създаден успешно.",
      });

      router.push("/clients");
    } catch (error) {
      console.error("Грешка при създаване на клиент:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при създаване на клиента. Моля, опитайте отново.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
            <Link href="/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Назад</span>
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold truncate">Нов клиент</h1>
        </div>
        <Button 
          type="submit" 
          form="client-form" 
          disabled={isLoading}
          className="w-full sm:w-auto flex-shrink-0"
        >
          <Save className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{isLoading ? "Запазване..." : "Запази клиент"}</span>
          <span className="sm:hidden">{isLoading ? "Запазване..." : "Запази"}</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Данни за клиента</CardTitle>
              <CardDescription>
                Добавете информация за вашия клиент
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <div className="overflow-x-auto -mx-6 px-6">
                  <TabsList className="inline-flex w-full min-w-max sm:grid sm:grid-cols-3">
                    <TabsTrigger value="basic" className="whitespace-nowrap text-xs sm:text-sm">Основна</TabsTrigger>
                    <TabsTrigger value="address" className="whitespace-nowrap text-xs sm:text-sm">Адрес</TabsTrigger>
                    <TabsTrigger value="tax" className="whitespace-nowrap text-xs sm:text-sm">Данъчна</TabsTrigger>
                  </TabsList>
                </div>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Име на клиента</FormLabel>
                        <FormControl>
                          <Input placeholder="напр., Фирма ООД" {...field} />
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
                          <FormLabel>Имейл</FormLabel>
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
                          <FormLabel>Телефон</FormLabel>
                          <FormControl>
                            <Input placeholder="+359 888 123 456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Address Tab */}
                <TabsContent value="address" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Адрес</FormLabel>
                        <FormControl>
                          <Input placeholder="ул. Пример 123" {...field} />
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
                  </div>

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
                </TabsContent>

                {/* Tax Info Tab */}
                <TabsContent value="tax" className="space-y-4 pt-4">
                  {/* Tax Fields */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="vatNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ДДС номер</FormLabel>
                          <FormControl>
                            <Input placeholder="ДДС номер" {...field} />
                          </FormControl>
                          <FormDescription>
                            Номер по ДДС (ако има такъв)
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
                          <FormLabel>Данъчен номер</FormLabel>
                          <FormControl>
                            <Input placeholder="Данъчен номер" {...field} />
                          </FormControl>
                          <FormDescription>
                            За идентификация на бизнеса
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Данъчни полета за НАП</h3>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                              Уникален български идентификатор
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
                            <FormLabel>Тип на идентификатора</FormLabel>
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
                            <FormLabel>ДДС номер</FormLabel>
                            <FormControl>
                              <Input placeholder="Например: BG123456789" {...field} />
                            </FormControl>
                            <FormDescription>
                              № по ЗДДС (Задължително ако е регистриран по ДДС)
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
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 