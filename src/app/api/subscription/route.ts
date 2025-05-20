import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

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

// Helper function to serialize Prisma Decimal objects
function serializeDecimal(value: any): any {
  if (value instanceof Decimal) {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(serializeDecimal);
  }
  if (typeof value === 'object' && value !== null) {
    const result: any = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeDecimal(val);
    }
    return result;
  }
  return value;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get user's subscription from database
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        status: {
          in: ['ACTIVE', 'TRIALING', 'PAST_DUE']
        }
      },
      include: {
        paymentHistory: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        statusHistory: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    // Serialize the response to handle Decimal objects
    const serializedSubscription = subscription ? serializeDecimal(subscription) : null;

    return NextResponse.json({ subscription: serializedSubscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 