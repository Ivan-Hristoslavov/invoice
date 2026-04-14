"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  Package,
  DollarSign,
  FileText,
  Tag,
  Ruler,
  Percent,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useAsyncLock } from "@/hooks/use-async-lock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, NumericInput } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { applyApiValidationDetails } from "@/lib/form-errors";
import { FIELD_LIMITS } from "@/lib/validations/field-limits";
import { grossToNetAmount, roundMoney2 } from "@/lib/money-vat";

const PRODUCT_UNITS = [
  { value: "piece", label: "Брой" },
  { value: "hour", label: "Час" },
  { value: "day", label: "Ден" },
  { value: "month", label: "Месец" },
  { value: "kg", label: "Килограм" },
  { value: "g", label: "Грам" },
  { value: "l", label: "Литър" },
  { value: "m", label: "Метър" },
  { value: "sq_m", label: "Кв. метър" },
  { value: "service", label: "Услуга" },
  { value: "project", label: "Проект" },
  { value: "license", label: "Лиценз" },
  { value: "subscription", label: "Абонамент" },
  { value: "user", label: "Потребител" },
  { value: "custom", label: "По избор" },
] as const;

const productSchema = z.object({
  name: z
    .string()
    .min(2, "Името на продукта е задължително (минимум 2 символа)")
    .max(FIELD_LIMITS.name, "Името е твърде дълго"),
  description: z.string().max(FIELD_LIMITS.description, "Описанието е твърде дълго").optional(),
  price: z
    .string()
    .min(1, "Цената е задължителна")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Цената не може да бъде отрицателна"),
  unit: z.string().min(1, "Единицата е задължителна"),
  taxRate: z
    .string()
    .refine(
      (v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0 && parseFloat(v) <= 100),
      "ДДС ставката трябва да е между 0 и 100"
    ),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const submitLock = useAsyncLock();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      price: "",
      unit: "piece",
      taxRate: "20",
    },
  });

  const formValues = form.watch();
  const grossPrice = parseFloat(formValues.price) || 0;
  const taxRate = parseFloat(formValues.taxRate) || 0;
  const netUnit = grossToNetAmount(grossPrice, taxRate);
  const taxAmount = roundMoney2(grossPrice - netUnit);
  const totalPrice = grossPrice;

  const getUnitLabel = (val: string) => PRODUCT_UNITS.find((u) => u.value === val)?.label || val;

  async function onSubmit(data: ProductFormValues) {
    await submitLock.run(async () => {
      try {
        const gross = parseFloat(data.price);
        const rate = data.taxRate ? parseFloat(data.taxRate) : 20;
        const netStored = grossToNetAmount(gross, rate);
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.name,
            description: data.description || "",
            price: netStored,
            unit: data.unit,
            taxRate: rate,
          }),
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => null)) as {
            error?: string;
            details?: Array<{ path?: string[]; message?: string }>;
          } | null;
          const details = errorPayload?.details;
          if (details?.length) {
            applyApiValidationDetails(form, details);
          }
          throw new Error(errorPayload?.error || "Неуспешно създаване на продукт");
        }

        toast.success("Продуктът е създаден", {
          description: data.name,
        });
        router.push("/products");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Моля, проверете полетата и опитайте отново.";
        console.warn("Грешка при създаване на продукт:", errorMessage);
        toast.error("Неуспешно създаване", { description: errorMessage });
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3 sm:mb-6">
        <Button variant="ghost" size="sm" asChild className="h-9 rounded-full px-3 shrink-0">
          <Link href="/products" className="inline-flex items-center whitespace-nowrap">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Link>
        </Button>
        <div>
          <Badge variant="info" className="mb-2">
            Каталог
          </Badge>
          <h1 className="page-title text-2xl sm:text-3xl">Нов продукт</h1>
          <p className="card-description">Добавете нов продукт или услуга към каталога</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Basic info card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Badge variant="info" className="mb-2">
                    Идентичност
                  </Badge>
                  <CardTitle className="text-base">Основна информация</CardTitle>
                  <CardDescription>Име и описание на продукта</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      Име на продукта *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="напр., Услуга уеб дизайн"
                          className={[
                            "h-11 pr-10 transition-colors",
                            fieldState.isDirty && !fieldState.invalid && "border-emerald-500",
                            fieldState.invalid && "border-destructive",
                          ].filter(Boolean).join(" ")}
                          {...field}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {fieldState.isDirty && !fieldState.invalid && field.value && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                          {fieldState.invalid && (
                            <AlertCircle className="h-4 w-4 text-destructive" />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="flex items-center gap-1 text-xs">
                    </FormMessage>
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Описание
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опишете вашия продукт или услуга"
                        className="min-h-[100px] w-full resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Показва се в PDF фактурата</FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Price card */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <Badge variant="success" className="mb-2">
                    Ценообразуване
                  </Badge>
                  <CardTitle className="text-base">Ценова информация</CardTitle>
                  <CardDescription>
                    Въведената цена е крайна за единица (с ДДС). В каталога се записва нетната стойност.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      Цена с ДДС *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">€</span>
                        <NumericInput
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          placeholder="0.00"
                          className={[
                            "pl-8 h-11 text-base font-semibold transition-colors",
                            fieldState.isDirty && !fieldState.invalid && "border-emerald-500",
                            fieldState.invalid && "border-destructive",
                          ].filter(Boolean).join(" ")}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Крайна продажна цена за единица, с включен ДДС
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Unit */}
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Ruler className="h-3.5 w-3.5" />
                        Единица *
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={[
                            "h-11 transition-colors",
                            fieldState.invalid && "border-destructive",
                          ].filter(Boolean).join(" ")}>
                            <SelectValue placeholder="Изберете" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRODUCT_UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax rate */}
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5" />
                        ДДС %
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <NumericInput
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            placeholder="20"
                            className={[
                              "h-11 pr-8 transition-colors",
                              fieldState.invalid && "border-destructive",
                            ].filter(Boolean).join(" ")}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">По подр. 20%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Live price preview */}
              {grossPrice > 0 && (
                <div className="rounded-lg bg-muted/40 border border-border/50 p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Без ДДС (единица)</span>
                    <span className="font-medium">{netUnit.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ДДС ({taxRate}%)</span>
                    <span className="font-medium">{taxAmount.toFixed(2)} €</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Крайна цена (единица)</span>
                    <span className="font-bold text-primary">{totalPrice.toFixed(2)} €</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Button type="button" variant="outline" asChild className="whitespace-nowrap">
              <Link href="/products" className="inline-flex items-center whitespace-nowrap">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={submitLock.isPending || !form.formState.isValid}
              loading={submitLock.isPending}
              className="gradient-primary border-0 min-w-[140px] hover:shadow-md hover:ring-2 hover:ring-emerald-400/25"
            >
              {!submitLock.isPending && <Check className="h-4 w-4" />}
              {submitLock.isPending ? "Създаване..." : "Създай продукт"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
