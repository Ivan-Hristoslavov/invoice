export const PLAN_ORDER = ["FREE", "STARTER", "PRO", "BUSINESS"] as const;
export const BILLING_INTERVALS = ["monthly", "yearly"] as const;

export type SubscriptionPlanKey = (typeof PLAN_ORDER)[number];
export type BillingInterval = (typeof BILLING_INTERVALS)[number];
export type ExportCapability = "none" | "csv" | "full";
export type ExportFormat = "csv" | "json" | "pdf";

type StripePlanConfig = {
  monthly: string | null;
  yearly: string | null;
  monthlyUrl?: string | null;
  yearlyUrl?: string | null;
  aliases?: string[];
};

type PlanFeatures = {
  customBranding: boolean;
  export: ExportCapability;
  creditNotes: boolean;
  emailSending: boolean;
  apiAccess: boolean;
  /** Търсене по ЕИК/БУЛСТАТ (CompanyBook API) – налично от план Стартер */
  eikSearch: boolean;
};

type PlanLimits = {
  maxInvoicesPerMonth: number;
  maxCompanies: number;
  maxClients: number;
  maxProducts: number;
  maxUsers: number;
  storageLimit: number;
};

export type SubscriptionPlanDefinition = {
  key: SubscriptionPlanKey;
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: PlanFeatures;
  limits: PlanLimits;
  stripe: StripePlanConfig;
};

const UNLIMITED = Number.POSITIVE_INFINITY;

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanKey, SubscriptionPlanDefinition> = {
  FREE: {
    key: "FREE",
    displayName: "Безплатен",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "За първи стъпки и тестове",
    features: {
      customBranding: false,
      export: "none",
      creditNotes: false,
      emailSending: false,
      apiAccess: false,
      eikSearch: false,
    },
    limits: {
      maxInvoicesPerMonth: 3,
      maxCompanies: 1,
      maxClients: 5,
      maxProducts: 10,
      maxUsers: 1,
      storageLimit: 50 * 1024 * 1024,
    },
    stripe: {
      monthly: null,
      yearly: null,
      monthlyUrl: null,
      yearlyUrl: null,
    },
  },
  STARTER: {
    key: "STARTER",
    displayName: "Стартер",
    monthlyPrice: 4.99,
    yearlyPrice: 49.99,
    description: "За фрийлансъри и микробизнеси",
    features: {
      customBranding: false,
      export: "csv",
      creditNotes: false,
      emailSending: false,
      apiAccess: false,
      eikSearch: true,
    },
    limits: {
      maxInvoicesPerMonth: 15,
      maxCompanies: 1,
      maxClients: 25,
      maxProducts: 50,
      maxUsers: 1,
      storageLimit: 200 * 1024 * 1024,
    },
    stripe: {
      monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || null,
      yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || null,
      monthlyUrl: process.env.STRIPE_STARTER_MONTHLY_URL || null,
      yearlyUrl: process.env.STRIPE_STARTER_YEARLY_URL || null,
    },
  },
  PRO: {
    key: "PRO",
    displayName: "Про",
    monthlyPrice: 8.99,
    yearlyPrice: 89.99,
    description: "За малки бизнеси и растеж",
    features: {
      customBranding: true,
      export: "full",
      creditNotes: true,
      emailSending: true,
      apiAccess: false,
      eikSearch: true,
    },
    limits: {
      maxInvoicesPerMonth: UNLIMITED,
      maxCompanies: 3,
      maxClients: 100,
      maxProducts: 200,
      maxUsers: 2,
      storageLimit: 1024 * 1024 * 1024,
    },
    stripe: {
      monthly:
        process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
        process.env.STRIPE_PRO_PRICE_ID ||
        null,
      yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || null,
      monthlyUrl: process.env.STRIPE_PRO_MONTHLY_URL || null,
      yearlyUrl: process.env.STRIPE_PRO_YEARLY_URL || null,
      aliases: [process.env.STRIPE_PRO_PRICE_ID || ""].filter(Boolean),
    },
  },
  BUSINESS: {
    key: "BUSINESS",
    displayName: "Бизнес",
    monthlyPrice: 19.99,
    yearlyPrice: 199.99,
    description: "За счетоводни екипи и компании с повече обекти",
    features: {
      customBranding: true,
      export: "full",
      creditNotes: true,
      emailSending: true,
      apiAccess: true,
      eikSearch: true,
    },
    limits: {
      maxInvoicesPerMonth: UNLIMITED,
      maxCompanies: 10,
      maxClients: UNLIMITED,
      maxProducts: UNLIMITED,
      maxUsers: 5,
      storageLimit: 10 * 1024 * 1024 * 1024,
    },
    stripe: {
      monthly:
        process.env.STRIPE_BUSINESS_MONTHLY_PRICE_ID ||
        process.env.STRIPE_BUSINESS_PRICE_ID ||
        process.env.STRIPE_BUISNESS_PRICE_ID ||
        null,
      yearly:
        process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID ||
        process.env.STRIPE_BUISNESS_YEARLY_PRICE_ID ||
        null,
      monthlyUrl: process.env.STRIPE_BUSINESS_MONTHLY_URL || null,
      yearlyUrl: process.env.STRIPE_BUSINESS_YEARLY_URL || null,
      aliases: [
        process.env.STRIPE_BUSINESS_PRICE_ID || "",
        process.env.STRIPE_BUISNESS_PRICE_ID || "",
      ].filter(Boolean),
    },
  },
};

