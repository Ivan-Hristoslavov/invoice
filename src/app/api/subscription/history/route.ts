import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { prisma } from "@/lib/db/prisma";

/**
 * API endpoint to fetch subscription history with pagination
 */
export async function GET(req: Request) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Get pagination parameters from query string
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skipItems = (page - 1) * limit;
    
    // Find the user's active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (!subscription) {
      return NextResponse.json({ 
        message: "No active subscription found",
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
    const [payments, paymentCount] = await Promise.all([
      prisma.subscriptionPayment.findMany({
        where: {
          subscriptionId: subscription.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: skipItems,
        take: limit
      }),
      prisma.subscriptionPayment.count({
        where: {
          subscriptionId: subscription.id
        }
      })
    ]);
    
    // Get status history with pagination
    const [history, statusCount] = await Promise.all([
      prisma.subscriptionHistory.findMany({
        where: {
          subscriptionId: subscription.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: skipItems,
        take: limit
      }),
      prisma.subscriptionHistory.count({
        where: {
          subscriptionId: subscription.id
        }
      })
    ]);
    
    // Calculate pagination metadata
    const totalPaymentPages = Math.ceil(paymentCount / limit);
    const totalStatusPages = Math.ceil(statusCount / limit);
    const totalPages = Math.max(totalPaymentPages, totalStatusPages);
    const totalItems = Math.max(paymentCount, statusCount);
    
    // Serialize any Decimal values to avoid JSON issues
    const serializedPayments = payments.map(payment => ({
      ...payment,
      amount: payment.amount.toString(),
      createdAt: payment.createdAt.toISOString()
    }));
    
    const serializedHistory = history.map(item => ({
      ...item,
      createdAt: item.createdAt.toISOString()
    }));
    
    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      },
      payments: serializedPayments,
      history: serializedHistory,
      pagination: {
        page,
        limit,
        totalPages,
        totalItems,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching subscription history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 