'use client';

import { getSubscriptionPlans } from './stripe';

// Type definitions for subscription plans
type Feature = string;

interface Plan {
  name: string;
  price: number;
  priceMonthly: number;
  priceYearly: number;
  priceIdMonthly: string | null;
  priceIdYearly: string | null;
  features: Feature[];
  limitations?: Feature[];
  popular?: boolean;
}

interface SubscriptionPlans {
  FREE: Plan;
  PRO: Plan;
  BUSINESS: Plan;
}

// Client-side function to get subscription plans
export async function useSubscriptionPlans(): Promise<SubscriptionPlans> {
  try {
    return await getSubscriptionPlans();
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw new Error('Failed to load subscription plans');
  }
}

// Helper function to format price
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('bg-BG', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
} 