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
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  name: z.string().min(1, "Името на продукта е задължително"),
  description: z.string().optional(),
  price: z
    .string()
    .min(1, "Цената е задължителна")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, "Цената трябва да е положително число"),
  unit: z.string().min(1, "Единицата е задължителна"),
  taxRate: z
    .string()
    .refine(
      (v) => v === "" || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0),
      "Данъчната ставка трябва да е положително число"
    ),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
  const price = parseFloat(formValues.price) || 0;
  const taxRate = parseFloat(formValues.taxRate) || 0;
  const taxAmount = price * (taxRate / 100);
  const totalPrice = price + taxAmount;

  const getUnitLabel = (val: string) => PRODUCT_UNITS.find((u) => u.value === val)?.label || val;

  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || "",
          price: parseFloat(data.price),
          unit: data.unit,
          taxRate: data.taxRate ? parseFloat(data.taxRate) : 20,
        }),
      });

      if (!response.ok) throw new Error("Неуспешно създаване на продукт");

      toast.success("Продуктът е създаден", {
        description: data.name,
        action: { label: "Виж продукти", onClick: () => router.push("/products") },
      });
      router.push("/products");
    } catch {
      toast.error("Грешка", { description: "Моля, опитайте отново." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full shrink-0">
          <Link href="/products">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="page-title">Нов продукт</h1>
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
                        className="resize-none min-h-[100px]"
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
                  <CardTitle className="text-base">Ценова информация</CardTitle>
                  <CardDescription>Цена, единица и данъчна ставка</CardDescription>
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
                      Цена *
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
              {price > 0 && (
                <div className="rounded-lg bg-muted/40 border border-border/50 p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Без ДДС</span>
                    <span className="font-medium">{price.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ДДС ({taxRate}%)</span>
                    <span className="font-medium">{taxAmount.toFixed(2)} €</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Крайна цена</span>
                    <span className="font-bold text-primary">{totalPrice.toFixed(2)} €</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Link>
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !form.formState.isValid}
              className="gradient-primary hover:opacity-90 border-0 min-w-[140px]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Създаване...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Създай продукт
                </span>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
