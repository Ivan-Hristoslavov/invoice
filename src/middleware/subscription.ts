import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

// Plan feature limits
export const PLAN_LIMITS = {
  BASIC: {
    maxClients: 10,
    maxInvoicesPerMonth: 50,
    allowCustomBranding: false,
    allowUnlimitedProducts: false,
  },
  PRO: {
    maxClients: 50,
    maxInvoicesPerMonth: Infinity,
    allowCustomBranding: true,
    allowUnlimitedProducts: true,
  },
  VIP: {
    maxClients: Infinity,
    maxInvoicesPerMonth: Infinity,
    allowCustomBranding: true,
    allowUnlimitedProducts: true,
  },
};

// Middleware to check subscription status
export async function checkSubscription(req: NextRequest) {
  // Get the session
  const session = await getServerSession();

  // If no session, just let the request proceed (Next.js auth will handle redirects)
  if (!session?.user) {
    return NextResponse.next();
  }

  // Get the user's active subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id as string,
      status: {
        in: ['ACTIVE', 'TRIALING', 'PAST_DUE'],
      },
    },
  });

  // If no active subscription, store that info in request headers
  if (!subscription) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-subscription-status', 'none');
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Add subscription information to request headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-subscription-status', subscription.status);
  requestHeaders.set('x-subscription-plan', subscription.plan);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Check if user is allowed to perform an action based on their subscription
export async function checkSubscriptionLimits(
  userId: string, 
  feature: 'clients' | 'invoices' | 'products' | 'customBranding'
): Promise<{ allowed: boolean; message?: string }> {
  // Get active subscription
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: userId,
      status: {
        in: ['ACTIVE', 'TRIALING', 'PAST_DUE'],
      },
    },
  });

  // No subscription = basic features only
  if (!subscription) {
    return {
      allowed: feature === 'clients' || feature === 'invoices',
      message: 'You need a subscription to access this feature.',
    };
  }

  const plan = subscription.plan as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

  switch (feature) {
    case 'clients':
      // Check client count
      const clientCount = await prisma.client.count({
        where: { userId: userId },
      });
      
      if (clientCount >= limits.maxClients) {
        return {
          allowed: false,
          message: `Your ${plan} plan allows a maximum of ${limits.maxClients} clients.`,
        };
      }
      break;

    case 'invoices':
      // Check invoice count for current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const invoiceCount = await prisma.invoice.count({
        where: {
          userId: userId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });
      
      if (invoiceCount >= limits.maxInvoicesPerMonth) {
        return {
          allowed: false,
          message: `Your ${plan} plan allows a maximum of ${limits.maxInvoicesPerMonth} invoices per month.`,
        };
      }
      break;

    case 'customBranding':
      if (!limits.allowCustomBranding) {
        return {
          allowed: false,
          message: `Custom branding is not available in your ${plan} plan.`,
        };
      }
      break;

    case 'products':
      if (!limits.allowUnlimitedProducts) {
        // Check if user has more than 20 products (free tier limit)
        const productCount = await prisma.product.count({
          where: { userId: userId },
        });
        
        if (productCount >= 20) {
          return {
            allowed: false,
            message: `Your ${plan} plan allows a maximum of 20 products.`,
          };
        }
      }
      break;
  }

  return { allowed: true };
} 