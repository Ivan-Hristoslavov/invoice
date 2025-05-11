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

const companyInfoSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Company name is required"),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
  taxIdNumber: z.string().optional().or(z.literal("")),
  registrationNumber: z.string().optional().or(z.literal("")),
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
    defaultValues,
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
        throw new Error(`Failed to ${isNewCompany ? "create" : "update"} company information`);
      }
      
      toast.success(`Company ${isNewCompany ? "created" : "updated"}`, {
        description: `Your company information has been ${isNewCompany ? "created" : "updated"} successfully.`
      });
      
      router.refresh();
      
      // If we just created a new company, reload the page to show both forms properly
      if (isNewCompany) {
        window.location.reload();
      }
    } catch (error) {
      console.error(`Error ${isNewCompany ? "creating" : "updating"} company:`, error);
      toast.error("Error", {
        description: `There was an error ${isNewCompany ? "creating" : "updating"} your company. Please try again.`
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
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Your Company Name" {...field} />
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
                <FormLabel>Email</FormLabel>
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
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Business Street" {...field} />
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
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} />
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
                <FormLabel>State/Province</FormLabel>
                <FormControl>
                  <Input placeholder="State" {...field} />
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
                <FormLabel>ZIP/Postal Code</FormLabel>
                <FormControl>
                  <Input placeholder="12345" {...field} />
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
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input placeholder="Country" {...field} />
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
                <FormLabel>VAT Number</FormLabel>
                <FormControl>
                  <Input placeholder="EU VAT Number" {...field} />
                </FormControl>
                <FormDescription>
                  Required for EU businesses
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
                <FormLabel>Tax ID</FormLabel>
                <FormControl>
                  <Input placeholder="Tax Identification Number" {...field} />
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
              <FormLabel>Registration Number</FormLabel>
              <FormControl>
                <Input placeholder="Company Registration Number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isNewCompany ? "Create Company" : "Save Changes"}
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
        throw new Error("Failed to update bank information");
      }
      
      toast.success("Bank information updated", {
        description: "Your bank details have been updated successfully."
      });
      
      router.refresh();
    } catch (error) {
      console.error("Error updating bank information:", error);
      toast.error("Error", {
        description: "There was an error updating your bank information. Please try again."
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
              <FormLabel>Bank Name</FormLabel>
              <FormControl>
                <Input placeholder="Bank Name" {...field} />
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
              <FormLabel>Account Number</FormLabel>
              <FormControl>
                <Input placeholder="Account Number" {...field} />
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
                <FormLabel>SWIFT/BIC Code</FormLabel>
                <FormControl>
                  <Input placeholder="SWIFT Code" {...field} />
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
            {isLoading ? "Saving..." : "Save Bank Information"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 