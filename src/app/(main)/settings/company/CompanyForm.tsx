"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const companyInfoSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Името на компанията е задължително"),
  email: z.string().email("Моля, въведете валиден имейл адрес").optional().or(z.literal("")),
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
});

const bankInfoSchema = z.object({
  id: z.string().optional(),
  bankName: z.string().optional().or(z.literal("")),
  bankAccount: z.string().optional().or(z.literal("")),
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

  const form = useForm<CompanyInfoValues>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      ...defaultValues,
      country: defaultValues.country || "България",
      vatRegistered: defaultValues.vatRegistered ?? false,
      uicType: defaultValues.uicType || "BULSTAT",
    },
  });

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
        throw new Error(`Неуспешно ${isNewCompany ? "създаване" : "обновяване"} на информацията за компанията`);
      }
      
      toast.success(`Компанията ${isNewCompany ? "създадена" : "обновена"}`, {
        description: `Информацията за вашата компания беше успешно ${isNewCompany ? "създадена" : "обновена"}.`
      });
      
      router.refresh();
      
      // If we just created a new company, reload the page to show both forms properly
      if (isNewCompany) {
        window.location.reload();
      }
    } catch (error) {
      console.error(`Грешка при ${isNewCompany ? "създаване" : "обновяване"} на компанията:`, error);
      toast.error("Грешка", {
        description: `Възникна грешка при ${isNewCompany ? "създаване" : "обновяване"} на вашата компания. Моля, опитайте отново.`
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
                  <Input placeholder="1000" {...field} />
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
                    <Input placeholder="Например: 123456789" {...field} />
                  </FormControl>
                  <FormDescription>
                    Уникален български идентификатор на компанията
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
                    <Input placeholder="Например: BG123456789" {...field} />
                  </FormControl>
                  <FormDescription>
                    № по ЗДДС (Задължително, ако сте регистрирани по ДДС)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          <Button type="submit" disabled={isLoading}>
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
        body: JSON.stringify(data),
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
          name="bankAccount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Номер на сметка</FormLabel>
              <FormControl>
                <Input placeholder="Номер на сметка" {...field} />
              </FormControl>
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
                  <Input placeholder="SWIFT код" {...field} />
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
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Запазване..." : "Запазване на банковата информация"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 