"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { DEFAULT_VAT_RATE } from "@/config/constants";

const preferencesSchema = z.object({
  // Основни настройки за ДДС
  defaultVatRate: z
    .number()
    .min(0, "ДДС не може да бъде отрицателно число")
    .max(100, "ДДС не може да бъде повече от 100%")
    .default(DEFAULT_VAT_RATE),
  
  // Настройки за срокове
  defaultPaymentTerm: z.number().min(0).default(30),
  defaultDueDateType: z.enum(["fixed", "after_issue"]).default("after_issue"),
  
  // Настройки за номерация
  invoicePrefix: z.string().max(10).optional(),
  resetNumberingYearly: z.boolean().default(true),
  
  // Настройки за валута
  defaultCurrency: z.string().default("BGN"),
  showAmountInWords: z.boolean().default(true),
  
  // Текстове по подразбиране
  defaultPaymentInstructions: z.string().max(500).optional(),
  defaultTermsAndConditions: z.string().max(1000).optional(),
  defaultNotes: z.string().max(500).optional(),
  
  // Визуални настройки
  showCompanyLogo: z.boolean().default(true),
  showQRCode: z.boolean().default(true),
  
  // Известия
  sendPaymentReminders: z.boolean().default(false),
  reminderDaysBeforeDue: z.number().min(1).default(7),
  sendThankYouEmails: z.boolean().default(false),
  
  // Архивиране
  autoArchiveAfterDays: z.number().min(0).default(365),
  keepDraftDays: z.number().min(1).default(30),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

export function InvoicePreferencesForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      defaultVatRate: DEFAULT_VAT_RATE,
      defaultPaymentTerm: 30,
      defaultDueDateType: "after_issue",
      resetNumberingYearly: true,
      defaultCurrency: "BGN",
      showAmountInWords: true,
      showCompanyLogo: true,
      showQRCode: true,
      sendPaymentReminders: false,
      reminderDaysBeforeDue: 7,
      sendThankYouEmails: false,
      autoArchiveAfterDays: 365,
      keepDraftDays: 30,
    },
  });

  async function onSubmit(data: PreferencesFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/invoice-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      toast.success("Настройките са запазени", {
        description: "Вашите предпочитания за фактури бяха успешно обновени.",
      });
      
      router.refresh();
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("Грешка при запазване", {
        description: "Възникна проблем при запазването на настройките. Моля, опитайте отново.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Основни настройки */}
        <div>
          <h3 className="text-lg font-medium">Основни настройки</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Настройте основните параметри за вашите фактури
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="defaultVatRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ДДС ставка по подразбиране (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете валута" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BGN">BGN - Български лев</SelectItem>
                      <SelectItem value="EUR">EUR - Евро</SelectItem>
                      <SelectItem value="USD">USD - Щатски долар</SelectItem>
                      <SelectItem value="GBP">GBP - Британска лира</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Валутата, която ще се използва по подразбиране за нови фактури
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Настройки за срокове */}
        <div>
          <h3 className="text-lg font-medium">Срокове за плащане</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Настройте сроковете за плащане по подразбиране
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="defaultPaymentTerm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Срок за плащане (дни)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Брой дни за плащане по подразбиране
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultDueDateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип на падежа</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="after_issue">След датата на издаване</SelectItem>
                      <SelectItem value="fixed">Фиксирана дата</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Как да се изчислява падежната дата
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Настройки за номерация */}
        <div>
          <h3 className="text-lg font-medium">Номерация на фактурите</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Настройте как да се генерират номерата на фактурите
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="invoicePrefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Префикс на фактурите</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Напр. INV-" />
                  </FormControl>
                  <FormDescription>
                    Незадължителен префикс преди номера на фактурата
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
        </div>

        <Separator />

        {/* Текстове по подразбиране */}
        <div>
          <h3 className="text-lg font-medium">Текстове по подразбиране</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Задайте стандартни текстове за вашите фактури
          </p>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="defaultPaymentInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Инструкции за плащане</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Въведете стандартни инструкции за плащане"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultTermsAndConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Общи условия</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Въведете стандартни общи условия"
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
                      placeholder="Въведете стандартни бележки"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Визуални настройки */}
        <div>
          <h3 className="text-lg font-medium">Визуални настройки</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Настройте как да изглеждат вашите фактури
          </p>

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
              name="showQRCode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      QR код за плащане
                    </FormLabel>
                    <FormDescription>
                      Добавяне на QR код за лесно плащане
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
        </div>

        <Separator />

        {/* Настройки за известия */}
        <div>
          <h3 className="text-lg font-medium">Известия</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Управлявайте автоматичните известия за фактурите
          </p>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="sendPaymentReminders"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Напомняния за плащане
                    </FormLabel>
                    <FormDescription>
                      Автоматично изпращане на напомняния преди падежа
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

            {form.watch("sendPaymentReminders") && (
              <FormField
                control={form.control}
                name="reminderDaysBeforeDue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дни преди падежа</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Колко дни преди падежа да се изпрати напомняне
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="sendThankYouEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Благодарствени имейли
                    </FormLabel>
                    <FormDescription>
                      Изпращане на благодарствен имейл след плащане
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
        </div>

        <Separator />

        {/* Настройки за архивиране */}
        <div>
          <h3 className="text-lg font-medium">Архивиране</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Управлявайте автоматичното архивиране на фактури
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="autoArchiveAfterDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Автоматично архивиране след (дни)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Брой дни след плащане, преди фактурата да се архивира
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
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Колко дни да се пазят черновите на фактури
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Запазване..." : "Запази настройките"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 