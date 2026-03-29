"use client"

import React from 'react';
import { useFormValidation } from '@/hooks/use-form-validation';
import { invoiceSchema } from '@/lib/validations/forms';
import { FormLayout, FormField, FormSection } from '@/components/forms/form-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-utils';
import { useRouter } from 'next/navigation';
import { useWatch } from 'react-hook-form';

interface InvoiceFormProps {
  defaultValues?: any;
  isEditing?: boolean;
}

export function InvoiceForm({ defaultValues, isEditing = false }: InvoiceFormProps) {
  const router = useRouter();
  
  const {
    form,
    isSubmitting,
    handleSubmit,
    FormError
  } = useFormValidation({
    schema: invoiceSchema,
    defaultValues: defaultValues || {
      clientId: '',
      companyId: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'DRAFT',
      reverseCharge: false,
      items: [],
    },
    onSubmit: async (data) => {
      // Simplified for test purposes
      const response = await api.post('/api/invoices', data);
      
      if (!response.success) {
        throw new Error(response.error?.message || 'Грешка при създаване на фактура');
      }
      
      router.push(`/invoices/${(response.data as { id: string }).id}`);
      router.refresh();
    }
  });
  
  const { formState } = form;
  const { errors } = formState;
  const reverseCharge = useWatch({ control: form.control, name: "reverseCharge" });
  const items = useWatch({ control: form.control, name: "items" }) ?? [];
  
  return (
    <FormLayout onSubmit={handleSubmit}>
      <FormError />
      
      <FormSection title="Информация за фактурата">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Клиент"
            error={errors.clientId?.message as string | undefined}
            required
          >
            <select {...form.register("clientId")}>
              <option value="">Изберете клиент</option>
              <option value="1">Тестов Клиент</option>
            </select>
          </FormField>

          <FormField
            label="Компания"
            error={errors.companyId?.message as string | undefined}
            required
          >
            <select {...form.register("companyId")}>
              <option value="">Изберете компания</option>
              <option value="1">Моята Компания</option>
            </select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Дата на издаване"
            error={errors.issueDate?.message as string | undefined}
            required
          >
            <Input
              {...form.register("issueDate")}
              type="date"
            />
          </FormField>

          <FormField
            label="Падеж"
            error={errors.dueDate?.message as string | undefined}
            required
          >
            <Input
              {...form.register("dueDate")}
              type="date"
            />
          </FormField>
        </div>
      </FormSection>
      
      <FormSection title="НАП настройки">
        <FormField label="" error={undefined}>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              {...form.register("reverseCharge")}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Обратно начисляване (чл. 82 ЗДДС)</span>
          </label>
        </FormField>
        {reverseCharge && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
            ⚠️ При обратно начисляване ДДС не се начислява от доставчика
          </div>
        )}
      </FormSection>

      <FormSection title="Артикули">
        <div className="min-h-[100px] border border-dashed p-4 rounded">
          {/* Item rows would be here */}
          {items.map((item, index) => (
            <div key={index} className="mb-3">
              {(item as { taxRate?: number }).taxRate === 0 && (
                <FormField
                  label="Основание за освобождаване от ДДС"
                  error={(errors.items as any)?.[index]?.vatExemptReason?.message}
                >
                  <Input
                    {...form.register(`items.${index}.vatExemptReason`)}
                    placeholder="напр. чл. 69, ал. 2 ЗДДС"
                  />
                </FormField>
              )}
            </div>
          ))}
          <Button
            type="button"
            onClick={() => {}}
          >
            Добави артикул
          </Button>
        </div>
      </FormSection>
      
      <div className="mt-6 flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Отказ
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isEditing ? 'Запази' : 'Създай фактура'}
        </Button>
      </div>
    </FormLayout>
  );
} 