import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createAdminClient } from '@/lib/supabase/server';

// Plan feature limits
export const PLAN_LIMITS = {
  FREE: {
    maxInvoicesPerMonth: 3,
    maxCompanies: 1,
    maxClients: 5,
    maxProducts: 10,
    allowCustomBranding: false, // No logo
    allowExport: false, // No export
    allowCreditNotes: false, // No credit notes
    allowEmailSending: true, // TEMPORARILY UNLOCKED FOR TESTING
    maxUsers: 1,
    allowApiAccess: false,
    storageLimit: 50 * 1024 * 1024, // 50MB
  },
  STARTER: {
    maxInvoicesPerMonth: 15,
    maxCompanies: 1,
    maxClients: 25,
    maxProducts: 50,
    allowCustomBranding: false, // No logo
    allowExport: 'csv', // CSV only
    allowCreditNotes: false, // No credit notes
    allowEmailSending: true, // TEMPORARILY UNLOCKED FOR TESTING
    maxUsers: 1,
    allowApiAccess: false,
    storageLimit: 200 * 1024 * 1024, // 200MB
  },
  PRO: {
    maxInvoicesPerMonth: Infinity,
    maxCompanies: 3,
    maxClients: 100,
    maxProducts: 200,
    allowCustomBranding: true, // With logo
    allowExport: true, // PDF/CSV export
    allowCreditNotes: true, // Credit notes
    allowEmailSending: true, // Email sending
    maxUsers: 2,
    allowApiAccess: false,
    storageLimit: 1024 * 1024 * 1024, // 1GB
  },
  BUSINESS: {
    maxInvoicesPerMonth: Infinity,
    maxCompanies: 10,
    maxClients: Infinity, // Unlimited clients
    maxProducts: Infinity, // Unlimited products
    allowCustomBranding: true, // With logo
    allowExport: true, // PDF/CSV export
    allowCreditNotes: true, // Credit notes
    allowEmailSending: true, // Email sending
    maxUsers: 5, // Multiple users with roles
    allowApiAccess: true, // Read-only API
    storageLimit: 10 * 1024 * 1024 * 1024, // 10GB
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
  const supabase = createAdminClient();
  const { data: subscriptions } = await supabase
    .from('Subscription')
    .select('*')
    .eq('userId', session.user.id as string)
    .in('status', ['ACTIVE', 'TRIALING', 'PAST_DUE'])
    .limit(1);
  
  const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

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
  feature: 'invoices' | 'companies' | 'clients' | 'products' | 'customBranding' | 'export' | 'creditNotes' | 'emailSending' | 'apiAccess' | 'users'
): Promise<{ allowed: boolean; message?: string; plan?: string }> {
  // Get active subscription (or FREE if no subscription)
  const supabase = createAdminClient();
  const { data: subscriptions } = await supabase
    .from('Subscription')
    .select('*')
    .eq('userId', userId)
    .in('status', ['ACTIVE', 'TRIALING', 'PAST_DUE'])
    .limit(1);
  
  const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

  // No subscription = FREE plan
  const plan = (subscription?.plan || 'FREE') as keyof typeof PLAN_LIMITS;
  const limits = PLAN_LIMITS[plan];

  switch (feature) {
    case 'invoices':
      // Check invoice count for current month
      if (limits.maxInvoicesPerMonth !== Infinity) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const { count: invoiceCount } = await supabase
          .from('Invoice')
          .select('*', { count: 'exact', head: true })
          .eq('userId', userId)
          .gte('createdAt', startOfMonth.toISOString());
        
        if (invoiceCount !== null && invoiceCount >= limits.maxInvoicesPerMonth) {
          let upgradeMessage = '';
          if (plan === 'FREE') {
            upgradeMessage = 'Надградете до STARTER за до 15 фактури/месец или до PRO за неограничени фактури.';
          } else if (plan === 'STARTER') {
            upgradeMessage = 'Надградете до PRO за неограничени фактури.';
          }
          
          return {
            allowed: false,
            plan,
            message: `Вашият ${plan} план позволява максимум ${limits.maxInvoicesPerMonth} фактури на месец. ${upgradeMessage}`,
          };
        }
      }
      break;

    case 'companies':
      // Check company count
      if (limits.maxCompanies !== Infinity) {
        const { count: companyCount } = await supabase
          .from('Company')
          .select('*', { count: 'exact', head: true })
          .eq('userId', userId);
        
        if (companyCount && companyCount >= limits.maxCompanies) {
          const upgradeMessage = plan === 'FREE' || plan === 'STARTER'
            ? 'Надградете до PRO за до 3 фирми или до BUSINESS за до 10 фирми.'
            : 'Надградете до BUSINESS за до 10 фирми.';
          
          return {
            allowed: false,
            plan,
            message: `Вашият ${plan} план позволява максимум ${limits.maxCompanies} ${limits.maxCompanies === 1 ? 'фирма' : 'фирми'}. ${upgradeMessage}`,
          };
        }
      }
      break;

    case 'clients':
      // Check client count
      if (limits.maxClients !== Infinity) {
        const { count: clientCount } = await supabase
          .from('Client')
          .select('*', { count: 'exact', head: true })
          .eq('userId', userId);
        
        if (clientCount && clientCount >= limits.maxClients) {
          let upgradeMessage = '';
          if (plan === 'FREE') {
            upgradeMessage = 'Надградете до STARTER за до 25 клиенти или до PRO за до 100 клиенти.';
          } else if (plan === 'STARTER') {
            upgradeMessage = 'Надградете до PRO за до 100 клиенти или до BUSINESS за неограничени клиенти.';
          } else {
            upgradeMessage = 'Надградете до BUSINESS за неограничени клиенти.';
          }
          
          return {
            allowed: false,
            plan,
            message: `Вашият ${plan} план позволява максимум ${limits.maxClients} ${limits.maxClients === 1 ? 'клиент' : 'клиенти'}. ${upgradeMessage}`,
          };
        }
      }
      break;

    case 'products':
      // Check product count
      if (limits.maxProducts !== Infinity) {
        const { count: productCount } = await supabase
          .from('Product')
          .select('*', { count: 'exact', head: true })
          .eq('userId', userId);
        
        if (productCount && productCount >= limits.maxProducts) {
          let upgradeMessage = '';
          if (plan === 'FREE') {
            upgradeMessage = 'Надградете до STARTER за до 50 продукти или до PRO за до 200 продукти.';
          } else if (plan === 'STARTER') {
            upgradeMessage = 'Надградете до PRO за до 200 продукти или до BUSINESS за неограничени продукти.';
          } else {
            upgradeMessage = 'Надградете до BUSINESS за неограничени продукти.';
          }
          
          return {
            allowed: false,
            plan,
            message: `Вашият ${plan} план позволява максимум ${limits.maxProducts} ${limits.maxProducts === 1 ? 'продукт' : 'продукти'}. ${upgradeMessage}`,
          };
        }
      }
      break;

    case 'customBranding':
      if (!limits.allowCustomBranding) {
        return {
          allowed: false,
          plan,
          message: `Собствено лого е налично само в PRO и BUSINESS плановете. Надградете за да добавите вашето лого.`,
        };
      }
      break;

    case 'export':
      if (!limits.allowExport) {
        return {
          allowed: false,
          plan,
          message: `Експорт на фактури е наличен само в PRO и BUSINESS плановете. Надградете за да експортирате вашите фактури.`,
        };
      }
      break;

    case 'creditNotes':
      if (!limits.allowCreditNotes) {
        return {
          allowed: false,
          plan,
          message: `Кредитни известия са налични само в PRO и BUSINESS плановете. Надградете за да създавате кредитни известия.`,
        };
      }
      break;

    case 'emailSending':
      if (!limits.allowEmailSending) {
        return {
          allowed: false,
          plan,
          message: `Изпращане на фактури по имейл е налично само в PRO и BUSINESS плановете. Надградете за да изпращате фактури по имейл.`,
        };
      }
      break;

    case 'apiAccess':
      if (!limits.allowApiAccess) {
        return {
          allowed: false,
          plan,
          message: `API достъп е наличен само в BUSINESS плана. Надградете до BUSINESS за API достъп.`,
        };
      }
      break;

    case 'users':
      // Check user count (team members)
      const { count: userCount } = await supabase
        .from('UserRole')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .neq('role', 'OWNER'); // Count team members, not owner
      
      if (userCount && userCount >= limits.maxUsers) {
        return {
          allowed: false,
          plan,
          message: `Вашият ${plan} план позволява максимум ${limits.maxUsers} ${limits.maxUsers === 1 ? 'потребител' : 'потребителя'}. Надградете до BUSINESS за повече потребители.`,
        };
      }
      break;
  }

  return { allowed: true, plan };
} 