import type { ExportCapability } from "@/lib/subscription-plans";

export interface Subscription {
  id: string;
  plan: "FREE" | "STARTER" | "PRO" | "BUSINESS";
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  paymentHistory: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }[];
  history: {
    id: string;
    status: string;
    event: string;
    createdAt: string;
  }[];
}

export interface UsageData {
  plan: string;
  invoices: {
    used: number;
    limit: number;
    periodStart: string;
    periodEnd: string;
  };
  companies: {
    used: number;
    limit: number;
  };
  clients: {
    used: number;
    limit: number;
  };
  products: {
    used: number;
    limit: number;
  };
  users: {
    used: number;
    limit: number;
  };
  features: {
    customBranding: boolean;
    export: ExportCapability;
    creditNotes: boolean;
    emailSending: boolean;
    apiAccess: boolean;
    eikSearch: boolean;
  };
}
