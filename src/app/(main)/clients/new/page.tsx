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
  User,
  MapPin,
  Receipt,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

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

// Define validation schema for client (Bulgarian invoice: recipient name + address required)
const clientSchema = z.object({
  name: z.string().min(1, "Името на клиента е задължително"),
  email: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().email("Моля, въведете валиден имейл").optional()
  ),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().min(1, "Адресът е задължителен за издаване на фактури"),
  city: z.string().min(1, "Градът е задължителен"),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
  taxIdNumber: z.string().optional().or(z.literal("")),
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mol: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).default("BULSTAT"),
  locale: z.string().default("bg"),
});

type ClientFormValues = z.infer<typeof clientSchema>;

function getDigitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const steps = [
    { title: "Основни данни", icon: <User className="h-4 w-4" /> },
    { title: "Адрес", icon: <MapPin className="h-4 w-4" /> },
    { title: "Данъчни данни", icon: <Receipt className="h-4 w-4" /> },
    { title: "Преглед", icon: <Check className="h-4 w-4" /> },
  ];

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "България",
      vatNumber: "",
      taxIdNumber: "",
      bulstatNumber: "",
      vatRegistered: false,
      vatRegistrationNumber: "",
      mol: "",
      uicType: "BULSTAT",
      locale: "bg",
    },
  });

  const formValues = form.watch();

  async function onSubmit(data: ClientFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Неуспешно създаване на клиент");
      }

      toast.success("Клиентът е създаден", {
        description: "Вашият клиент беше създаден успешно.",
        action: {
          label: "Нова фактура",
          onClick: () => router.push("/invoices/new"),
        },
      });

      router.push("/clients");
    } catch (error) {
      console.error("Грешка при създаване на клиент:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при създаване на клиента. Моля, опитайте отново.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Email validation helper
  const isValidEmail = (email: string) => {
    if (!email || email.trim() === "") return true; // Empty is allowed (optional)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: {
        const nameValid = formValues.name.trim().length > 0;
        const emailValid = isValidEmail(formValues.email || "");
        return nameValid && emailValid;
      }
      case 1: {
        const addressValid = (formValues.address ?? "").trim().length > 0;
        const cityValid = (formValues.city ?? "").trim().length > 0;
        return addressValid && cityValid;
      }
      case 2:
        return true;
      default:
        return true;
    }
  };

  // Get validation errors for current step
  const getStepErrors = () => {
    const errors: string[] = [];
    switch (currentStep) {
      case 0:
        if (!formValues.name.trim()) errors.push("Името на клиента е задължително");
        if (formValues.email && !isValidEmail(formValues.email)) errors.push("Моля, въведете валиден имейл адрес");
        break;
      case 1:
        if (!(formValues.address ?? "").trim()) errors.push("Адресът е задължителен за издаване на фактури");
        if (!(formValues.city ?? "").trim()) errors.push("Градът е задължителен");
        break;
    }
    return errors;
  };

  const stepErrors = getStepErrors();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Button variant="ghost" size="icon" asChild className="back-btn h-8 w-8 rounded-full">
            <Link href="/clients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="page-title truncate">Нов клиент</h1>
            <p className="card-description hidden sm:block">Добавете нов клиент към вашата база</p>
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
                  <p className="text-muted-foreground">Въведете основните данни за клиента</p>
                </div>

                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Име на клиента *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="напр., Фирма ООД" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field, fieldState }) => {
                          const { invalid, isDirty } = fieldState;
                          const isEmpty = !field.value || field.value.trim() === "";
                          const isValidState = isDirty && !invalid && !isEmpty;
                          const isInvalidState = isDirty && invalid;
                          return (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Имейл
                              </FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    type="email"
                                    placeholder="client@example.com"
                                    className={[
                                      "h-12 pr-10 transition-all duration-200",
                                      isValidState && "border-emerald-500 focus-visible:ring-emerald-500/20",
                                      isInvalidState && "border-destructive focus-visible:ring-destructive/20",
                                    ].filter(Boolean).join(" ")}
                                    {...field}
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300">
                                    {isValidState && (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in fade-in zoom-in-50 duration-200" />
                                    )}
                                    {isInvalidState && (
                                      <XCircle className="h-5 w-5 text-destructive animate-in fade-in zoom-in-50 duration-200" />
                                    )}
                                    {!isDirty && (
                                      <Mail className="h-4 w-4 text-muted-foreground/40" />
                                    )}
                                  </div>
                                </div>
                              </FormControl>
                              <div
                                className="overflow-hidden transition-all duration-300"
                                style={{
                                  maxHeight: isInvalidState ? "3rem" : "0",
                                  opacity: isInvalidState ? 1 : 0,
                                }}
                              >
                                <div className="flex items-center gap-1.5 pt-1 text-sm text-destructive">
                                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                  <FormMessage />
                                </div>
                              </div>
                              <div
                                className="overflow-hidden transition-all duration-300"
                                style={{
                                  maxHeight: isValidState ? "2rem" : "0",
                                  opacity: isValidState ? 1 : 0,
                                }}
                              >
                                <p className="flex items-center gap-1.5 pt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Имейлът изглежда правилен
                                </p>
                              </div>
                              {!isDirty && (
                                <p className="text-xs text-muted-foreground">
                                  Ще бъде използван за изпращане на фактури
                                </p>
                              )}
                            </FormItem>
                          );
                        }}
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
                                className="h-12"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(getDigitsOnly(e.target.value))}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">Само цифри, без интервали и символи</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 1: Address */}
            <div className={currentStep === 1 ? "block" : "hidden"}>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Адрес</h2>
                  <p className="text-muted-foreground">Въведете адресните данни на клиента</p>
                </div>

                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Адрес *</FormLabel>
                          <FormControl>
                            <Input placeholder="ул. Пример 123" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Град *</FormLabel>
                            <FormControl>
                              <Input placeholder="София" className="h-12" {...field} />
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
                              <Input placeholder="София-град" className="h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пощенски код</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="1000"
                                inputMode="numeric"
                                className="h-12"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
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
                              <Input placeholder="България" className="h-12" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 2: Tax Info */}
            <div className={currentStep === 2 ? "block" : "hidden"}>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Данъчна информация</h2>
                  <p className="text-muted-foreground">Въведете данъчните данни за НАП</p>
                </div>

                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="bulstatNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center justify-between gap-3">
                              <span>БУЛСТАТ/ЕИК</span>
                              <span className="text-[11px] font-normal text-muted-foreground">
                                Само цифри
                              </span>
                            </FormLabel>
                            <FormControl>
                              <NumericInput
                                allowDecimal={false}
                                inputMode="numeric"
                                placeholder="123456789"
                                className="h-12"
                                value={field.value || ""}
                                onChange={(e) => field.onChange(getDigitsOnly(e.target.value))}
                              />
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
                            <FormLabel>Тип на идентификатора</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12">
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

                    <Separator />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="vatRegistered"
                        render={({ field }) => (
                          <FormItem className={`flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-4 transition-colors ${field.value ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}>
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
                            <FormLabel className="flex items-center justify-between gap-3">
                              <span>ДДС номер</span>
                              <span className="text-[11px] font-normal text-muted-foreground">
                                При нужда с префикс `BG`
                              </span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="BG123456789" className="h-12" {...field} />
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
                          <FormLabel className="flex items-center justify-between gap-3">
                            <span>МОЛ (Представляващ)</span>
                            <span className="text-[11px] font-normal text-muted-foreground">
                              Име на представляващия
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Име на представляващия" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 3: Review */}
            <div className={currentStep === 3 ? "block" : "hidden"}>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Преглед на данните</h2>
                  <p className="text-muted-foreground">Проверете информацията преди създаване</p>
                </div>

                <Card className="overflow-hidden border-2">
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold">
                        {formValues.name.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{formValues.name || "Без име"}</h3>
                        {formValues.email && <p className="text-muted-foreground">{formValues.email}</p>}
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-6">
                    {/* Contact Info */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Контакти</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Имейл</p>
                          <p className="font-medium">{formValues.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Телефон</p>
                          <p className="font-medium">{formValues.phone || "—"}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Address */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Адрес</h4>
                      <p className="font-medium">
                        {[formValues.address, formValues.city, formValues.zipCode, formValues.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </div>

                    <Separator />

                    {/* Tax Info */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Данъчна информация</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">БУЛСТАТ/ЕИК</p>
                          <p className="font-medium">{formValues.bulstatNumber || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ДДС номер</p>
                          <p className="font-medium">{formValues.vatRegistrationNumber || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Регистрация по ЗДДС</p>
                          <p className="font-medium">{formValues.vatRegistered ? "Да" : "Не"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">МОЛ</p>
                          <p className="font-medium">{formValues.mol || "—"}</p>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Confirmation checkbox — below preview card */}
                <div className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${confirmed ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <Checkbox
                    id="confirm-client"
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(checked === true)}
                    className="h-5 w-5"
                    aria-label="Потвърждавам данните за клиента"
                  />
                  <div className="space-y-1 flex-1">
                    <label
                      htmlFor="confirm-client"
                      className="cursor-pointer select-none text-sm font-medium leading-normal block"
                    >
                      Потвърждавам, че информацията за клиента е коректна.
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Маркирайте отметката, за да активирате бутона.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-6 border-t">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex justify-start">
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
              </div>

              <div className="flex justify-end gap-3 w-full sm:w-auto">
                {currentStep < 3 ? (
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
                    className="gap-2 gradient-primary hover:opacity-90 disabled:opacity-50 border-0"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Създаване...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Създай клиент
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
