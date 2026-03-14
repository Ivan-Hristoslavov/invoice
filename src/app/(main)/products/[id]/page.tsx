"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, NumericInput } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

// List of common product units
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

// Update the schema to only allow values from the units array
const productSchema = z.object({
  name: z.string().min(1, "Името на продукта е задължително"),
  description: z.string().optional(),
  price: z.string().min(1, "Цената е задължителна").refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    "Цената трябва да бъде положително число"
  ),
  unit: z.string().min(1, "Единицата е задължителна"),
  taxRate: z.string().refine(
    (val) => val === "" || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    "Данъчната ставка трябва да бъде положително число или празна"
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
  const grossPrice = netPrice + netPrice * (taxRateValue / 100);
  const selectedUnitLabel =
    PRODUCT_UNITS.find((unit) => unit.value === watchedUnit)?.label || "По избор";

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
          
          // Update form with product data
          form.reset({
            name: data.name,
            description: data.description || "",
            price: data.price.toString(),
            unit: data.unit,
            taxRate: data.taxRate.toString(),
          });
        } else {
          // If product not found, redirect to products page
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
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || "Неуспешно обновяване на продукт");
      }

      toast.success("Продуктът е обновен", {
        description: "Вашият продукт беше обновен успешно."
      });
      
      // Refresh product data
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
        description: "Вашият продукт беше изтрит успешно."
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
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Зареждане...</p>
      </div>
    );
  }

  if (!product && !isLoadingProduct) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-lg text-muted-foreground">Продуктът не е намерен</p>
        <Button asChild>
          <Link href="/products">Към всички продукти</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-full px-3">
            <Link href="/products">
              <ArrowLeft className="w-4 h-4" />
              <span className="ml-2">Назад</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Редактиране на продукт</h1>
            <p className="text-sm text-muted-foreground">По-стегната форма за основни детайли, цена и ДДС.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting} className="h-10 rounded-full px-4">
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? "Изтриване..." : "Изтрий"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Сигурни ли сте?</AlertDialogTitle>
                <AlertDialogDescription>
                  Това действие не може да бъде отменено. Това ще изтрие окончателно продукта от вашия акаунт и системата.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отказ</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Изтрий
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button type="submit" form="product-form" disabled={isLoading} className="h-10 rounded-full px-5">
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Запазване..." : "Запази"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
          <div className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-lg">Основни детайли</CardTitle>
                <CardDescription>Име и описание на продукта или услугата.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Име на продукта</FormLabel>
                      <FormControl>
                        <Input placeholder="напр. Уеб дизайн пакет" className="h-11" {...field} />
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
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Кратко описание, което да се използва и във фактури"
                          className="min-h-[132px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-lg">Цена и продажба</CardTitle>
                <CardDescription>Стойност, мерна единица и ставка по ДДС.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цена</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">€</span>
                          <NumericInput className="h-11 pl-7" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Единица</FormLabel>
                      <FormControl>
                        <Select defaultValue={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Изберете единица" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_UNITS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>Единицата, в която продавате артикула.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ДДС ставка (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <NumericInput placeholder="20" className="h-11 pr-8" {...field} />
                          <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">%</span>
                        </div>
                      </FormControl>
                      <FormDescription>По подразбиране 20% за България.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-border/60 shadow-sm">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-lg">Кратък преглед</CardTitle>
                <CardDescription>Така ще изглеждат основните данни при избиране на продукта.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                  <p className="truncate text-base font-semibold">{watchedName || "Ново име на продукт"}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                    {watchedDescription?.trim() || "Добавете кратко описание, за да е по-ясно при избор във фактура."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Нетна цена</p>
                    <p className="mt-1 text-lg font-semibold">{netPrice.toFixed(2)} €</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Крайна цена</p>
                    <p className="mt-1 text-lg font-semibold text-primary">{grossPrice.toFixed(2)} €</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Единица</p>
                    <p className="mt-1 text-sm font-medium">{selectedUnitLabel}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-background/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">ДДС</p>
                    <p className="mt-1 text-sm font-medium">{taxRateValue.toFixed(0)}%</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 border-t border-border/50 pt-4 sm:flex-row">
                <Button type="submit" disabled={isLoading} className="w-full sm:flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Запазване..." : "Запази промените"}
                </Button>
                <Button type="button" variant="outline" asChild className="w-full sm:flex-1">
                  <Link href="/products">Отказ</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
} 