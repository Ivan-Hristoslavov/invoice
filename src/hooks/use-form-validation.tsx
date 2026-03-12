"use client";

import { useState } from "react";
import { useForm, UseFormProps, FieldValues, SubmitHandler, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ErrorMessage } from "@/components/ui/error-message";

interface UseFormValidationOptions<T extends FieldValues> extends UseFormProps<T> {
  schema: z.ZodType<T>;
  onSubmit: SubmitHandler<T>;
  onError?: (error: unknown) => void;
}

interface UseFormValidationReturn<T extends FieldValues> {
  form: UseFormReturn<T>;
  isSubmitting: boolean;
  formError: string | null;
  handleSubmit: () => Promise<void>;
  setFormError: (error: string | null) => void;
  FormError: () => JSX.Element | null;
}

export function useFormValidation<T extends FieldValues>({
  schema,
  onSubmit,
  onError,
  ...formOptions
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<T>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    ...formOptions,
  });

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setFormError(null);
      await form.handleSubmit(onSubmit)();
    } catch (error) {
      console.error("Form submission error:", error);
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Възникна неочаквана грешка");
      }
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const FormError = () => 
    formError ? <ErrorMessage message={formError} type="error" inline showIcon /> : null;

  return {
    form,
    isSubmitting,
    formError,
    handleSubmit,
    setFormError,
    FormError,
  };
} 