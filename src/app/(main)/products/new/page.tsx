"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Package,
  DollarSign,
  FileText,
  Tag
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, NumericInput } from "@/components/ui/input";
import {
  Card,
  CardContent,
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

// Step indicator component
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: { title: string; icon: React.ReactNode }[] }) {
  return (
    <div className="flex items-center justify-center mb-8 gap-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-2">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 relative
              ${index < currentStep 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : index === currentStep 
                  ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25' 
                  : 'bg-muted border-muted-foreground/20 text-muted-foreground'}
            `}>
              <div className="absolute inset-0 flex items-center justify-center">
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <div className="flex items-center justify-center h-4 w-4">
                    {step.icon}
                  </div>
                )}
              </div>
            </div>
            <p className={`text-xs font-medium whitespace-nowrap text-center ${index === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 sm:w-12 md:w-16 h-0.5 transition-all duration-300 ${index < currentStep ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

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
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const steps = [
    { title: "Основни данни", icon: <Package className="h-4 w-4" /> },
    { title: "Цена и данък", icon: <DollarSign className="h-4 w-4" /> },
    { title: "Преглед", icon: <Check className="h-4 w-4" /> },
  ];

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

  const formValues = form.watch();

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
    } catch (error) {
      console.error("Грешка при създаване на продукт:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при създаване на продукта. Моля, опитайте отново."
      });
    } finally {
      setIsLoading(false);
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        // Step 0: Name is required
        return formValues.name.trim().length > 0;
      case 1:
        // Step 1: Price is required and must be valid number
        const priceValue = parseFloat(formValues.price);
        const priceValid = formValues.price.trim().length > 0 && !isNaN(priceValue) && priceValue >= 0;
        // Tax rate must be valid if provided
        const taxRateValue = parseFloat(formValues.taxRate);
        const taxRateValid = !formValues.taxRate || formValues.taxRate === "" || (!isNaN(taxRateValue) && taxRateValue >= 0 && taxRateValue <= 100);
        return priceValid && taxRateValid;
      default:
        return true;
    }
  };

  // Get validation errors for current step
  const getStepErrors = () => {
    const errors: string[] = [];
    switch (currentStep) {
      case 0:
        if (!formValues.name.trim()) {
          errors.push("Името на продукта е задължително");
        }
        break;
      case 1:
        if (!formValues.price.trim()) {
          errors.push("Цената е задължителна");
        } else {
          const priceValue = parseFloat(formValues.price);
          if (isNaN(priceValue) || priceValue < 0) {
            errors.push("Цената трябва да бъде положително число");
          }
        }
        if (formValues.taxRate) {
          const taxRateValue = parseFloat(formValues.taxRate);
          if (isNaN(taxRateValue) || taxRateValue < 0 || taxRateValue > 100) {
            errors.push("Данъчната ставка трябва да бъде между 0 и 100");
          }
        }
        break;
    }
    return errors;
  };

  const stepErrors = getStepErrors();

  const getUnitLabel = (value: string) => {
    return PRODUCT_UNITS.find(u => u.value === value)?.label || value;
  };

  const price = parseFloat(formValues.price) || 0;
  const taxRate = parseFloat(formValues.taxRate) || 0;
  const taxAmount = price * (taxRate / 100);
  const totalPrice = price + taxAmount;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="page-title truncate">Нов продукт</h1>
            <p className="card-description hidden sm:block">Добавете нов продукт или услуга към каталога</p>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} steps={steps} />

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step content - all steps rendered but hidden with CSS */}
          <div className="mb-8">
            {/* Step 0: Basic Info */}
            <div className={currentStep === 0 ? "block" : "hidden"}>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Основна информация</h2>
                  <p className="text-muted-foreground">Въведете име и описание на продукта</p>
                </div>

                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Име на продукта *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="напр., Услуга уеб дизайн" className="h-12" {...field} />
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
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Описание
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Опишете вашия продукт или услуга"
                              className="resize-none min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Подробно описание, което ще се показва във фактурите
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 1: Price & Tax */}
            <div className={currentStep === 1 ? "block" : "hidden"}>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Цена и данък</h2>
                  <p className="text-muted-foreground">Задайте цената, единицата и данъчната ставка</p>
                </div>

                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Цена *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-4 flex items-center text-muted-foreground font-medium">
                                €
                              </span>
                              <NumericInput 
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                name={field.name}
                                placeholder="0.00"
                                className="pl-10 h-12 text-lg font-semibold"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Единица</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="h-12">
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
                            <FormLabel>Данъчна ставка (ДДС)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <NumericInput 
                                  value={field.value}
                                  onChange={field.onChange}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  placeholder="20"
                                  className="h-12 pr-10"
                                />
                                <span className="absolute inset-y-0 right-4 flex items-center text-muted-foreground font-medium">
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
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 2: Review */}
            <div className={currentStep === 2 ? "block" : "hidden"}>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Преглед на продукта</h2>
                  <p className="text-muted-foreground">Проверете информацията преди създаване</p>
                </div>

                <Card className="overflow-hidden border-2">
                  <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                        <Package className="h-8 w-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold">{formValues.name || "Без име"}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="bg-white/20 text-white border-0">
                            {getUnitLabel(formValues.unit)}
                          </Badge>
                          <Badge variant="secondary" className="bg-white/20 text-white border-0">
                            ДДС {formValues.taxRate}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {/* Description */}
                    {formValues.description && (
                      <>
                        <div>
                          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Описание</h4>
                          <p className="text-foreground">{formValues.description}</p>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Price breakdown */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ценова информация</h4>
                      <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-4 space-y-3 border">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Цена без ДДС</span>
                          <span className="font-semibold">{price.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">ДДС ({formValues.taxRate}%)</span>
                          <span className="font-semibold">{taxAmount.toFixed(2)} €</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center pt-2">
                          <span className="text-lg font-bold">Крайна цена</span>
                          <span className="text-2xl font-bold text-primary">{totalPrice.toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Детайли</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Единица</p>
                          <p className="font-medium">{getUnitLabel(formValues.unit)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Данъчна ставка</p>
                          <p className="font-medium">{formValues.taxRate}%</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Confirmation checkbox */}
                    <div className="flex items-start space-x-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <Checkbox
                        id="confirm-product"
                        checked={confirmed}
                        onCheckedChange={(checked) => setConfirmed(checked === true)}
                        className="mt-0.5"
                      />
                      <label
                        htmlFor="confirm-product"
                        className="text-sm leading-relaxed cursor-pointer"
                      >
                        <span className="font-medium">Потвърждавам,</span> че информацията за продукта е коректна и искам да го създам.
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-4 pt-6 border-t">
            {/* Validation errors */}
            {stepErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <ul className="text-sm text-destructive space-y-1">
                  {stepErrors.map((error, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>

              <div className="flex gap-3">
                {currentStep < 2 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceed()}
                    className="gap-2"
                  >
                    Напред
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading || !confirmed}
                    className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Създаване...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Създай продукт
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
