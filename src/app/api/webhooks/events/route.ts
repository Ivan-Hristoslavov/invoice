import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { prisma } from "@/lib/db/prisma";

/**
 * API route to retrieve webhook events
 */
export async function GET(req: Request) {
  try {
    // Check authentication - only authenticated admin users can access webhook events
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
    
    // Optional query params for filtering
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100;
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const eventId = searchParams.get('eventId');
    
    // Build query filters
    const filters: any = {};
    
    if (status) {
      filters.status = status;
    }
    
    if (eventType) {
      filters.eventType = eventType;
    }
    
    if (eventId) {
      filters.eventId = eventId;
    }
    
    // Fetch webhook events
    const events = await prisma.webhookEventLog.findMany({
      where: filters,
      orderBy: {
        processedAt: 'desc'
      },
      take: Math.min(limit, 500), // Cap at 500 to prevent overloading
    });
    
    return NextResponse.json({ 
      events,
      count: events.length
    });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 