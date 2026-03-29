"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Save,
  Trash2,
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
import { Button } from "@/components/ui/button";
import { Input, NumericInput } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FullPageLoader } from "@/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { applyApiValidationDetails } from "@/lib/form-errors";
import { FIELD_LIMITS } from "@/lib/validations/field-limits";

const PRODUCT_UNITS = [
  { value: "piece", label: "Брой" },
  { value: "hour", label: "Час" },
  { value: "day", label: "Ден" },
  { value: "month", label: "Месец" },
  { value: "kg", label: "Килограм" },
  { value: "g", label: "Грам" },
  { value: "lb", label: "Фунт" },
  { value: "l", label: "Литър" },
  { value: "ml", label: "Милилитър" },
  { value: "m", label: "Метър" },
  { value: "cm", label: "Сантиметър" },
  { value: "sq_m", label: "Квадратен метър" },
  { value: "cu_m", label: "Кубичен метър" },
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
    .min(2, "Името е задължително (минимум 2 символа)")
    .max(FIELD_LIMITS.name, "Името е твърде дълго"),
  description: z.string().max(FIELD_LIMITS.description, "Описанието е твърде дълго").optional(),
  price: z
    .string()
    .min(1, "Цената е задължителна")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Цената не може да бъде отрицателна"),
  unit: z.string().min(1, "Единицата е задължителна"),
  taxRate: z
    .string()
    .refine(
      (v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0 && parseFloat(v) <= 100),
      "ДДС ставката трябва да е между 0 и 100"
    ),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  taxRate: number;
}

