import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resolveSessionUser } from '@/lib/session-user';
import { getSubscriptionPayloadForUser } from '@/lib/server/subscription-payloads';

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
      const subscription = await getSubscriptionPayloadForUser(sessionUser.id);
      return NextResponse.json({ subscription });
    } catch (dbError: unknown) {
      console.warn('Database error fetching subscription:', dbError);
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
