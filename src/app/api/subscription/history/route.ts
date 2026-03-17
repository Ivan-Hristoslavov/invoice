import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from "@/lib/supabase";
import { resolveSessionUser } from "@/lib/session-user";
import { getStripe } from "@/lib/stripe";
import cuid from "cuid";

/**
 * API endpoint to fetch subscription payment history with pagination.
 * Falls back to querying Stripe directly if local DB has no payments recorded
 * (e.g. webhook didn't fire in development, or stripeSubscriptionId mismatch).
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Неоторизиран достъп', { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return new NextResponse('Неоторизиран достъп', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skipItems = (page - 1) * limit;

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('Subscription')
      .select('*')
      .eq('userId', sessionUser.id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({
        message: "No active subscription found",
        payments: [],
        history: [],
        pagination: { page, limit, totalPages: 0, totalItems: 0, hasMore: false },
      });
    }

    // Get payment history from local DB
    const { data: dbPayments, count: paymentCount } = await supabaseAdmin
      .from('SubscriptionPayment')
      .select('*', { count: 'exact' })
      .eq('subscriptionId', subscription.id)
      .order('createdAt', { ascending: false })
      .range(skipItems, skipItems + limit - 1);

    let serializedPayments = (dbPayments || []).map(p => ({
      ...p,
      amount: p.amount?.toString() || '0',
    }));

    let totalItems = paymentCount || 0;

    // If no payments in DB but we have a Stripe subscription, fetch directly from Stripe
    if (totalItems === 0 && subscription.stripeSubscriptionId) {
      try {
        const stripe = await getStripe();
        const stripeInvoices = await stripe.invoices.list({
          subscription: subscription.stripeSubscriptionId,
          limit: 100,
        });

        const paidInvoices = stripeInvoices.data.filter(inv => inv.status === 'paid');

        // Write them to DB so next load is instant
        if (paidInvoices.length > 0) {
          const inserts = paidInvoices.map(inv => ({
            id: cuid(),
            subscriptionId: subscription.id,
            stripeInvoiceId: inv.id,
            amount: Number((inv.amount_paid || 0) / 100),
            status: 'PAID',
            currency: inv.currency || 'eur',
            paymentMethod: null,
            paymentIntentId: typeof (inv as any).payment_intent === 'string' ? (inv as any).payment_intent : null,
            createdAt: new Date((inv.created || Date.now() / 1000) * 1000).toISOString(),
          }));
          await supabaseAdmin
            .from('SubscriptionPayment')
            .upsert(inserts, { onConflict: 'stripeInvoiceId' });
        }

        totalItems = paidInvoices.length;
        const paginated = paidInvoices.slice(skipItems, skipItems + limit);
        serializedPayments = paginated.map(inv => ({
          id: inv.id,
          subscriptionId: subscription.id,
          stripeInvoiceId: inv.id,
          amount: String(Number((inv.amount_paid || 0) / 100)),
          status: 'PAID',
          currency: inv.currency || 'eur',
          paymentMethod: null,
          paymentIntentId: typeof (inv as any).payment_intent === 'string' ? (inv as any).payment_intent : null,
          createdAt: new Date((inv.created || Date.now() / 1000) * 1000).toISOString(),
        }));
      } catch (stripeErr) {
        console.error('Stripe fallback fetch failed:', stripeErr);
      }
    }

    const totalPages = Math.ceil(totalItems / limit);

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
      payments: serializedPayments,
      history: [],
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error('Грешка при зареждане на история на абонамент:', error);
    return new NextResponse('Вътрешна сървърна грешка', { status: 500 });
  }
}
