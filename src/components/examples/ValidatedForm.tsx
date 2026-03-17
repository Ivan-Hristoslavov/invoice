"use client"

import React from "react";
import { z } from "zod";
import { useFormValidation } from "@/hooks/use-form-validation";
import { clientSchema } from "@/lib/validations/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FormLayout, FormSection, FormField } from "@/components/forms/form-layout";
import { Loading } from "@/components/ui/loading";
import { SuccessAnimation } from "@/components/ui/success-animation";

type ClientFormData = z.infer<typeof clientSchema>;

export function ValidatedClientForm() {
  const [isSuccess, setIsSuccess] = React.useState(false);

  // Използване на нашия хук за валидация на форми
  const {
    form,
    isSubmitting,
    formError,
    handleSubmit,
    FormError
  } = useFormValidation<ClientFormData>({
    schema: clientSchema,
    defaultValues: {
      name: "",
      email: "",
      address: "",
      city: "",
      country: "BG",
    },
    onSubmit: async (data) => {
      // API заявка
      const response = await api.post<ClientFormData>('/api/clients', data);
      
      if (!response.success) {
        throw new Error(response.error?.message || "Грешка при създаване на клиент");
      }
      
      // Успешно създаден клиент
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      
      // Ресет на формата
      form.reset();
    }
  });
  
  // Лесен достъп до полетата от формата
  const { formState } = form;
  const { errors } = formState;
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Добавяне на нов клиент</CardTitle>
      </CardHeader>
      <CardContent>
        <FormLayout onSubmit={handleSubmit}>
          <FormError />
          
          {isSuccess && (
            <SuccessAnimation 
              message="Клиентът беше създаден успешно" 
              duration={3}
            />
          )}
          
          <FormSection title="Основна информация">
            <FormField
              label="Име на клиента"
              error={errors.name?.message}
              required
            >
              <Input
                {...form.register("name")}
                placeholder="Име на фирма или лице"
              />
            </FormField>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Имейл"
                error={errors.email?.message}
              >
                <Input
                  {...form.register("email")}
                  type="email"
                  placeholder="email@example.com"
                />
              </FormField>
              
              <FormField
                label="Телефон"
                error={errors.phone?.message}
              >
                <Input
                  {...form.register("phone")}
                  placeholder="+359 888 123456"
                />
              </FormField>
            </div>
            
            <FormField
              label="ДДС номер"
              error={errors.vat?.message}
            >
              <Input
                {...form.register("vat")}
                placeholder="BG123456789"
              />
            </FormField>
          </FormSection>
          
          <FormSection title="Адрес">
            <FormField
              label="Адрес"
              error={errors.address?.message}
              required
            >
              <Input
                {...form.register("address")}
                placeholder="ул. Примерна 1"
              />
            </FormField>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Град"
                error={errors.city?.message}
                required
              >
                <Input
                  {...form.register("city")}
                  placeholder="София"
                />
              </FormField>
              
              <FormField
                label="Пощенски код"
                error={errors.postalCode?.message}
              >
                <Input
                  {...form.register("postalCode")}
                  placeholder="1000"
                />
              </FormField>
            </div>
            
            <FormField
              label="Държава"
              error={errors.country?.message}
              required
            >
              <Input
                {...form.register("country")}
                placeholder="България"
              />
            </FormField>
          </FormSection>
        </FormLayout>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="mr-2"
          onClick={() => form.reset()}
          disabled={isSubmitting}
        >
          Отказ
        </Button>
        <Button 
          type="submit"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loading variant="spinner" size="sm" className="mr-2" />
              Запазване...
            </>
          ) : "Запази"}
        </Button>
      </CardFooter>
    </Card>
  );
} 