"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function ProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
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
        throw new Error("Неуспешно обновяване на продукт");
      }

      toast.success("Продуктът е обновен", {
        description: "Вашият продукт беше обновен успешно."
      });
      
      // Refresh product data
      const updatedProduct = await response.json();
      setProduct(updatedProduct);
      
    } catch (error) {
      console.error("Грешка при обновяване на продукт:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при обновяване на продукта. Моля, опитайте отново."
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
        throw new Error("Неуспешно изтриване на продукт");
      }

      toast.success("Продуктът е изтрит", {
        description: "Вашият продукт беше изтрит успешно."
      });
      
      router.push("/products");
    } catch (error) {
      console.error("Грешка при изтриване на продукт:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при изтриване на продукта. Моля, опитайте отново."
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
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <Button variant="ghost" size="sm" asChild className="back-btn">
            <Link href="/products">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Назад</span>
            </Link>
          </Button>
          <h1 className="page-title truncate">Редактиране на продукт</h1>
        </div>
        <div className="page-header-actions">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting} className="btn-responsive btn-text">
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{isDeleting ? "Изтриване..." : "Изтрий"}</span>
                <span className="sm:hidden">{isDeleting ? "..." : "Изтрий"}</span>
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
          
          <Button 
            type="submit" 
            form="product-form" 
            disabled={isLoading}
            className="btn-responsive btn-text"
          >
            <Save className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{isLoading ? "Запазване..." : "Запази"}</span>
            <span className="sm:hidden">{isLoading ? "..." : "Запази"}</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="card-title">Детайли за продукта</CardTitle>
          <CardDescription className="card-description">
            Редактирайте детайлите на вашия продукт или услуга
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
                            €
                          </span>
                          <NumericInput 
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
                      <FormLabel>ДДС ставка (%)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <NumericInput 
                            placeholder="Например: 20"
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