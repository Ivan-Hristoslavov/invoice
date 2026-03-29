"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  Building2,
  ChevronDown,
  FilePenLine,
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
import { toast } from "@/lib/toast";
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
import { validateBulgarianPartyInput } from "@/lib/bulgarian-party";
import { applyApiValidationDetails } from "@/lib/form-errors";
import { cn } from "@/lib/utils";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { useSubscription } from "@/hooks/useSubscription";
import { ProFeatureLock } from "@/components/ui/pro-feature-lock";

type CompanySectionStatus = "complete" | "partial" | "missing" | "invalid" | "optional";

function hasMeaningfulValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim().length > 0;
  return value !== null && value !== undefined;
}

function getStatusBadge(status: CompanySectionStatus) {
  switch (status) {
    case "complete":
      return {
        label: "Попълнено",
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      };
    case "invalid":
      return {
        label: "Иска корекция",
        className: "border-destructive/20 bg-destructive/10 text-destructive",
      };
    case "partial":
      return {
        label: "Частично",
        className: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
      };
    case "optional":
      return {
        label: "По избор",
        className: "border-border/70 bg-muted/40 text-muted-foreground",
      };
    default:
      return {
        label: "Липсват данни",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      };
  }
}

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
      className="group relative overflow-hidden rounded-[28px] border border-border/70 bg-card text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-br from-primary/14 via-primary/6 to-transparent opacity-80" />
      <div className="relative space-y-5 p-6 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/15">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
          {caption}
        </div>
      </div>
    </button>
  );
}

function SectionPanel({
  index,
  title,
  description,
  icon,
  badge,
  helperText,
  isOpen,
  onToggle,
  children,
}: {
  index: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: ReturnType<typeof getStatusBadge>;
  helperText: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div data-company-section={index}>
      <Card className={cn("overflow-hidden border-border/70 bg-card/85", isOpen && "border-primary/30 shadow-lg shadow-primary/5")}>
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start gap-4 p-5 text-left sm:p-6"
          aria-expanded={isOpen}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground sm:text-lg">{title}</h3>
              <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", badge.className)}>
                {badge.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            <p className="mt-3 text-xs font-medium text-muted-foreground/90">
              {helperText}
            </p>
          </div>
          <ChevronDown className={cn("mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180 text-foreground")} />
        </button>
        {isOpen && <CardContent className="border-t border-border/60 p-5 pt-5 sm:p-6 sm:pt-6">{children}</CardContent>}
      </Card>
    </div>
  );
}

// Company schema with validation (Bulgarian: name, address, city, Bulstat/EIK, MOL required)
const companySchema = z.object({
  name: z.string().min(1, "Името на компанията е задължително"),
  email: z.string().email("Моля, въведете валиден имейл").optional().or(z.literal("")),
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
}).superRefine((value, ctx) => {
  const { issues } = validateBulgarianPartyInput(value, { requireMol: true });

  for (const issue of issues) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: issue.path,
      message: issue.message,
    });
  }
});

type CompanyFormInputValues = z.input<typeof companySchema>;
type CompanyFormValues = z.output<typeof companySchema>;
type CompanyCreationMode = "eik" | "manual";

function getStepForCompanyField(field?: string) {
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
    case "accountablePerson":
      return 2;
    case "bankName":
    case "bankAccount":
    case "bankSwift":
    case "bankIban":
      return 3;
    default:
      return 0;
  }
}

