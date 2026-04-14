"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyBookLookup } from "@/hooks/useCompanyBookLookup";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateBulgarianPartyInput } from "@/lib/bulgarian-party";
import { applyApiValidationDetails } from "@/lib/form-errors";
import { useSubscriptionLimit } from "@/hooks/useSubscriptionLimit";
import { ViesLookupPanel } from "@/components/parties/ViesLookupPanel";

const companyInfoSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Името на компанията е задължително"),
  email: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().email("Моля, въведете валиден имейл адрес").optional()
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
  vatRegistered: z.boolean(),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mol: z.string().min(1, "МОЛ (материално отговорно лице) е задължително"),
  accountablePerson: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).optional(),
  stripeAccountId: z.string().optional().or(z.literal("")),
  viesLastCheckAt: z.string().optional().nullable(),
  viesValid: z.boolean().optional().nullable(),
  viesCountryCode: z.string().max(2).optional().nullable(),
  viesNumberLocal: z.string().max(64).optional().nullable(),
  viesTraderName: z.string().optional().nullable(),
  viesTraderAddress: z.string().optional().nullable(),
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

const bankInfoSchema = z.object({
  id: z.string().optional(),
  bankName: z.string().optional().or(z.literal("")),
  bankSwift: z.string().optional().or(z.literal("")),
  bankIban: z.string().optional().or(z.literal("")),
});

type CompanyInfoValues = z.infer<typeof companyInfoSchema>;
type BankInfoValues = z.infer<typeof bankInfoSchema>;

interface CompanyFormProps {
  defaultValues: Partial<CompanyInfoValues & BankInfoValues>;
  isBankInfo?: boolean;
  isNewCompany?: boolean;
}

export function CompanyForm({ defaultValues, isBankInfo = false, isNewCompany = false }: CompanyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // We need to create conditionally different form JSX based on the type
  if (isBankInfo) {
    return <BankInfoForm 
      defaultValues={defaultValues as Partial<BankInfoValues>} 
      isNewCompany={isNewCompany} 
    />;
  } else {
    return <CompanyInfoForm 
      defaultValues={defaultValues as Partial<CompanyInfoValues>} 
      isNewCompany={isNewCompany} 
    />;
  }
}

interface CompanyInfoFormProps {
  defaultValues: Partial<CompanyInfoValues>;
  isNewCompany?: boolean;
}

