"use client"

import React from 'react';
import { useFormValidation } from '@/hooks/use-form-validation';
import { invoiceSchema } from '@/lib/validations/forms';
import { FormLayout, FormField, FormSection } from '@/components/forms/form-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-utils';
import { useRouter } from 'next/navigation';

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
      
      <FormSection title="Артикули">
        <div className="min-h-[100px] border border-dashed p-4 rounded">
          {/* Item rows would be here */}
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