export default function NewCompanyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<number | null>(0);
  const [confirmed, setConfirmed] = useState(false);
  const [companyCreationMode, setCompanyCreationMode] = useState<CompanyCreationMode | null>(null);
  const [lookupResult, setLookupResult] = useState<Record<string, unknown> | null>(null);
  const [isCheckingBulstatDuplicate, setIsCheckingBulstatDuplicate] = useState(false);
  const duplicateCheckRequestRef = useRef(0);

  const sections = [
    {
      title: "Основни данни",
      description: "Име, имейл и телефон за контакт",
      icon: <Building2 className="h-5 w-5" />,
      fields: ["name", "email", "phone"] as const,
      requiredFields: ["name"] as const,
    },
    {
      title: "Адрес",
      description: "Адрес за фактуриране и местоположение",
      icon: <MapPin className="h-5 w-5" />,
      fields: ["address", "city", "state", "zipCode", "country"] as const,
      requiredFields: ["address", "city"] as const,
    },
    {
      title: "Данъчни данни",
      description: "ЕИК, ЗДДС и представляващо лице",
      icon: <Receipt className="h-5 w-5" />,
      fields: ["bulstatNumber", "uicType", "vatRegistered", "vatRegistrationNumber", "mol", "accountablePerson"] as const,
      requiredFields: ["bulstatNumber", "mol"] as const,
    },
    {
      title: "Банкова сметка",
      description: "Банка, IBAN и SWIFT при нужда",
      icon: <CreditCard className="h-5 w-5" />,
      fields: ["bankName", "bankIban", "bankSwift", "bankAccount"] as const,
      requiredFields: [] as const,
    },
  ];

  const form = useForm<CompanyFormInputValues, unknown, CompanyFormValues>({
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

  const scrollToTop = useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const focusSection = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
    requestAnimationFrame(() => {
      if (typeof window === "undefined") return;
      const section = document.querySelector(`[data-company-section="${stepIndex}"]`);
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const toggleSection = useCallback((stepIndex: number) => {
    setCurrentStep((prevStep) => (prevStep === stepIndex ? null : stepIndex));
  }, []);

  const handleCompanyBookSuccess = useCallback((fields: Record<string, unknown>) => {
    const fieldMap: Record<string, keyof CompanyFormInputValues> = {
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

    setLookupResult(fields);
    setCurrentStep(0);

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
    if (companyCreationMode !== "manual") {
      duplicateCheckRequestRef.current += 1;
      setIsCheckingBulstatDuplicate(false);
      clearDuplicateBulstatError();
      return;
    }

    const normalizedBulstat = (formValues.bulstatNumber || "").replace(/\D/g, "");
    const isBulstat = formValues.uicType !== "EGN";
    // Read field state directly to avoid bulstatFieldError in deps (which causes cancellation loops)
    const currentError = form.getFieldState("bulstatNumber").error;
    const hasNonDuplicateError = Boolean(currentError) && currentError?.type !== "duplicate";

    if (!isBulstat || normalizedBulstat.length < 9 || hasNonDuplicateError) {
      duplicateCheckRequestRef.current += 1;
      setIsCheckingBulstatDuplicate(false);
      clearDuplicateBulstatError();
      return;
    }

    const requestId = duplicateCheckRequestRef.current + 1;
    duplicateCheckRequestRef.current = requestId;

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsCheckingBulstatDuplicate(true);
        const params = new URLSearchParams({
          bulstatNumber: normalizedBulstat,
          uicType: formValues.uicType || "BULSTAT",
        });
        const response = await fetch(`/api/companies?${params.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          exists?: boolean;
          message?: string;
          bulstatNumber?: string;
        };

        if (duplicateCheckRequestRef.current !== requestId) {
          return;
        }

        if (payload.exists) {
          form.setError("bulstatNumber", {
            type: "duplicate",
            message:
              payload.message ||
              "Тази компания е регистрирана и не може да бъде добавена като ваша.",
          });
        } else {
          clearDuplicateBulstatError();
        }
      } catch {
        // Keep duplicate preflight best-effort only; POST remains authoritative.
      } finally {
        if (duplicateCheckRequestRef.current === requestId) {
          setIsCheckingBulstatDuplicate(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    clearDuplicateBulstatError,
    companyCreationMode,
    form,
    formValues.bulstatNumber,
    formValues.uicType,
  ]);

  const handleCreationModeSelect = useCallback((mode: CompanyCreationMode) => {
    setCompanyCreationMode(mode);
    setCurrentStep(0);
    setConfirmed(false);
    setLookupResult(null);
    setIsCheckingBulstatDuplicate(false);
    clearDuplicateBulstatError();
    scrollToTop();
  }, [clearDuplicateBulstatError, scrollToTop]);

  const handleBackToModeSelection = useCallback(() => {
    setCompanyCreationMode(null);
    setCurrentStep(0);
    setConfirmed(false);
    setLookupResult(null);
    setIsCheckingBulstatDuplicate(false);
    clearDuplicateBulstatError();
    scrollToTop();
  }, [clearDuplicateBulstatError, scrollToTop]);

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
        const errorPayload = (await response.json().catch(() => null)) as {
          error?: string;
          details?: Array<{ path?: string[]; message?: string }>;
        } | null;
        const invalidFields = applyApiValidationDetails(form, errorPayload?.details);
        if (invalidFields.length > 0) {
          focusSection(getStepForCompanyField(invalidFields[0] as string));
        }
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

  const fieldLabels: Partial<Record<keyof CompanyFormValues, string>> = {
    name: "име",
    address: "адрес",
    city: "град",
    bulstatNumber: "ЕИК",
    mol: "МОЛ",
  };

  const getSectionStatus = useCallback((section: typeof sections[number]): CompanySectionStatus => {
    const hasErrors = section.fields.some((field) => Boolean(form.formState.errors[field]));
    if (hasErrors) return "invalid";

    const missingRequired = section.requiredFields.filter((field) => !hasMeaningfulValue(formValues[field]));
    if (missingRequired.length > 0) return "missing";

    const hasAnyValue = section.fields.some((field) => hasMeaningfulValue(formValues[field]));
    if (section.requiredFields.length === 0 && !hasAnyValue) return "optional";

    if (section.requiredFields.length > 0) return "complete";

    const allFieldsFilled = section.fields.every((field) => hasMeaningfulValue(formValues[field]));
    if (!allFieldsFilled) return "partial";

    return "complete";
  }, [form.formState.errors, formValues, sections]);

  const getSectionHelperText = useCallback((section: typeof sections[number]) => {
    const missingRequired = section.requiredFields
      .filter((field) => !hasMeaningfulValue(formValues[field]))
      .map((field) => fieldLabels[field] ?? field);

    if (missingRequired.length > 0) {
      return `Липсват: ${missingRequired.join(", ")}.`;
    }

    const filledCount = section.fields.filter((field) => hasMeaningfulValue(formValues[field])).length;
    if (section.requiredFields.length === 0 && filledCount === 0) {
      return "Няма въведени банкови данни. Това поле е по избор.";
    }

    if (getSectionStatus(section) === "invalid") {
      return "Има поле, което иска корекция преди запазване.";
    }

    return `${filledCount} от ${section.fields.length} полета са попълнени.`;
  }, [fieldLabels, formValues, getSectionStatus, sections]);

  const requiredSectionsReady = sections.slice(0, 3).every((section) => {
    const missingRequired = section.requiredFields.some((field) => !hasMeaningfulValue(formValues[field]));
    const hasErrors = section.fields.some((field) => Boolean(form.formState.errors[field]));
    return !missingRequired && !hasErrors;
  });
  const invalidSections = sections
    .slice(0, 3)
    .filter((section) => getSectionStatus(section) === "invalid")
    .map((section) => section.title);
  const missingSections = sections
    .slice(0, 3)
    .filter((section) => getSectionStatus(section) === "missing")
    .map((section) => section.title);
  const submitBlockerMessage = !confirmed
    ? "Потвърдете, че данните са коректни, за да продължите."
    : isCheckingBulstatDuplicate
      ? "Проверяваме дали този ЕИК/БУЛСТАТ вече се използва."
      : bulstatFieldError?.message
        ? bulstatFieldError.message
        : !isValidEmail(formValues.email || "")
          ? "Въведете валиден имейл или оставете полето празно."
          : invalidSections.length > 0
            ? `Има полета за корекция в: ${invalidSections.join(", ")}.`
            : missingSections.length > 0
              ? `Липсват задължителни данни в: ${missingSections.join(", ")}.`
              : "Всичко задължително е попълнено. Може да създадете компанията.";
  const canSubmit =
    confirmed &&
    !isCheckingBulstatDuplicate &&
    isValidEmail(formValues.email || "") &&
    requiredSectionsReady;
  const shouldShowEditableSections = companyCreationMode === "manual" || Boolean(lookupResult);

  const handleInvalidSubmit = useCallback((errors: typeof form.formState.errors) => {
    const firstField = Object.keys(errors)[0];
    focusSection(getStepForCompanyField(firstField));
    toast.error("Моля, коригирайте отбелязаните полета.");
  }, [focusSection]);

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      <div className="mb-4 sm:mb-6">
        <div className="mb-2 flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
            <Link href="/companies">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="page-title truncate">Нова компания</h1>
            <p className="card-description hidden sm:block">Добавете нова компания за издаване на фактури</p>
          </div>
        </div>
      </div>

      {!companyCreationMode ? (
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-border/70 bg-linear-to-br from-card via-card to-primary/5 px-6 py-8 text-center shadow-lg shadow-black/5 sm:px-8 sm:py-10">
            <div className="mx-auto max-w-2xl space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">Как искате да създадете компанията?</h2>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                Изберете най-удобния начин. При автоматично попълване първо търсите по ЕИК, а после редактирате само липсващото.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {canUseEikSearch ? (
              <ModeOptionCard
                title="Автоматично попълване с ЕИК"
                description="Въвеждате ЕИК/БУЛСТАТ, проверяваме фирмата и попълваме наличните данни вместо вас."
                caption="Най-подходящо за бързо създаване и минимална ръчна работа."
                onClick={() => handleCreationModeSelect("eik")}
                icon={<Search className="h-5 w-5" />}
              />
            ) : (
              <ProFeatureLock
                requiredPlan="STARTER"
                currentPlan={plan}
                featureName="Търсенето по ЕИК"
                message="Попълвайте фирма с един клик от Регистъра (ЕИК/БУЛСТАТ). Доступно от план Стартер."
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
                <div className="rounded-[28px] border border-border/70 bg-card text-left">
                  <div className="relative space-y-5 p-6 sm:p-7">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/15">
                        <Search className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold tracking-tight text-foreground">Автоматично попълване с ЕИК</h3>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Въвеждате ЕИК/БУЛСТАТ, проверяваме фирмата и попълваме наличните данни вместо вас.
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                      Подходящо за български фирми, когато искате да спестите ръчно попълване.
                    </div>
                  </div>
                </div>
              </ProFeatureLock>
            )}
            <ModeOptionCard
              title="Ръчно попълване"
              description="Започвате директно с формата и сами решавате кои секции да попълните и редактирате."
              caption="Добър избор за нови фирми, чуждестранни данни или пълен ръчен контрол."
              onClick={() => handleCreationModeSelect("manual")}
              icon={<FilePenLine className="h-5 w-5" />}
            />
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)} className="mx-auto max-w-5xl space-y-6">
            <Card className="overflow-hidden border-border/70 bg-linear-to-br from-card via-card to-primary/5 shadow-lg shadow-black/5">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/15">
                    {companyCreationMode === "eik" ? <Search className="h-5 w-5" /> : <FilePenLine className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-semibold tracking-tight">
                      {companyCreationMode === "eik" ? "Автоматично попълване с ЕИК" : "Ръчно попълване"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {companyCreationMode === "eik"
                        ? "Първо намерете фирмата по ЕИК. После ще видите кои секции са попълнени и кои още искат данни."
                        : "Попълвайте секциите в произволен ред. Статусът им се обновява автоматично."}
                    </p>
                  </div>
                </div>
                <Button type="button" variant="outline" onClick={handleBackToModeSelection} className="w-full sm:w-auto">
                  Назад към избор
                </Button>
              </CardContent>
            </Card>

            {companyCreationMode === "eik" && (
              <ProFeatureLock
                requiredPlan="STARTER"
                currentPlan={plan}
                featureName="Търсенето по ЕИК"
                message="Попълвайте фирма с един клик от Регистъра (ЕИК/БУЛСТАТ). Доступно от план Стартер."
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
                <Card className="overflow-hidden border-primary/20 bg-primary/5">
                  <CardContent className="space-y-4 p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                        <Search className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold">Намерете фирма по ЕИК</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Първо показваме само това поле. След успешно намиране ще отворим редакция на попълнените и липсващите секции.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Input
                        placeholder="Въведете ЕИК (напр. 204676177)"
                        inputMode="numeric"
                        className="h-12 flex-1"
                        value={formValues.bulstatNumber || ""}
                        onChange={(e) => {
                          setLookupResult(null);
                          form.setValue("bulstatNumber", e.target.value.replace(/\D/g, ""), { shouldValidate: true });
                        }}
                      />
                      <Button
                        type="button"
                        className="h-12 w-full gap-2 px-5 sm:w-auto"
                        disabled={!canUseEikSearch || isLookupLoading || !(formValues.bulstatNumber || "").match(/^\d{9,13}$/)}
                        onClick={handleEikLookup}
                      >
                        {isLookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        Зареди данни
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Най-добър резултат ще получите с 9 до 13 цифри, без интервали и символи.
                    </p>
                  </CardContent>
                </Card>
              </ProFeatureLock>
            )}

            {lookupResult && (
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Намерена фирма</p>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">{String(lookupResult.name || formValues.name || "Намерена компания")}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[lookupResult.bulstatNumber || formValues.bulstatNumber, lookupResult.city || formValues.city, lookupResult.address || formValues.address]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-background/80 px-4 py-3 text-sm text-muted-foreground">
                    Прегледайте секциите отдолу и редактирайте само нужните полета.
                  </div>
                </CardContent>
              </Card>
            )}

            {shouldShowEditableSections ? (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {sections.map((section, index) => {
                    const badge = getStatusBadge(getSectionStatus(section));
                    return (
                      <button
                        key={section.title}
                        type="button"
                        onClick={() => focusSection(index)}
                        className={cn(
                          "rounded-2xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                          currentStep === index
                            ? "border-primary/40 bg-primary/8 shadow-md shadow-primary/10"
                            : "border-border/70 bg-card hover:border-primary/30 hover:bg-primary/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">{section.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{getSectionHelperText(section)}</p>
                          </div>
                          <span className={cn("inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-medium", badge.className)}>
                            {badge.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <SectionPanel
                    index={0}
                    title="Основни данни"
                    description="Име на компанията и контакти за фактуриране"
                    icon={<Building2 className="h-5 w-5" />}
                    badge={getStatusBadge(getSectionStatus(sections[0]))}
                    helperText={getSectionHelperText(sections[0])}
                    isOpen={currentStep === 0}
                    onToggle={() => toggleSection(0)}
                  >
                    <div className="grid gap-6 lg:grid-cols-2 [&_label]:text-[15px] [&_label]:font-semibold [&_p]:leading-6">
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
                            <FormItem className="space-y-2">
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
                              <FormDescription className="mt-1 text-xs text-muted-foreground">
                                Имейл за контакт за фактури
                              </FormDescription>
                              {isInvalidState ? (
                                <div className="flex items-center gap-1.5 text-sm text-destructive">
                                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                  <FormMessage />
                                </div>
                              ) : (
                                <FormMessage />
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
                    </div>
                  </SectionPanel>

                  <SectionPanel
                    index={1}
                    title="Адрес"
                    description="Адресът, градът и държавата за фирмата"
                    icon={<MapPin className="h-5 w-5" />}
                    badge={getStatusBadge(getSectionStatus(sections[1]))}
                    helperText={getSectionHelperText(sections[1])}
                    isOpen={currentStep === 1}
                    onToggle={() => toggleSection(1)}
                  >
                    <div className="grid gap-6 lg:grid-cols-2 [&_label]:text-[15px] [&_label]:font-semibold [&_p]:leading-6">
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
                    </div>
                  </SectionPanel>

                  <SectionPanel
                    index={2}
                    title="Данъчни данни"
                    description="ЕИК, ЗДДС и представляващо лице"
                    icon={<Receipt className="h-5 w-5" />}
                    badge={getStatusBadge(getSectionStatus(sections[2]))}
                    helperText={getSectionHelperText(sections[2])}
                    isOpen={currentStep === 2}
                    onToggle={() => toggleSection(2)}
                  >
                    <div className="grid gap-6 lg:grid-cols-2 [&_label]:text-[15px] [&_label]:font-semibold [&_p]:leading-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="bulstatNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>БУЛСТАТ/ЕИК *</FormLabel>
                            <FormControl>
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                  placeholder="123456789"
                                  className="h-12 flex-1"
                                  inputMode="numeric"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                                />
                                {companyCreationMode === "eik" && (
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
                              {companyCreationMode === "eik"
                                ? "Въведете ЕИК и натиснете „Зареди“ за автоматично попълване."
                                : isCheckingBulstatDuplicate
                                  ? "Проверяваме в системата дали този ЕИК/БУЛСТАТ вече се използва."
                                  : "При ръчно попълване само проверяваме дали ЕИК/БУЛСТАТ вече съществува в системата."}
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

                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                      <FormField
                        control={form.control}
                        name="vatRegistered"
                        render={({ field }) => (
                          <FormItem
                            className={cn(
                              "rounded-[28px] border p-5 transition-colors",
                              field.value
                                ? "border-primary/30 bg-primary/6 shadow-sm shadow-primary/10"
                                : "border-border/70 bg-background/70"
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <FormControl>
                                <Checkbox
                                  className="mt-1"
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    const nextChecked = Boolean(checked);
                                    field.onChange(nextChecked);
                                    if (!nextChecked) {
                                      form.setValue("vatRegistrationNumber", "", {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      });
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <FormLabel className="m-0">Регистрация по ЗДДС</FormLabel>
                                  <span
                                    className={cn(
                                      "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium",
                                      field.value
                                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        : "border-border/70 bg-muted/50 text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? "Активна" : "Не е активна"}
                                  </span>
                                </div>
                                <FormDescription className="text-sm leading-6 text-muted-foreground">
                                  Отбележете само ако фирмата е регистрирана по ЗДДС и ДДС номерът трябва да присъства във фактурите.
                                </FormDescription>
                              </div>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="vatRegistrationNumber"
                        render={({ field }) => (
                          <FormItem className="rounded-[28px] border border-border/70 bg-background/70 p-5">
                            <FormLabel>ДДС номер</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="BG123456789"
                                className="h-12"
                                disabled={!form.watch("vatRegistered")}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {form.watch("vatRegistered")
                                ? "Попълнете официалния номер по ЗДДС."
                                : "Полето се активира, когато фирмата е регистрирана по ЗДДС."}
                            </FormDescription>
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
                    </div>
                  </SectionPanel>

                  <SectionPanel
                    index={3}
                    title="Банкова сметка"
                    description="По избор: банка, IBAN, SWIFT и сметка"
                    icon={<CreditCard className="h-5 w-5" />}
                    badge={getStatusBadge(getSectionStatus(sections[3]))}
                    helperText={getSectionHelperText(sections[3])}
                    isOpen={currentStep === 3}
                    onToggle={() => toggleSection(3)}
                  >
                    <div className="grid gap-6 lg:grid-cols-2 [&_label]:text-[15px] [&_label]:font-semibold [&_p]:leading-6">
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
                    </div>
                  </SectionPanel>

                  <div className="mx-auto max-w-5xl">
                    <Card className="overflow-hidden border-border/70 bg-card/90 shadow-lg shadow-black/5">
                      <div className="border-b border-border/60 p-6">
                        <p className="text-sm font-medium text-muted-foreground">Преглед преди създаване</p>
                        <div className="mt-4 flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                            <Building2 className="h-8 w-8" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-2xl font-bold">{formValues.name || "Без име"}</h3>
                            {formValues.email && <p className="text-muted-foreground">{formValues.email}</p>}
                          </div>
                        </div>
                      </div>

                      <CardContent className="space-y-6 p-6">
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
                    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className={cn("text-sm", canSubmit ? "text-muted-foreground" : "text-amber-600 dark:text-amber-400")}>
                        {submitBlockerMessage}
                      </p>
                      <Button
                        type="submit"
                        disabled={isLoading || !canSubmit}
                        className="h-11 w-full justify-center gap-2 border-0 gradient-primary hover:opacity-90 disabled:opacity-50 sm:w-auto sm:min-w-52"
                      >
                        {isLoading ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Създаване...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Създай компания
                          </>
                        )}
                      </Button>
                    </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            ) : (
              <Card className="border-dashed border-border/70 bg-card/60">
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Въведете ЕИК и заредете фирмата, за да се покажат редактиращите секции.
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
      )}
    </div>
  );
}