export function getSubscriptionPlan(plan?: string | null): SubscriptionPlanDefinition {
  const normalizedPlan = (plan || "FREE") as SubscriptionPlanKey;
  return SUBSCRIPTION_PLANS[normalizedPlan] || SUBSCRIPTION_PLANS.FREE;
}

export function hasPlanAccess(
  currentPlan: string | null | undefined,
  requiredPlan: SubscriptionPlanKey
): boolean {
  const currentIndex = PLAN_ORDER.indexOf((currentPlan || "FREE") as SubscriptionPlanKey);
  const requiredIndex = PLAN_ORDER.indexOf(requiredPlan);
  return (currentIndex === -1 ? 0 : currentIndex) >= requiredIndex;
}

export function getCanonicalPriceId(
  plan: SubscriptionPlanKey,
  interval: BillingInterval
): string | null {
  if (plan === "FREE") return null;
  return SUBSCRIPTION_PLANS[plan].stripe[interval];
}

export function getDirectCheckoutUrl(
  plan: SubscriptionPlanKey,
  interval: BillingInterval
): string | null {
  if (plan === "FREE") return null;
  return interval === "monthly"
    ? SUBSCRIPTION_PLANS[plan].stripe.monthlyUrl || null
    : SUBSCRIPTION_PLANS[plan].stripe.yearlyUrl || null;
}

export function getPlanByPriceId(
  priceId?: string | null
): { plan: SubscriptionPlanKey; interval: BillingInterval } | null {
  if (!priceId) return null;

  for (const planKey of PLAN_ORDER) {
    if (planKey === "FREE") continue;

    const stripeConfig = SUBSCRIPTION_PLANS[planKey].stripe;
    const candidates = [
      stripeConfig.monthly,
      stripeConfig.yearly,
      ...(stripeConfig.aliases || []),
    ].filter(Boolean);

    if (!candidates.includes(priceId)) continue;

    if (priceId === stripeConfig.yearly) {
      return { plan: planKey, interval: "yearly" };
    }

    return { plan: planKey, interval: "monthly" };
  }

  return null;
}

export function getDefaultSubscriptionPlan() {
  return SUBSCRIPTION_PLANS.FREE;
}

export function hasAnyExportAccess(capability: ExportCapability): boolean {
  return capability !== "none";
}

export function hasEikSearchAccess(plan: string | null | undefined): boolean {
  return hasPlanAccess(plan, "STARTER");
}

export function canExportFormat(
  capability: ExportCapability,
  format: ExportFormat
): boolean {
  if (capability === "none") return false;
  if (capability === "csv") return format === "csv";
  return true;
}
