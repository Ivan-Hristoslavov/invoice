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

const profileSchema = z.object({
  name: z.string().min(2, "Името трябва да е поне 2 символа"),
  email: z.string().email("Моля, въведете валиден имейл адрес"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  defaultValues: Partial<ProfileFormValues>;
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsLoading(true);
    
    try {
      // In a real app, this would send the data to the server
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      toast.success("Профилът е обновен", {
        description: "Вашата профилна информация беше успешно обновена."
      });
      
      router.refresh();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Грешка", {
        description: "Възникна грешка при обновяване на профила. Моля, опитайте отново."
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
              <FormLabel>Име</FormLabel>
              <FormControl>
                <Input placeholder="Вашето име" {...field} />
              </FormControl>
              <FormDescription>
                Това е името, което ще се показва във вашия профил
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Имейл</FormLabel>
              <FormControl>
                <Input type="email" placeholder="vashiat.email@example.com" {...field} />
              </FormControl>
              <FormDescription>
                Този имейл ще се използва за известия за акаунта
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Запазване..." : "Запази промените"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 