import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cancelSubscription } from '@/services/subscription-service';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    // Get session
    const session = await getServerSession();
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { subscriptionId } = await req.json();
    
    if (!subscriptionId) {
      return new NextResponse('Subscription ID is required', { status: 400 });
    }

    // Check if the subscription belongs to the user
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id as string,
      },
    });

    if (!subscription) {
      return new NextResponse('Subscription not found', { status: 404 });
    }

    // Cancel the subscription
    await cancelSubscription(subscriptionId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
} 