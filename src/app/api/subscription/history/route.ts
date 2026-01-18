import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from "@/lib/supabase";

/**
 * API endpoint to fetch subscription history with pagination
 */
export async function GET(req: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Неоторизиран достъп', { status: 401 });
    }
    
    // Get pagination parameters from query string
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skipItems = (page - 1) * limit;
    
    // Find the user's active subscription
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('Subscription')
      .select('*')
      .eq('userId', session.user.id)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();
    
    if (subError || !subscription) {
      return NextResponse.json({ 
        message: "Няма активен абонамент",
        payments: [],
        history: [],
        pagination: {
          page,
          limit,
          totalPages: 0,
          totalItems: 0
        }
      });
    }
    
    // Get payment history with pagination
    const { data: payments, count: paymentCount } = await supabaseAdmin
      .from('SubscriptionPayment')
      .select('*', { count: 'exact' })
      .eq('subscriptionId', subscription.id)
      .order('createdAt', { ascending: false })
      .range(skipItems, skipItems + limit - 1);
    
    // Get status history with pagination
    const { data: history, count: statusCount } = await supabaseAdmin
      .from('SubscriptionHistory')
      .select('*', { count: 'exact' })
      .eq('subscriptionId', subscription.id)
      .order('createdAt', { ascending: false })
      .range(skipItems, skipItems + limit - 1);
    
    // Calculate pagination metadata
    const totalPaymentPages = Math.ceil((paymentCount || 0) / limit);
    const totalStatusPages = Math.ceil((statusCount || 0) / limit);
    const totalPages = Math.max(totalPaymentPages, totalStatusPages);
    const totalItems = Math.max(paymentCount || 0, statusCount || 0);
    
    // Serialize any Decimal values to avoid JSON issues
    const serializedPayments = (payments || []).map(payment => ({
      ...payment,
      amount: payment.amount?.toString() || '0',
    }));
    
    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      },
      payments: serializedPayments,
      history: history || [],
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Грешка при зареждане на история на абонамент:', error);
    return new NextResponse('Вътрешна сървърна грешка', { status: 500 });
  }
}
