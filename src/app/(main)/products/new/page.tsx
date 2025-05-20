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

export default function NewProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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

  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/products", {
        method: "POST",
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
        throw new Error("Неуспешно създаване на продукт");
      }

      toast.success("Продуктът е създаден", {
        description: "Вашият продукт беше създаден успешно."
      });
      
      router.push("/products");
      router.refresh();
    } catch (error) {
      console.error("Грешка при създаване на продукт:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при създаване на продукта. Моля, опитайте отново."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Нов продукт</h1>
        </div>
        <Button 
          type="submit" 
          form="product-form" 
          disabled={isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Запазване..." : "Запази продукт"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Детайли за продукта</CardTitle>
          <CardDescription>
            Добавете нов продукт или услуга към вашия инвентар
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="product-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Име на продукта</FormLabel>
                    <FormControl>
                      <Input placeholder="напр., Услуга уеб дизайн" {...field} />
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
                        placeholder="Опишете вашия продукт или услуга"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цена</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                            лв
                          </span>
                          <Input 
                            type="text" 
                            inputMode="decimal"
                            className="pl-7"
                            {...field} 
                          />
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
                        <Select 
                          defaultValue={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
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
                      <FormDescription>
                        Единица, в която се продава продуктът
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Данъчна ставка (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="text" 
                            inputMode="decimal" 
                            {...field} 
                          />
                          <span className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                            %
                          </span>
                        </div>
                      </FormControl>
                      <FormDescription>
                        По подразбиране е 20% (ДДС в България)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 