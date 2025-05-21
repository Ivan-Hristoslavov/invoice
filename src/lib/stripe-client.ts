'use client';

import { getSubscriptionPlans } from './stripe';

// Type definitions for subscription plans
type Feature = string;

interface Plan {
  name: string;
  url: string | undefined;
  price: number;
  priceId: string;
  features: Feature[];
}

interface SubscriptionPlans {
  BASIC: Plan;
  PRO: Plan;
  VIP: Plan;
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
    currency: 'BGN',
  }).format(price);
} 