function CompanyInfoForm({ defaultValues, isNewCompany = false }: CompanyInfoFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { plan, canUseFeature } = useSubscriptionLimit();
  const canUseVies = canUseFeature("eikSearch");

  const form = useForm<CompanyInfoValues, unknown, CompanyInfoValues>({
    resolver: zodResolver(companyInfoSchema) as any,
    defaultValues: {
      ...defaultValues,
      country: defaultValues.country || "България",
      vatRegistered: defaultValues.vatRegistered ?? false,
      uicType: defaultValues.uicType || "BULSTAT",
      viesLastCheckAt: defaultValues.viesLastCheckAt ?? null,
      viesValid: defaultValues.viesValid ?? null,
      viesCountryCode: defaultValues.viesCountryCode ?? null,
      viesNumberLocal: defaultValues.viesNumberLocal ?? null,
      viesTraderName: defaultValues.viesTraderName ?? null,
      viesTraderAddress: defaultValues.viesTraderAddress ?? null,
    },
  });

  const handleCompanyBookSuccess = useCallback((fields: Record<string, unknown>) => {
    const fieldMap: Record<string, keyof CompanyInfoValues> = {
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

  async function onSubmit(data: CompanyInfoValues) {
    setIsLoading(true);
    
    try {
      const endpoint = isNewCompany ? "/api/companies" : `/api/companies/${data.id}`;
      const method = isNewCompany ? "POST" : "PUT";
      
      const response = await fetch(endpoint, {
        method,
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
        applyApiValidationDetails(form, errorPayload?.details);
        throw new Error(
          errorPayload?.error || `Неуспешно ${isNewCompany ? "създаване" : "обновяване"} на информацията за компанията`
        );
      }
      
      toast.success(`Компанията ${isNewCompany ? "създадена" : "обновена"}`, {
        description: `Информацията за вашата компания беше успешно ${isNewCompany ? "създадена" : "обновена"}.`
      });
      
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Възникна грешка при ${isNewCompany ? "създаване" : "обновяване"} на вашата компания. Моля, опитайте отново.`;
      console.warn(`Грешка при ${isNewCompany ? "създаване" : "обновяване"} на компанията:`, errorMessage);
      toast.error("Грешка", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const bulstatValue = form.watch("bulstatNumber");
  const viesLast = form.watch("viesLastCheckAt");
  const viesOk = form.watch("viesValid");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...form.register("viesLastCheckAt")} />
        <input type="hidden" {...form.register("viesValid")} />
        <input type="hidden" {...form.register("viesCountryCode")} />
        <input type="hidden" {...form.register("viesNumberLocal")} />
        <input type="hidden" {...form.register("viesTraderName")} />
        <input type="hidden" {...form.register("viesTraderAddress")} />
        {/* Quick EIK Lookup */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
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
              placeholder="Въведете ЕИК (напр. 175074752)"
              inputMode="numeric"
              className="flex-1"
              value={bulstatValue || ""}
              onChange={(e) => form.setValue("bulstatNumber", e.target.value.replace(/\D/g, ""), { shouldValidate: true })}
            />
            <Button
              type="button"
              variant="default"
              className="px-4 shrink-0 gap-2"
              disabled={isLookupLoading || !(bulstatValue || "").match(/^\d{9,13}$/)}
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
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Име на компанията *</FormLabel>
              <FormControl>
                <Input placeholder="Име на вашата компания" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Имейл</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="company@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Телефон</FormLabel>
                <FormControl>
                  <Input placeholder="+359 2 123 4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Адрес *</FormLabel>
              <FormControl>
                <Input placeholder="ул. Бизнес 123" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Град *</FormLabel>
                <FormControl>
                  <Input placeholder="Град" {...field} />
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
                  <Input placeholder="Област" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Държава</FormLabel>
              <FormControl>
                <Input placeholder="България" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="vatNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ДДС номер</FormLabel>
                <FormControl>
                  <Input placeholder="ЕС ДДС номер" {...field} />
                </FormControl>
                <FormDescription>
                  Необходимо за бизнеси в ЕС
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="taxIdNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Данъчен номер</FormLabel>
                <FormControl>
                  <Input placeholder="Данъчен идентификационен номер" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="registrationNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Регистрационен номер</FormLabel>
              <FormControl>
                <Input placeholder="Регистрационен номер на компанията" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Bulgarian NAP compliance fields */}
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Съответствие с българската данъчна система (НАП)</h3>
          
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
                        placeholder="Например: 175074752"
                        inputMode="numeric"
                        className="flex-1"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3 shrink-0"
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
                  <FormDescription>
                    Въведете ЕИК и натиснете „Зареди" за автоматично попълване
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
                  <FormLabel>Тип ЕИК/БУЛСТАТ</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Изберете тип" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BULSTAT">БУЛСТАТ</SelectItem>
                      <SelectItem value="EGN">ЕГН</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Тип на идентификатора (БУЛСТАТ за компании, ЕГН за физически лица)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-4">
            <FormField
              control={form.control}
              name="vatRegistered"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Регистрация по ЗДДС</FormLabel>
                    <FormDescription>
                      Компанията е регистрирана по ЗДДС
                    </FormDescription>
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
                    <Input placeholder="Например: BG175074752" {...field} />
                  </FormControl>
                  <FormDescription>
                    № по ЗДДС (Задължително, ако сте регистрирани по ДДС)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4">
            <ViesLookupPanel
              control={form.control}
              getValues={form.getValues}
              setValue={form.setValue}
              vatField="vatRegistrationNumber"
              currentPlan={plan}
              canUseVies={canUseVies}
            />
            {viesLast && (
              <p className="mt-2 text-xs text-muted-foreground">
                Последна проверка в VIES: {new Date(viesLast).toLocaleString("bg-BG")}
                {viesOk === true ? " — отговор: валиден" : ""}
                {viesOk === false ? " — отговор: невалиден" : ""}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-4">
            <FormField
              control={form.control}
              name="mol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>МОЛ (Представляващ) *</FormLabel>
                  <FormControl>
                    <Input placeholder="Име на представляващия" {...field} />
                  </FormControl>
                  <FormDescription>
                    Материално отговорно лице / Представляващ компанията
                  </FormDescription>
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
                    <Input placeholder="Име на счетоводителя" {...field} />
                  </FormControl>
                  <FormDescription>
                    Лице, отговорно за счетоводството
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-8">
          <Button type="submit" className="gradient-primary border-0 hover:shadow-md hover:ring-2 hover:ring-emerald-400/25" disabled={isLoading}>
            {isLoading ? "Запазване..." : isNewCompany ? "Създаване на компания" : "Запазване на промените"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface BankInfoFormProps {
  defaultValues: Partial<BankInfoValues>;
  isNewCompany?: boolean;
}

function BankInfoForm({ defaultValues, isNewCompany = false }: BankInfoFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BankInfoValues>({
    resolver: zodResolver(bankInfoSchema),
    defaultValues,
  });

  async function onSubmit(data: BankInfoValues) {
    setIsLoading(true);
    
    try {
      const endpoint = `/api/companies/${data.id}`;
      
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, bankAccount: null }),
      });

      if (!response.ok) {
        throw new Error("Неуспешно обновяване на банковата информация");
      }

      toast.success("Банковата информация е обновена", {
        description: "Банковите ви детайли бяха успешно обновени."
      });
      
      router.refresh();
    } catch (error) {
      console.error("Грешка при обновяване на банковата информация:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при обновяване на банковата информация. Моля, опитайте отново."
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="bankName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Име на банката</FormLabel>
              <FormControl>
                <Input placeholder="Име на банката" {...field} />
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
                <Input placeholder="IBAN" {...field} />
              </FormControl>
              <FormDescription>Международен номер на банковата сметка</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bankSwift"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SWIFT/BIC код</FormLabel>
              <FormControl>
                <Input placeholder="SWIFT код" {...field} />
              </FormControl>
              <FormDescription>
                По избор. За български IBAN често не е нужен за вътрешни преводи; за чужд IBAN е препоръчително.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" className="gradient-primary border-0 hover:shadow-md hover:ring-2 hover:ring-emerald-400/25" disabled={isLoading}>
            {isLoading ? "Запазване..." : "Запазване на банковата информация"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 