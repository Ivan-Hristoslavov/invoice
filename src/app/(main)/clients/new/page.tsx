"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  FilePenLine,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import { useCompanyBookLookup } from "@/hooks/useCompanyBookLookup";
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
import { validateBulgarianPartyInput } from "@/lib/bulgarian-party";
import { applyApiValidationDetails } from "@/lib/form-errors";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { useSubscription } from "@/hooks/useSubscription";
import { ProFeatureLock } from "@/components/ui/pro-feature-lock";

type ClientCreationMode = "eik" | "manual";

function ModeOptionCard({
  title,
  description,
  caption,
  onClick,
  icon,
}: {
  title: string;
  description: string;
  caption: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="space-y-2.5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          {caption}
        </div>
      </div>
    </button>
  );
}

// Step indicator component
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: { title: string; icon: React.ReactNode }[] }) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between rounded-xl border bg-card/70 px-3 py-2 text-sm sm:hidden">
        <span className="font-medium text-foreground">{steps[currentStep]?.title}</span>
        <span className="text-xs text-muted-foreground">
          Стъпка {currentStep + 1}/{steps.length}
        </span>
      </div>
      <div className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="mx-auto flex min-w-max items-center justify-center gap-2 px-1">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex flex-col items-center gap-2">
            <div className={`
              relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-10 sm:w-10
              ${index < currentStep
                ? 'bg-success border-success text-success-foreground'
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
            <div className={`h-0.5 w-6 transition-all duration-300 sm:w-12 md:w-16 ${index < currentStep ? 'bg-success' : 'bg-muted-foreground/20'}`} />
          )}
        </div>
      ))}
      </div>
      </div>
    </div>
  );
}

const clientSchema = z.object({
  name: z.string().min(1, "Името на клиента е задължително"),
  email: z.string().email("Моля, въведете валиден имейл").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().min(1, "Адресът е задължителен за издаване на фактури"),
  city: z.string().min(1, "Градът е задължителен"),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
  taxIdNumber: z.string().optional().or(z.literal("")),
  bulstatNumber: z
    .string()
    .min(9, "ЕИК/БУЛСТАТ е задължителен и трябва да съдържа поне 9 цифри")
    .refine((value) => getDigitsOnly(value).length >= 9, {
      message: "ЕИК/БУЛСТАТ трябва да съдържа поне 9 цифри",
    }),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mol: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).default("BULSTAT"),
  locale: z.string().default("bg"),
}).superRefine((value, ctx) => {
  const phoneRaw = (value.phone ?? "").trim();
  if (phoneRaw && getDigitsOnly(phoneRaw).length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["phone"],
      message: "Въведете валиден телефонен номер с поне 6 цифри",
    });
  }

  const { issues } = validateBulgarianPartyInput(value, {
    skipIdentifierFormatValidation: true,
  });

  for (const issue of issues) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: issue.path,
      message: issue.message,
    });
  }
});

type ClientFormInputValues = z.input<typeof clientSchema>;
type ClientFormValues = z.output<typeof clientSchema>;

function getDigitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function getStepForClientField(field?: string) {
  switch (field) {
    case "name":
    case "email":
    case "phone":
      return 0;
    case "address":
    case "city":
    case "state":
    case "zipCode":
    case "country":
      return 1;
    case "bulstatNumber":
    case "vatRegistered":
    case "vatRegistrationNumber":
    case "mol":
    case "uicType":
      return 2;
    default:
      return 0;
  }
}

function NewClientPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [clientCreationMode, setClientCreationMode] = useState<ClientCreationMode | null>(null);
  const [isCheckingClientIdentifier, setIsCheckingClientIdentifier] = useState(false);
  const duplicateCheckRequestRef = useRef(0);

  const steps = [
    { title: "Основни данни", icon: <User className="h-4 w-4" /> },
    { title: "Адрес", icon: <MapPin className="h-4 w-4" /> },
    { title: "Данъчни данни", icon: <Receipt className="h-4 w-4" /> },
    { title: "Преглед", icon: <Check className="h-4 w-4" /> },
  ];
  const currentStepTitle = steps[currentStep]?.title ?? "";

  const form = useForm<ClientFormInputValues, unknown, ClientFormValues>({
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
  const { plan, canUseFeature } = useSubscriptionLimit();
  const canUseEikSearch = canUseFeature("eikSearch");
  const { createCheckoutSession } = useSubscription();
  const [eikCheckoutLoading, setEikCheckoutLoading] = useState(false);
  const bulstatFieldError = form.formState.errors.bulstatNumber;

  const clearDuplicateBulstatError = useCallback(() => {
    if (form.getFieldState("bulstatNumber").error?.type === "duplicate") {
      form.clearErrors("bulstatNumber");
    }
  }, [form]);

  const handleCreationModeSelect = useCallback((mode: ClientCreationMode) => {
    setClientCreationMode(mode);
    setCurrentStep(0);
    setConfirmed(false);
  }, []);

  const handleBackToModeSelection = useCallback(() => {
    setClientCreationMode(null);
    setCurrentStep(0);
    setConfirmed(false);
    setIsCheckingClientIdentifier(false);
    clearDuplicateBulstatError();
  }, [clearDuplicateBulstatError]);

  const handleCompanyBookSuccess = useCallback((fields: Record<string, unknown>) => {
    const fieldMap: Record<string, keyof ClientFormInputValues> = {
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

  useEffect(() => {
    if (clientCreationMode !== "manual") {
      duplicateCheckRequestRef.current += 1;
      setIsCheckingClientIdentifier(false);
      clearDuplicateBulstatError();
      return;
    }

    const normalizedBulstat = getDigitsOnly(formValues.bulstatNumber || "");
    const hasNonDuplicateError =
      Boolean(bulstatFieldError) && bulstatFieldError?.type !== "duplicate";

    if (!normalizedBulstat || hasNonDuplicateError) {
      duplicateCheckRequestRef.current += 1;
      setIsCheckingClientIdentifier(false);
      clearDuplicateBulstatError();
      return;
    }

    clearDuplicateBulstatError();
    const requestId = duplicateCheckRequestRef.current + 1;
    duplicateCheckRequestRef.current = requestId;

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsCheckingClientIdentifier(true);
        const params = new URLSearchParams({
          bulstatNumber: normalizedBulstat,
          uicType: formValues.uicType || "BULSTAT",
        });
        const response = await fetch(`/api/clients?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) return;

        const payload = (await response.json()) as {
          exists?: boolean;
          message?: string | null;
        };

        if (duplicateCheckRequestRef.current !== requestId) return;

        if (payload.exists) {
          form.setError("bulstatNumber", {
            type: "duplicate",
            message: payload.message || "Вече имате клиент с този ЕИК/БУЛСТАТ.",
          });
          return;
        }

        clearDuplicateBulstatError();
      } catch {
        // Best-effort client-side duplicate check only.
      } finally {
        if (duplicateCheckRequestRef.current === requestId) {
          setIsCheckingClientIdentifier(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    bulstatFieldError,
    clearDuplicateBulstatError,
    clientCreationMode,
    form,
    formValues.bulstatNumber,
    formValues.uicType,
  ]);

  async function onSubmit(data: ClientFormValues) {
    // Guard against double submission in the same render frame
    if (isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          entryMode: clientCreationMode || "manual",
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
          details?: Array<{ path?: string[]; message?: string }>;
        } | null;
        const invalidFields = applyApiValidationDetails(form, errorPayload?.details);
        if (invalidFields.length > 0) {
          setCurrentStep(getStepForClientField(invalidFields[0] as string));
        }
        throw new Error(errorPayload?.error || "Неуспешно създаване на клиент");
      }

      const created = await response.json();
      toast.success("Клиентът е създаден", {
        description: "Вашият клиент беше създаден успешно.",
        action: {
          label: "Виж клиента",
          onClick: () => router.push(`/clients/${created.id}`),
        },
      });

      const returnTo = searchParams.get("returnTo");
      router.push(returnTo || `/clients/${created.id}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Възникна грешка при създаване на клиента. Моля, опитайте отново.";
      console.warn("Грешка при създаване на клиент:", errorMessage);
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
        const bulstatDigits = getDigitsOnly(formValues.bulstatNumber || "");
        const hasRequiredBulstat = bulstatDigits.length >= 9;
        return hasRequiredBulstat;
      }
      default:
        return true;
    }
  };

  const handleInvalidSubmit = (errors: typeof form.formState.errors) => {
    const firstField = Object.keys(errors)[0];
    setCurrentStep(getStepForClientField(firstField));
    toast.error("Моля, коригирайте отбелязаните полета.");
  };

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

      {!clientCreationMode ? (
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/50 px-4 py-3.5 text-center">
            <h2 className="text-base font-semibold tracking-tight text-foreground">Как искате да създадете клиента?</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Изберете начин на въвеждане на данните.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {canUseEikSearch ? (
              <ModeOptionCard
                title="Автоматично попълване с ЕИК"
                description="Въвеждате ЕИК/БУЛСТАТ, проверяваме фирмата и попълваме наличните данни вместо вас."
                caption="Подходящо за български фирми, когато искате да спестите ръчно попълване."
                onClick={() => handleCreationModeSelect("eik")}
                icon={<Search className="h-5 w-5" />}
              />
            ) : (
              <ProFeatureLock
                requiredPlan="STARTER"
                currentPlan={plan}
                featureName="Търсенето по ЕИК"
                message="Попълвайте клиент с един клик от Регистъра (ЕИК/БУЛСТАТ). Доступно от план Стартер."
                variant="overlay"
                showUpgradeLink
                isUpgradeLoading={eikCheckoutLoading}
                onUpgradeClick={async () => {
                  setEikCheckoutLoading(true);
                  try {
                    await createCheckoutSession("STARTER", "yearly");
                  } finally {
                    setEikCheckoutLoading(false);
                  }
                }}
              >
                <div className="rounded-2xl border border-border/70 bg-card text-left">
                  <div className="space-y-2.5 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
                        <Search className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold tracking-tight text-foreground">Автоматично попълване с ЕИК</h3>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          Въвеждате ЕИК/БУЛСТАТ, проверяваме фирмата и попълваме данните вместо вас.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                      Подходящо за български фирми.
                    </div>
                  </div>
                </div>
              </ProFeatureLock>
            )}
            <ModeOptionCard
              title="Ръчно попълване"
              description="Въвеждате данните на клиента сами и контролирате всяко поле."
              caption="Подходящо за чуждестранни клиенти, физически лица или когато данните не идват от регистър."
              onClick={() => handleCreationModeSelect("manual")}
              icon={<FilePenLine className="h-5 w-5" />}
            />
          </div>
        </div>
      ) : (
        <>
      <div className="mx-auto mb-6 max-w-4xl">
        <Card className="overflow-hidden border-border/70 bg-linear-to-br from-card via-card to-primary/5 shadow-lg shadow-black/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/15">
                {clientCreationMode === "eik" ? <Search className="h-5 w-5" /> : <FilePenLine className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold tracking-tight">
                  {clientCreationMode === "eik" ? "Автоматично попълване с ЕИК" : "Ръчно попълване"}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {clientCreationMode === "eik"
                    ? "Първо потърсете клиента по ЕИК и след това довършете липсващите данни."
                    : "Попълнете стъпките ръчно. Няма автоматично търсене по регистър в този режим."}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={handleBackToModeSelection} className="w-full sm:w-auto">
              Назад към избор
            </Button>
          </CardContent>
        </Card>
      </div>

      {clientCreationMode === "eik" && (
        <div className="mx-auto mb-6 max-w-2xl">
          <ProFeatureLock
            requiredPlan="STARTER"
            currentPlan={plan}
            featureName="Търсенето по ЕИК"
            message="Попълвайте клиент с един клик от Регистъра (ЕИК/БУЛСТАТ). Доступно от план Стартер."
            variant="overlay"
            showUpgradeLink
            isUpgradeLoading={eikCheckoutLoading}
            onUpgradeClick={async () => {
              setEikCheckoutLoading(true);
              try {
                await createCheckoutSession("STARTER", "yearly");
              } finally {
                setEikCheckoutLoading(false);
              }
            }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="space-y-4 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Search className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">Бързо попълване по ЕИК</h3>
                    <p className="text-xs text-muted-foreground">Въведете ЕИК/БУЛСТАТ и данните ще се попълнят автоматично от Търговския регистър.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Въведете ЕИК (напр. 175074752)"
                    inputMode="numeric"
                    className="h-11 flex-1"
                    value={formValues.bulstatNumber || ""}
                    onChange={(e) => form.setValue("bulstatNumber", e.target.value.replace(/\D/g, ""), { shouldValidate: true })}
                  />
                  <Button
                    type="button"
                    variant="default"
                    className="h-11 w-full shrink-0 gap-2 px-4 sm:w-auto"
                    disabled={!canUseEikSearch || isLookupLoading || !(formValues.bulstatNumber || "").match(/^\d{9,13}$/)}
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
                <p className="text-xs text-muted-foreground">
                  Най-добър резултат ще получите с 9 до 13 цифри, без интервали и символи.
                </p>
              </CardContent>
            </Card>
          </ProFeatureLock>
        </div>
      )}

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} steps={steps} />

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}>
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
                                      "h-12 pr-10 transition-[border-color,box-shadow] duration-150",
                                      isValidState && "border-emerald-500 focus-visible:ring-emerald-500/20",
                                      isInvalidState && "border-destructive focus-visible:ring-destructive/20",
                                    ].filter(Boolean).join(" ")}
                                    {...field}
                                  />
                                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                    {isValidState && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                                    {isInvalidState && <XCircle className="h-5 w-5 text-destructive" />}
                                    {!isDirty && <Mail className="h-4 w-4 text-muted-foreground" />}
                                  </div>
                                </div>
                              </FormControl>
                              {isInvalidState && (
                                <div className="flex items-center gap-1.5 pt-1 text-sm text-destructive">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  <FormMessage />
                                </div>
                              )}
                              {isValidState && (
                                <p className="flex items-center gap-1.5 pt-1 text-xs text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Имейлът изглежда правилен
                                </p>
                              )}
                              {!isDirty && (
                                <p className="text-xs text-muted-foreground">
                                  По избор. Ако е попълнен, може да се ползва за изпращане на фактури.
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
                            <p className="text-xs text-muted-foreground">
                              По избор. Само цифри, без интервали и символи.
                            </p>
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
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <NumericInput
                                  allowDecimal={false}
                                  inputMode="numeric"
                                  placeholder="175074752"
                                  className="h-12 flex-1"
                                  value={field.value || ""}
                                  onChange={(e) => field.onChange(getDigitsOnly(e.target.value))}
                                />
                                {clientCreationMode === "eik" && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="h-12 w-full shrink-0 px-3 sm:w-auto"
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
                                )}
                              </div>
                            </FormControl>
                            <FormDescription>
                              {clientCreationMode === "eik"
                                ? "Може да заредите данни по ЕИК или да редактирате полето ръчно."
                                : isCheckingClientIdentifier
                                  ? "Проверяваме във вашата база дали този идентификатор вече се използва."
                                  : "В ръчен режим проверяваме само дали идентификаторът вече съществува във вашата база."}
                            </FormDescription>
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
                              <Input placeholder="BG175074752" className="h-12" {...field} />
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
                          <p className="text-sm text-muted-foreground">Регистрация по ЗДДС</p>
                          <p className="font-medium">{formValues.vatRegistered ? "Да" : "Не"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">МОЛ</p>
                          <p className="font-medium wrap-anywhere">{formValues.mol || "—"}</p>
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Confirmation checkbox — below preview card */}
                <div className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${confirmed ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <input
                    id="confirm-client"
                    type="checkbox"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-2 border-primary/40 bg-background accent-primary"
                    aria-label="Потвърждавам данните за клиента"
                  />
                  <div className="flex-1 space-y-1">
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
          <div className="sticky bottom-0 z-20 -mx-1 rounded-2xl border border-border/70 bg-background/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/85 sm:static sm:mx-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:backdrop-blur-0">
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground sm:hidden">
              <span className="font-medium text-foreground">{currentStepTitle}</span>
              <span>
                Стъпка {currentStep + 1} от {steps.length}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:border-t sm:pt-6">
              <div className="flex">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="h-11 w-full gap-2 justify-center"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Назад
                </Button>
              </div>

              <div className="flex">
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    disabled={!canProceed()}
                    className="h-11 w-full gap-2 justify-center"
                  >
                    Напред
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isLoading || !confirmed}
                    className="h-11 w-full gap-2 justify-center border-0 gradient-primary hover:shadow-md hover:ring-2 hover:ring-emerald-400/25 disabled:opacity-50"
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
        </>
      )}
    </div>
  );
}

export default function NewClientPage() {
  return (
    <Suspense fallback={null}>
      <NewClientPageContent />
    </Suspense>
  );
}