export default function ProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);

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

  const watchedName = form.watch("name");
  const watchedDescription = form.watch("description");
  const watchedPrice = form.watch("price");
  const watchedUnit = form.watch("unit");
  const watchedTaxRate = form.watch("taxRate");

  const netPrice = Number.parseFloat(watchedPrice || "0") || 0;
  const taxRateValue = Number.parseFloat(watchedTaxRate || "0") || 0;
  const taxAmount = netPrice * (taxRateValue / 100);
  const grossPrice = netPrice + taxAmount;
  const selectedUnitLabel =
    PRODUCT_UNITS.find((unit) => unit.value === watchedUnit)?.label || "По избор";

  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${params.id}`);

        if (response.ok) {
          const data = await response.json();
          setProduct(data);

          form.reset({
            name: data.name,
            description: data.description || "",
            price: data.price.toString(),
            unit: data.unit,
            taxRate: data.taxRate.toString(),
          });
        } else {
          if (response.status === 404) {
            toast.error("Продуктът не е намерен");
            router.push("/products");
          }
        }
      } catch (error) {
        console.error("Грешка при зареждане на продукт:", error);
        toast.error("Грешка при зареждане на продукт");
      } finally {
        setIsLoadingProduct(false);
      }
    }

    fetchProduct();
  }, [params.id, form, router]);

  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description || "",
          price: parseFloat(data.price),
          unit: data.unit,
          taxRate: data.taxRate ? parseFloat(data.taxRate) : 20,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
          details?: Array<{ path?: string[]; message: string }>;
        } | null;
        const details = errorPayload?.details;
        if (details?.length) {
          applyApiValidationDetails(form, details);
        }
        throw new Error(errorPayload?.error || "Неуспешно обновяване на продукт");
      }

      toast.success("Продуктът е обновен", {
        description: "Промените са запазени успешно.",
      });

      const updatedProduct = await response.json();
      setProduct(updatedProduct);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Възникна грешка при обновяване на продукта. Моля, опитайте отново.";
      console.warn("Грешка при обновяване на продукт:", errorMessage);
      toast.error("Грешка", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || "Неуспешно изтриване на продукт");
      }

      toast.success("Продуктът е изтрит", {
        description: "Продуктът беше премахнат от каталога.",
      });

      router.push("/products");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Възникна грешка при изтриване на продукта. Моля, опитайте отново.";
      console.warn("Грешка при изтриване на продукт:", errorMessage);
      toast.error("Грешка", {
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoadingProduct) {
    return (
      <FullPageLoader
        title="Зареждане на продукт"
        subtitle="Синхронизираме данните от каталога..."
      />
    );
  }

  if (!product && !isLoadingProduct) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-card/50 py-16">
        <p className="text-lg text-muted-foreground">Продуктът не е намерен</p>
        <Button asChild>
          <Link href="/products">Към всички продукти</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 sm:space-y-6">
      {/* Хедър: навигация и заглавие на една визуална ос — без „разминаване“ между Назад и Каталог */}
      <header className="border-b border-border/50 pb-4">
        <nav
          className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm"
          aria-label="Път в приложението"
        >
          <Button variant="ghost" size="sm" asChild className="-ml-2 h-8 shrink-0 rounded-lg px-2">
            <Link href="/products" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Назад
            </Link>
          </Button>
          <span className="text-muted-foreground/45 select-none" aria-hidden>
            /
          </span>
          <Link
            href="/products"
            className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Каталог
          </Link>
        </nav>
        <h1 className="page-title mt-3 text-xl sm:text-2xl">Редактиране на продукт</h1>
        <p className="card-description mt-1 max-w-lg leading-relaxed">
          Променете име, описание, цена и ДДС — сумите се показват на едно място по-долу.
        </p>
      </header>

      <Form {...form}>
        <form id="product-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Основна информация */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-0 pb-2 pt-5">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 ring-1 ring-primary/15">
                  <Package className="h-4 w-4 text-primary" aria-hidden />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <CardTitle className="text-base leading-snug">Основна информация</CardTitle>
                  <CardDescription className="leading-normal">
                    Име и описание на продукта или услугата
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          placeholder="напр. Услуга уеб дизайн"
                          className={cn(
                            "h-11 pr-10 transition-colors",
                            fieldState.isDirty && !fieldState.invalid && field.value && "border-emerald-500/80",
                            fieldState.invalid && "border-destructive"
                          )}
                          {...field}
                        />
                        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                          {fieldState.isDirty && !fieldState.invalid && field.value && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden />
                          )}
                          {fieldState.invalid && <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        placeholder="Кратко описание за фактури и каталог"
                        className="min-h-[100px] w-full resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Показва се в PDF фактурата при избор на реда</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Цена + един преглед на сумите + мини преглед за фактура (без втори блок с €) */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="space-y-0 pb-2 pt-5">
              <div className="flex gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/12 ring-1 ring-emerald-500/20">
                  <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <CardTitle className="text-base leading-snug">Цена, единица и ДДС</CardTitle>
                  <CardDescription className="leading-normal">
                    Стойности за фактуриране и кратък преглед на реда
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5" />
                      Цена *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          €
                        </span>
                        <NumericInput
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          placeholder="0.00"
                          className={cn(
                            "h-11 pl-8 text-base font-semibold transition-colors",
                            fieldState.isDirty && !fieldState.invalid && "border-emerald-500/80",
                            fieldState.invalid && "border-destructive"
                          )}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          <SelectTrigger
                            className={cn(
                              "h-11 transition-colors",
                              fieldState.invalid && "border-destructive ring-1 ring-destructive/25"
                            )}
                          >
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
                            className={cn(
                              "h-11 pr-8 transition-colors",
                              fieldState.invalid && "border-destructive"
                            )}
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            %
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">По подр. 20% за България</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {netPrice > 0 && (
                <div className="rounded-lg border border-border/50 bg-muted/40 p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Без ДДС</span>
                    <span className="font-medium tabular-nums">{netPrice.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ДДС ({taxRateValue.toFixed(0)}%)</span>
                    <span className="font-medium tabular-nums">{taxAmount.toFixed(2)} €</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Крайна цена</span>
                    <span className="font-bold text-primary tabular-nums">{grossPrice.toFixed(2)} €</span>
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Във фактурата</p>
                <p className="font-medium leading-snug">{watchedName?.trim() || "—"}</p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {watchedDescription?.trim() || "Без описание"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="font-normal">
                    {selectedUnitLabel}
                  </Badge>
                  <Badge variant="outline" className="font-normal tabular-nums">
                    ДДС {taxRateValue.toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Действия — един ред, без „втора колона“ */}
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" asChild className="whitespace-nowrap">
                <Link href="/products" className="inline-flex items-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Към каталога
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="whitespace-nowrap border-destructive/35 text-destructive hover:bg-destructive/10"
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Изтриване..." : "Изтрий продукта"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Изтриване на продукт?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Това действие не може да бъде отменено. Продуктът ще бъде премахнат от каталога.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отказ</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Изтрий
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Button
              type="submit"
              form="product-edit-form"
              loading={isLoading}
              disabled={isLoading}
              className="min-w-[180px] shrink-0 gradient-primary border-0 sm:ml-auto"
            >
              {!isLoading && <Save className="h-4 w-4" aria-hidden />}
              {isLoading ? "Запазване..." : "Запази промените"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
