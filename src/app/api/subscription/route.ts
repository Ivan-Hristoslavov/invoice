import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// Mock subscription data for development when database is unavailable
const mockSubscription = {
  id: 'mock-subscription-id',
  plan: 'FREE',
  status: 'ACTIVE',
  cancelAtPeriodEnd: false,
  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  paymentHistory: [
    {
      id: 'mock-payment-id-1',
      amount: 10,
      currency: 'USD',
      status: 'PAID',
      createdAt: new Date().toISOString()
    }
  ],
  history: [
    {
      id: 'mock-status-id-1',
      status: 'ACTIVE',
      event: 'Subscription created',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    }
  ]
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Fetching subscription for user:', session.user.id);

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
        .eq('userId', session.user.id)
        .in('status', ['ACTIVE', 'TRIALING', 'PAST_DUE'])
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        // Return mock data on error
        return NextResponse.json({ 
          subscription: mockSubscription,
          _mock: true
        });
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

      console.log('Found subscription:', subscription ? `${subscription.id} (${subscription.plan})` : 'none');

      return NextResponse.json({ 
        subscription: subscription ? {
          ...subscription,
          paymentHistory,
          history
        } : null 
      });
    } catch (dbError: any) {
      console.warn('Database error, using mock subscription data:', dbError.message);
      
      // Return mock data when database is unavailable
      return NextResponse.json({ 
        subscription: mockSubscription,
        _mock: true
      });
    }
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
