"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, Mail, Phone, Save, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCompanyBookLookup } from "@/hooks/useCompanyBookLookup";
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

  const previewName = form.watch("name");
  const previewBulstat = form.watch("bulstatNumber");
  const previewVat = form.watch("vatRegistrationNumber");
  const previewCity = form.watch("city");
  const previewCountry = form.watch("country");
  const previewMol = form.watch("mol");

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

  const handleCompanyBookSuccess = useCallback((fields: Record<string, unknown>) => {
    const fieldMap: Record<string, keyof ClientFormValues> = {
      name: "name",
      address: "address",
      city: "city",
      state: "state",
      zipCode: "zipCode",
      country: "country",
      bulstatNumber: "bulstatNumber",
      vatRegistered: "vatRegistered",
      vatRegistrationNumber: "vatRegistrationNumber",
      mol: "mol",
      email: "email",
      phone: "phone",
      uicType: "uicType",
    };

    let filledCount = 0;
    for (const [key, formKey] of Object.entries(fieldMap)) {
      const val = fields[key];
      if (val !== undefined && val !== "") {
        form.setValue(formKey, val as never, { shouldValidate: true, shouldDirty: true });
        filledCount++;
      }
    }

    toast.success("Данните са заредени", {
      description: `${filledCount} полета бяха автоматично попълнени от Търговския регистър.`,
    });
  }, [form]);

  const { lookup: lookupCompany, isLoading: isLookupLoading } = useCompanyBookLookup({
    onSuccess: handleCompanyBookSuccess,
    onError: (msg) => toast.error("Грешка при търсене", { description: msg }),
  });

  const handleEikLookup = useCallback(async () => {
    const eik = form.getValues("bulstatNumber")?.replace(/\D/g, "");
    if (!eik || eik.length < 9) {
      toast.error("Въведете ЕИК", { description: "Въведете поне 9 цифри в полето БУЛСТАТ/ЕИК преди търсене." });
      return;
    }
    await lookupCompany(eik);
  }, [form, lookupCompany]);

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
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || "Неуспешно обновяване на клиент");
      }

      toast.success("Клиентът е обновен успешно");
      router.push(`/clients/${params.id}`);
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Неуспешно обновяване на клиент";
      console.warn("Грешка при обновяване на клиент:", errorMessage);
      toast.error(errorMessage);
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
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-full px-3">
            <Link href={`/clients/${params.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Редактиране на клиент</h1>
            <p className="text-sm text-muted-foreground">По-компактна форма за контактни, адресни и данъчни данни.</p>
          </div>
        </div>
        <Button type="submit" form="edit-client-form" disabled={isLoading} className="rounded-full px-5">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Запазване..." : "Запази"}
        </Button>
      </div>

      {/* Quick EIK Lookup */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Search className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Бързо попълване по ЕИК</h3>
            <p className="text-xs text-muted-foreground">Въведете ЕИК/БУЛСТАТ и данните ще се попълнят автоматично от Търговския регистър</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Въведете ЕИК (напр. 204676177)"
            inputMode="numeric"
            className="h-11 flex-1"
            value={form.watch("bulstatNumber") || ""}
            onChange={(e) => form.setValue("bulstatNumber", e.target.value.replace(/\D/g, ""), { shouldValidate: true })}
          />
          <Button
            type="button"
            variant="default"
            className="h-11 px-4 shrink-0 gap-2"
            disabled={isLookupLoading || !(form.watch("bulstatNumber") || "").match(/^\d{9,13}$/)}
            onClick={handleEikLookup}
          >
            {isLookupLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Зареди данни
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form id="edit-client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle>Основни данни</CardTitle>
              <CardDescription>Контактна информация за клиента</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle>Адрес</CardTitle>
              <CardDescription>Адресни данни за фактуриране</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle>Данъчни данни</CardTitle>
              <CardDescription>Информация за идентификатори и ДДС</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        <div className="flex gap-2">
                          <NumericInput
                            allowDecimal={false}
                            inputMode="numeric"
                            placeholder="123456789"
                            className="h-11 flex-1"
                            value={field.value || ""}
                            onChange={(e) => field.onChange(digitsOnly(e.target.value))}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 px-3 shrink-0"
                            disabled={isLookupLoading || !field.value || field.value.length < 9}
                            onClick={handleEikLookup}
                            title="Зареди данни от Търговски регистър"
                          >
                            {isLookupLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                            <span className="hidden sm:inline ml-1.5">Зареди</span>
                          </Button>
                        </div>
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

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle>Кратък преглед</CardTitle>
              <CardDescription>Как изглеждат основните данни преди запис.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Клиент</p>
                <p className="mt-2 truncate text-sm font-semibold">{previewName || "Няма име"}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">ЕИК</p>
                <p className="mt-2 text-sm font-medium">{previewBulstat || "Няма"}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">ДДС</p>
                <p className="mt-2 text-sm font-medium">{previewVat || "Няма"}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Локация</p>
                <p className="mt-2 text-sm font-medium">{[previewCity, previewCountry].filter(Boolean).join(", ") || "Няма"}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/60 p-4 md:col-span-2 xl:col-span-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Представляващ</p>
                <p className="mt-2 text-sm font-medium">{previewMol || "Не е посочен МОЛ"}</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 border-t border-border/50 pt-1 sm:flex-row sm:justify-end">
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
