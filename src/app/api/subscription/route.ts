import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaClientInitializationError } from '@prisma/client/runtime/library';

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

    console.log('Fetching subscription for user:', session.user.id);

    try {
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
          history: {
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      console.log('Found subscription:', subscription ? `${subscription.id} (${subscription.plan})` : 'none');

      // Serialize the response to handle Decimal objects
      const serializedSubscription = subscription ? serializeDecimal(subscription) : null;

      return NextResponse.json({ subscription: serializedSubscription });
    } catch (dbError: any) {
      // Check if it's a database connection error
      if (
        dbError instanceof PrismaClientInitializationError ||
        dbError?.name === 'PrismaClientInitializationError' ||
        dbError?.message?.includes("Can't reach database server") ||
        dbError?.message?.includes("P1001")
      ) {
        console.warn('Database connection unavailable, using mock subscription data:', dbError.message);
        
        // Return mock data when database is unavailable
        return NextResponse.json({ 
          subscription: mockSubscription,
          _mock: true // Flag to indicate this is mock data
        });
      }
      
      // Re-throw other database errors
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 