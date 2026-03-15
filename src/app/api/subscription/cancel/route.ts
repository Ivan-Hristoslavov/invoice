import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user's active subscription
    const supabase = createAdminClient();
    const { data: subscription, error: subError } = await supabase
      .from('Subscription')
      .select('*')
      .eq('userId', session.user.id)
      .in('status', ['ACTIVE', 'TRIALING', 'PAST_DUE'])
      .single();

    if (subError || !subscription) {
      return new NextResponse('No active subscription found', { status: 404 });
    }

    // Cancel the subscription in Stripe
    const stripe = await getStripe();
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
    }

    // Update subscription in database
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('Subscription')
      .update({
        cancelAtPeriodEnd: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', subscription.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    // Create history entry
    await supabase.from('SubscriptionHistory').insert({
      subscriptionId: subscription.id,
      status: 'CANCELING',
      event: 'CANCEL_REQUESTED',
    });

    return NextResponse.json({
      message: 'Subscription will be canceled at the end of the billing period',
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 