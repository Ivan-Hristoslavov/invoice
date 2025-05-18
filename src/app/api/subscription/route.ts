import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';

// Mock subscription data for development when database is unavailable
const mockSubscription = {
  id: 'mock-subscription-id',
  plan: 'BASIC',
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
  statusHistory: [
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
    // Get session
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    try {
      // Try to get the user's subscription from database
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: session.user.id as string,
          status: {
            in: ['ACTIVE', 'TRIALING', 'PAST_DUE']
          }
        },
        include: {
          paymentHistory: {
            select: {
              id: true,
              amount: true,
              currency: true,
              status: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          },
          history: {
            select: {
              id: true,
              status: true,
              event: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      // Format the response
      const formattedSubscription = subscription ? {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        currentPeriodEnd: subscription.currentPeriodEnd,
        paymentHistory: (subscription as any).paymentHistory || [],
        statusHistory: (subscription as any).history || []
      } : null;

      return NextResponse.json({ subscription: formattedSubscription });
    } catch (dbError) {
      console.warn('Database error (using mock data):', dbError);
      
      // In development mode, return mock data instead of failing
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ 
          subscription: mockSubscription,
          mock: true
        });
      }
      
      // In production, propagate the error
      throw dbError;
    }
  } catch (error: any) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get subscription' },
      { status: 500 }
    );
  }
} 