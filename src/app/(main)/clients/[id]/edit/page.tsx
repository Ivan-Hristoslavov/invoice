"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, Mail, Phone, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, NumericInput } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";

const clientSchema = z.object({
  name: z.string().min(1, "Името на клиента е задължително"),
  email: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().email("Моля, въведете валиден имейл").optional()
  ),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().min(1, "Адресът е задължителен"),
  city: z.string().min(1, "Градът е задължителен"),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mol: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).default("BULSTAT"),
  locale: z.string().default("bg"),
});

type ClientFormValues = z.infer<typeof clientSchema>;

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(true);

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
      bulstatNumber: "",
      vatRegistered: false,
      vatRegistrationNumber: "",
      mol: "",
      uicType: "BULSTAT",
      locale: "bg",
    },
  });

  useEffect(() => {
    async function fetchClient() {
      try {
        const response = await fetch(`/api/clients/${params.id}`);

        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Клиентът не е намерен");
            router.push("/clients");
            return;
          }

          throw new Error("Грешка при зареждане на клиента");
        }

        const client = await response.json();

        form.reset({
          name: client.name || "",
          email: client.email || "",
          phone: client.phone || "",
          address: client.address || "",
          city: client.city || "",
          state: client.state || "",
          zipCode: client.zipCode || "",
          country: client.country || "България",
          bulstatNumber: client.bulstatNumber || "",
          vatRegistered: client.vatRegistered || false,
          vatRegistrationNumber: client.vatRegistrationNumber || "",
          mol: client.mol || "",
          uicType: client.uicType || "BULSTAT",
          locale: client.locale || "bg",
        });
      } catch (error) {
        console.error("Грешка при зареждане на клиента:", error);
        toast.error("Неуспешно зареждане на клиента");
      } finally {
        setIsLoadingClient(false);
      }
    }

    fetchClient();
  }, [form, params.id, router]);

  async function onSubmit(data: ClientFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Неуспешно обновяване на клиент");
      }

      toast.success("Клиентът е обновен успешно");
      router.push(`/clients/${params.id}`);
      router.refresh();
    } catch (error) {
      console.error("Грешка при обновяване на клиент:", error);
      toast.error("Неуспешно обновяване на клиент");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingClient) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          Зареждане...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="back-btn rounded-full px-3">
          <Link href={`/clients/${params.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Link>
        </Button>
        <div>
          <h1 className="page-title">Редактиране на клиент</h1>
          <p className="card-description">Обновете данните на клиента</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основни данни</CardTitle>
              <CardDescription>Контактна информация за клиента</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Име на клиента</FormLabel>
                    <FormControl>
                      <Input placeholder="напр. Фирма ООД" className="h-11" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Имейл
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="client@example.com" className="h-11" {...field} />
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
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Телефон
                      </FormLabel>
                      <FormControl>
                        <NumericInput
                          allowDecimal={false}
                          inputMode="numeric"
                          placeholder="0888123456"
                          className="h-11"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(digitsOnly(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Само цифри</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Адрес</CardTitle>
              <CardDescription>Адресни данни за фактуриране</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Адрес</FormLabel>
                    <FormControl>
                      <Input placeholder="ул. Пример 123" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Град</FormLabel>
                      <FormControl>
                        <Input placeholder="София" className="h-11" {...field} />
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
                        <Input placeholder="София-град" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пощенски код</FormLabel>
                      <FormControl>
                        <NumericInput
                          allowDecimal={false}
                          inputMode="numeric"
                          placeholder="1000"
                          className="h-11"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(digitsOnly(e.target.value))}
                        />
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
                        <Input placeholder="България" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Данъчни данни</CardTitle>
              <CardDescription>Информация за идентификатори и ДДС</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="bulstatNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        БУЛСТАТ/ЕИК
                      </FormLabel>
                      <FormControl>
                        <NumericInput
                          allowDecimal={false}
                          inputMode="numeric"
                          placeholder="123456789"
                          className="h-11"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(digitsOnly(e.target.value))}
                        />
                      </FormControl>
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Изберете тип" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BULSTAT">БУЛСТАТ</SelectItem>
                          <SelectItem value="EGN">ЕГН</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="vatRegistered"
                  render={({ field }) => (
                    <FormItem className={`flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 ${field.value ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Регистрация по ЗДДС"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Регистрация по ЗДДС</FormLabel>
                        <FormDescription>Клиентът е регистриран по ЗДДС</FormDescription>
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
                        <Input placeholder="BG123456789" className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="mol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>МОЛ</FormLabel>
                    <FormControl>
                      <Input placeholder="Име на представляващия" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href={`/clients/${params.id}`}>Отказ</Link>
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              <Save className="h-4 w-4" />
              {isLoading ? "Запазване..." : "Запази промените"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
