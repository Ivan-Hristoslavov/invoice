"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  MapPin,
  Receipt,
  CreditCard,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useCompanyBookLookup } from "@/hooks/useCompanyBookLookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="mb-6 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex min-w-max items-center justify-center gap-2 px-1">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex flex-col items-center gap-2">
            <div className={`
              relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-10 sm:w-10
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
            <p className={`hidden text-xs font-medium whitespace-nowrap text-center sm:block ${index === currentStep ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-0.5 w-6 transition-all duration-300 sm:w-12 md:w-16 ${index < currentStep ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`} />
          )}
        </div>
      ))}
      </div>
    </div>
  );
}

// Company schema with validation (Bulgarian: name, address, city, Bulstat/EIK, MOL required)
const companySchema = z.object({
  name: z.string().min(1, "Името на компанията е задължително"),
  email: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().email("Моля, въведете валиден имейл").optional()
  ),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().min(1, "Адресът е задължителен"),
  city: z.string().min(1, "Градът е задължителен"),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
  taxIdNumber: z.string().optional().or(z.literal("")),
  registrationNumber: z.string().optional().or(z.literal("")),
  bulstatNumber: z.string().min(1, "Булстат/ЕИК е задължителен"),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mol: z.string().min(1, "МОЛ (материално отговорно лице) е задължително"),
  accountablePerson: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).default("BULSTAT"),
  bankName: z.string().optional().or(z.literal("")),
  bankAccount: z.string().optional().or(z.literal("")),
  bankSwift: z.string().optional().or(z.literal("")),
  bankIban: z.string().optional().or(z.literal("")),
});

type CompanyFormValues = z.infer<typeof companySchema>;

export default function NewCompanyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const steps = [
    { title: "Основни данни", icon: <Building2 className="h-4 w-4" /> },
    { title: "Адрес", icon: <MapPin className="h-4 w-4" /> },
    { title: "Данъчни данни", icon: <Receipt className="h-4 w-4" /> },
    { title: "Банкова сметка", icon: <CreditCard className="h-4 w-4" /> },
    { title: "Преглед", icon: <Check className="h-4 w-4" /> },
  ];

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
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
      registrationNumber: "",
      bulstatNumber: "",
      vatRegistered: false,
      vatRegistrationNumber: "",
      mol: "",
      accountablePerson: "",
      uicType: "BULSTAT",
      bankName: "",
      bankAccount: "",
      bankSwift: "",
      bankIban: "",
    },
  });

  const formValues = form.watch();

  const handleCompanyBookSuccess = useCallback((fields: Record<string, unknown>) => {
    const fieldMap: Record<string, keyof CompanyFormValues> = {
      name: "name",
      address: "address",
      city: "city",
      state: "state",
      zipCode: "zipCode",
      country: "country",
      bulstatNumber: "bulstatNumber",
      vatRegistered: "vatRegistered",
      vatRegistrationNumber: "vatRegistrationNumber",
      vatNumber: "vatNumber",
      mol: "mol",
      email: "email",
      phone: "phone",
      uicType: "uicType",
    };

    let filledCount = 0;
    for (const [key, formKey] of Object.entries(fieldMap)) {
      const val = fields[key];
      if (val !== undefined && val !== "") {
        form.setValue(formKey, val as never, { shouldValidate: true, shouldDirty: true });
        filledCount++;
      }
    }

    toast.success("Данните са заредени", {
      description: `${filledCount} полета бяха автоматично попълнени от Търговския регистър.`,
    });
  }, [form]);

  const { lookup: lookupCompany, isLoading: isLookupLoading } = useCompanyBookLookup({
    onSuccess: handleCompanyBookSuccess,
    onError: (msg) => toast.error("Грешка при търсене", { description: msg }),
  });

  const handleEikLookup = useCallback(async () => {
    const eik = form.getValues("bulstatNumber")?.replace(/\D/g, "");
    if (!eik || eik.length < 9) {
      toast.error("Въведете ЕИК", { description: "Въведете поне 9 цифри в полето БУЛСТАТ/ЕИК преди търсене." });
      return;
    }
    await lookupCompany(eik);
  }, [form, lookupCompany]);

  async function onSubmit(data: CompanyFormValues) {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error || "Неуспешно създаване на компания");
      }

      toast.success("Компанията е създадена", {
        description: "Вашата компания беше създадена успешно.",
        action: {
          label: "Виж компании",
          onClick: () => router.push("/companies"),
        },
      });

      router.push("/companies");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Възникна грешка при създаване на вашата компания. Моля, опитайте отново.";
      console.warn("Грешка при създаване на компания:", errorMessage);
      toast.error("Грешка", {
        description: errorMessage,
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
      case 2: {
        const bulstatValid = (formValues.bulstatNumber ?? "").trim().length > 0;
        const molValid = (formValues.mol ?? "").trim().length > 0;
        return bulstatValid && molValid;
      }
      case 3:
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
            <Link href="/companies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="page-title truncate">Нова компания</h1>
            <p className="card-description hidden sm:block">Добавете нова компания за издаване на фактури</p>
          </div>
        </div>
      </div>

      {/* Quick EIK Lookup - always visible */}
      <div className="max-w-2xl mx-auto mb-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Search className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Бързо попълване по ЕИК</h3>
                <p className="text-xs text-muted-foreground">Въведете ЕИК/БУЛСТАТ и данните ще се попълнят автоматично от Търговския регистър</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Въведете ЕИК (напр. 204676177)"
                inputMode="numeric"
                className="h-11 flex-1"
                value={formValues.bulstatNumber || ""}
                onChange={(e) => form.setValue("bulstatNumber", e.target.value.replace(/\D/g, ""), { shouldValidate: true })}
              />
              <Button
                type="button"
                variant="default"
                className="h-11 px-4 shrink-0 gap-2"
                disabled={isLookupLoading || !(formValues.bulstatNumber || "").match(/^\d{9,13}$/)}
                onClick={handleEikLookup}
              >
                {isLookupLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Зареди данни
              </Button>
            </div>
          </CardContent>
        </Card>
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
                  <p className="text-muted-foreground">Въведете основните данни за компанията</p>
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
                            Име на компанията *
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Фирма ООД" className="h-12" {...field} />
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
                                    placeholder="contact@example.com"
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
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
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
                                  Имейл за контакт за фактури
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
                              <Input placeholder="+359 2 123 4567" className="h-12" {...field} />
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

            {/* Step 1: Address */}
            <div className={currentStep === 1 ? "block" : "hidden"}>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Адрес</h2>
                  <p className="text-muted-foreground">Въведете адреса на компанията</p>
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
                            <Input placeholder="ул. Бизнес 123" className="h-12" {...field} />
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
                            <FormLabel>БУЛСТАТ/ЕИК *</FormLabel>
                            <FormControl>
                              <div className="flex gap-2">
                                <Input
                                  placeholder="123456789"
                                  className="h-12 flex-1"
                                  inputMode="numeric"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-12 px-3 shrink-0"
                                  disabled={isLookupLoading || !field.value || field.value.length < 9}
                                  onClick={handleEikLookup}
                                  title="Зареди данни от Търговски регистър"
                                >
                                  {isLookupLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Search className="h-4 w-4" />
                                  )}
                                  <span className="hidden sm:inline ml-1.5">Зареди</span>
                                </Button>
                              </div>
                            </FormControl>
                            <FormDescription>Въведете ЕИК и натиснете „Зареди" за автоматично попълване</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="uicType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Тип идентификатор</FormLabel>
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
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Регистрация по ЗДДС</FormLabel>
                              <FormDescription>Компанията е регистрирана по ЗДДС</FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vatRegistrationNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ДДС номер</FormLabel>
                            <FormControl>
                              <Input placeholder="BG123456789" className="h-12" {...field} />
                            </FormControl>
                            <FormDescription>№ по ЗДДС</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="mol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>МОЛ (Представляващ) *</FormLabel>
                            <FormControl>
                              <Input placeholder="Име на представляващия" className="h-12" {...field} />
                            </FormControl>
                            <FormDescription>Материално отговорно лице</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="accountablePerson"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Счетоводител</FormLabel>
                            <FormControl>
                              <Input placeholder="Име на счетоводителя" className="h-12" {...field} />
                            </FormControl>
                            <FormDescription>Лице, отговорно за счетоводството</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Step 3: Bank Info */}
            <div className={currentStep === 3 ? "block" : "hidden"}>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Банкова информация</h2>
                  <p className="text-muted-foreground">Въведете банковите данни за получаване на плащания</p>
                </div>

                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Име на банката</FormLabel>
                          <FormControl>
                            <Input placeholder="Банка Пример" className="h-12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bankIban"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IBAN</FormLabel>
                          <FormControl>
                            <Input placeholder="BG00XXXX00000000000000" className="h-12" {...field} />
                          </FormControl>
                          <FormDescription>Международен номер на банкова сметка</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="bankSwift"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SWIFT/BIC код</FormLabel>
                            <FormControl>
                              <Input placeholder="XXXXBGSF" className="h-12" {...field} />
                            </FormControl>
                            <FormDescription>Международен банков код</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bankAccount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Номер на сметка</FormLabel>
                            <FormControl>
                              <Input placeholder="Номер на сметка" className="h-12" {...field} />
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

            {/* Step 4: Review */}
            <div className={currentStep === 4 ? "block" : "hidden"}>
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Преглед на данните</h2>
                  <p className="text-muted-foreground">Проверете информацията преди създаване</p>
                </div>

                <Card className="overflow-hidden border-2">
                  <div className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
                        <Building2 className="h-8 w-8" />
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
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Имейл</p>
                          <p className="font-medium wrap-anywhere">{formValues.email || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Телефон</p>
                          <p className="font-medium wrap-anywhere">{formValues.phone || "—"}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Address */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Адрес</h4>
                      <p className="font-medium wrap-anywhere">
                        {[formValues.address, formValues.city, formValues.zipCode, formValues.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </p>
                    </div>

                    <Separator />

                    {/* Tax Info */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Данъчна информация</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">БУЛСТАТ/ЕИК</p>
                          <p className="font-medium wrap-anywhere">{formValues.bulstatNumber || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">ДДС номер</p>
                          <p className="font-medium wrap-anywhere">{formValues.vatRegistrationNumber || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">МОЛ</p>
                          <p className="font-medium wrap-anywhere">{formValues.mol || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Счетоводител</p>
                          <p className="font-medium wrap-anywhere">{formValues.accountablePerson || "—"}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Bank Info */}
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Банкова информация</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Банка</p>
                          <p className="font-medium wrap-anywhere">{formValues.bankName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">SWIFT</p>
                          <p className="font-medium wrap-anywhere">{formValues.bankSwift || "—"}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-muted-foreground">IBAN</p>
                          <p className="font-medium font-mono wrap-anywhere">{formValues.bankIban || "—"}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Confirmation checkbox */}
                    <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <input
                        id="confirm-company"
                        type="checkbox"
                        checked={confirmed}
                        onChange={(event) => setConfirmed(event.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-primary/40 bg-background accent-primary"
                        aria-label="Потвърждавам данните за компанията"
                      />
                      <label
                        htmlFor="confirm-company"
                        className="cursor-pointer text-sm leading-relaxed"
                      >
                        <span className="font-medium">Потвърждавам,</span> че информацията за компанията е коректна и искам да я създам.
                      </label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="pt-6 border-t">
            <div className="grid grid-cols-2 items-center gap-3">
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

              <div className="flex justify-end gap-3">
                {currentStep < 4 ? (
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
                        Създай компания
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
