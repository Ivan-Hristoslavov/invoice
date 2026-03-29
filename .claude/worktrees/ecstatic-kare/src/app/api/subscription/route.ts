import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveSessionUser } from '@/lib/session-user';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
      // Get user's subscription from database
      const { data: subscription, error } = await supabaseAdmin
        .from('Subscription')
        .select(`
          id,
          plan,
          status,
          cancelAtPeriodEnd,
          currentPeriodEnd,
          stripeSubscriptionId,
          priceId,
          currentPeriodStart,
          createdAt,
          updatedAt
        `)
        .eq('userId', sessionUser.id)
        .in('status', ['ACTIVE', 'TRIALING', 'PAST_DUE'])
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        return NextResponse.json(
          { error: 'Неуспешно зареждане на абонамента' },
          { status: 503 }
        );
      }

      // Get payment history if subscription exists
      let paymentHistory: any[] = [];
      let history: any[] = [];

      if (subscription) {
        const { data: payments } = await supabaseAdmin
          .from('SubscriptionPayment')
          .select('*')
          .eq('subscriptionId', subscription.id)
          .order('createdAt', { ascending: false });

        const { data: statusHistory } = await supabaseAdmin
          .from('SubscriptionHistory')
          .select('*')
          .eq('subscriptionId', subscription.id)
          .order('createdAt', { ascending: false });

        paymentHistory = payments || [];
        history = statusHistory || [];
      }

      if (!subscription) {
        // Default to FREE plan if no subscription exists
        return NextResponse.json({
          subscription: {
            id: 'free-plan',
            plan: 'FREE',
            status: 'ACTIVE',
            cancelAtPeriodEnd: false,
            currentPeriodEnd: null,
            paymentHistory: [],
            history: [],
          },
        });
      }

      return NextResponse.json({ 
        subscription: {
          ...subscription,
          paymentHistory,
          history
        }
      });
    } catch (dbError: any) {
      console.warn('Database error fetching subscription:', dbError.message);
      return NextResponse.json(
        { error: 'Неуспешно зареждане на абонамента' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
