"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input, NumericInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import { toast } from "@/lib/toast";
import { DEFAULT_VAT_RATE } from "@/config/constants";

const preferencesSchema = z.object({
  // Основни настройки за ДДС
  defaultVatRate: z
    .number()
    .min(0, "ДДС не може да бъде отрицателно число")
    .max(100, "ДДС не може да бъде повече от 100%")
    .default(DEFAULT_VAT_RATE),
  
  // Настройки за номерация
  invoicePrefix: z.string().max(10).optional(),
  resetNumberingYearly: z.boolean().default(true),
  startingInvoiceNumber: z
    .number()
    .int()
    .min(1, "Началният номер трябва да е поне 1")
    .max(9999999999, "Началният номер не може да надхвърля 9999999999")
    .optional(),
  
  // Настройки за валута
  defaultCurrency: z.string().default("EUR"),
  showAmountInWords: z.boolean().default(true),
  
  // Текстове по подразбиране
  defaultTermsAndConditions: z.string().max(1000).optional(),
  defaultNotes: z.string().max(500).optional(),
  
  // Визуални настройки
  showCompanyLogo: z.boolean().default(true),
  
  // Архивиране
  autoArchiveAfterDays: z.number().min(0).default(365),
  keepDraftDays: z.number().min(1).default(30),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

export function InvoicePreferencesForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);

  const form = useForm<PreferencesFormValues, unknown, PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema) as any,
    defaultValues: {
      defaultVatRate: DEFAULT_VAT_RATE,
      resetNumberingYearly: true,
      defaultCurrency: "EUR",
      showAmountInWords: true,
      showCompanyLogo: true,
      autoArchiveAfterDays: 365,
      keepDraftDays: 30,
    },
  });

  // Load default values from API
  useEffect(() => {
    async function loadDefaults() {
      try {
        const response = await fetch("/api/settings/invoice-preferences");
        if (response.ok) {
          const data = await response.json();
          form.reset({
            defaultVatRate: data.defaultVatRate ?? DEFAULT_VAT_RATE,
            invoicePrefix: data.invoicePrefix ?? "",
            resetNumberingYearly: data.resetNumberingYearly ?? true,
            startingInvoiceNumber: data.startingInvoiceNumber ?? undefined,
            defaultCurrency: data.defaultCurrency ?? "EUR",
            showAmountInWords: data.showAmountInWords ?? true,
            defaultTermsAndConditions: data.defaultTermsAndConditions ?? "",
            defaultNotes: data.defaultNotes ?? "",
            showCompanyLogo: data.showCompanyLogo ?? true,
            autoArchiveAfterDays: data.autoArchiveAfterDays ?? 365,
            keepDraftDays: data.keepDraftDays ?? 30,
          });
        }
      } catch (error) {
        console.error("Error loading invoice preferences:", error);
      } finally {
        setIsLoadingDefaults(false);
      }
    }

    loadDefaults();
  }, [form]);

  async function onSubmit(data: PreferencesFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/invoice-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          startingInvoiceNumber:
            data.startingInvoiceNumber === undefined ||
            data.startingInvoiceNumber === null ||
            Number.isNaN(data.startingInvoiceNumber)
              ? null
              : data.startingInvoiceNumber,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Неуспешно запазване");
      }

      toast.success("Настройките са запазени", {
        description: "Промените са записани в базата данни.",
      });

      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Моля, опитайте отново.";
      console.error("Error saving preferences:", error);
      toast.error("Грешка при запазване", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingDefaults) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Зареждане на настройки...</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <section className="rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-6 dark:bg-muted/10">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Основни стойности
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="defaultVatRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ДДС ставка по подразбиране (%)</FormLabel>
                  <FormControl>
                    <NumericInput
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="min-h-11 rounded-2xl text-sm"
                    />
                  </FormControl>
                  <FormDescription>
                    Тази стойност ще бъде използвана по подразбиране за всички нови продукти и артикули
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultCurrency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Валута по подразбиране</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="min-h-11 rounded-2xl text-sm">
                        <SelectValue placeholder="Изберете валута" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BGN">BGN - Лев</SelectItem>
                      <SelectItem value="EUR">EUR - Евро</SelectItem>
                      <SelectItem value="USD">USD - Долар</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Валутата, която ще се използва по подразбиране за нови фактури
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </section>

        <Separator className="bg-border/60" />

        <section className="rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-6 dark:bg-muted/10">
          <h3 className="text-base font-semibold tracking-tight">Номерация на фактурите</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            По желание буквен префикс (напр. <span className="font-mono text-foreground">Ф-</span>,{" "}
            <span className="font-mono text-foreground">ФАК-</span>), годишно нулиране и начален номер при миграция.
            Същинският номер на фактурата е цифров и последователен.
          </p>
          <div className="mb-4 flex gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm text-foreground/90 dark:bg-primary/10">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <p className="m-0 leading-relaxed">
              Тук задавате как да изглежда номерът на следващата фактура. При създаване на фактура виждате
              преглед на номера; промяната на префикса не влияе на вече издадени документи.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="invoicePrefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Префикс на фактурите</FormLabel>
                  <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Напр. Ф- или ФАК-"
                    className="min-h-11 rounded-2xl text-sm"
                  />
                  </FormControl>
                  <FormDescription>
                    Незадължителен текст преди цифровия номер (често срещани: <span className="font-mono">Ф-</span>,{" "}
                    <span className="font-mono">ФАК-</span>). Оставете празно, ако искате само номер без букви отпред.
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resetNumberingYearly"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Нулиране на номерация годишно
                    </FormLabel>
                    <FormDescription>
                      Започване на номерацията от 1 всяка нова година
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="startingInvoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Начален номер на фактура (за миграция)</FormLabel>
                <FormControl>
                  <NumericInput
                    allowDecimal={false}
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Напр. 1 за 0000000001"
                    className="min-h-11 rounded-2xl text-sm"
                  />
                </FormControl>
                <FormDescription>
                  Задайте начален номер, ако мигрирате от друга система. Следващите фактури ще започват от този номер. Формат: 10 цифри (0000000001, 0000000002, ...)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <Separator className="bg-border/60" />

        <section className="rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-6 dark:bg-muted/10">
          <h3 className="text-base font-semibold tracking-tight">Текстове по подразбиране</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Общи условия и бележки за нови фактури
          </p>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="defaultTermsAndConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Общи условия</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Въведете стандартни общи условия"
                    className="rounded-2xl text-sm"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Бележки</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Въведете стандартни бележки"
                    className="rounded-2xl text-sm"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        <Separator className="bg-border/60" />

        <section className="rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-6 dark:bg-muted/10">
          <h3 className="text-base font-semibold tracking-tight">Визуални настройки</h3>
          <p className="mb-4 text-sm text-muted-foreground">Лого и сума с думи в PDF</p>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="showCompanyLogo"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Показване на фирмено лого
                    </FormLabel>
                    <FormDescription>
                      Добавяне на вашето лого във фактурите
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="showAmountInWords"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Сума с думи
                    </FormLabel>
                    <FormDescription>
                      Показване на сумата, изписана с думи
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        <Separator className="bg-border/60" />

        <section className="rounded-2xl border border-border/40 bg-muted/20 p-4 sm:p-6 dark:bg-muted/10">
          <h3 className="text-base font-semibold tracking-tight">Архивиране и чернови</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Периоди за автоматично архивиране и съхранение на чернови
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="autoArchiveAfterDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Автоматично архивиране след (дни)</FormLabel>
                  <FormControl>
                    <NumericInput
                      allowDecimal={false}
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    className="min-h-11 rounded-2xl text-sm"
                    />
                  </FormControl>
                  <FormDescription>
                    Брой дни след издаване, преди фактурата да се архивира
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keepDraftDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Съхранение на чернови (дни)</FormLabel>
                  <FormControl>
                    <NumericInput
                      allowDecimal={false}
                      {...field}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    className="min-h-11 rounded-2xl text-sm"
                    />
                  </FormControl>
                  <FormDescription>
                    Колко дни да се пазят черновите на фактури
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </section>

        <div className="flex justify-center border-t border-border/50 pt-2 sm:justify-end">
          <Button
            type="submit"
            loading={isLoading}
            disabled={isLoading}
            className="min-w-[200px] rounded-2xl border-0 gradient-primary"
          >
            Запази настройките
          </Button>
        </div>
      </form>
    </Form>
  );
} 