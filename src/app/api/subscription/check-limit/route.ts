import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkSubscriptionLimits } from '@/middleware/subscription';
import { resolveSessionUser } from '@/lib/session-user';

export async function GET(req: Request) {
  try {
    // Get the session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get the feature to check from query params
    const url = new URL(req.url);
    const feature = url.searchParams.get('feature');
    
    if (!feature) {
      return new NextResponse('Feature parameter is required', { status: 400 });
    }
    
    // Validate feature parameter
    const validFeatures = ['invoices', 'companies', 'customBranding', 'export', 'creditNotes', 'emailSending', 'apiAccess', 'users'];
    if (!validFeatures.includes(feature)) {
      return new NextResponse('Invalid feature parameter', { status: 400 });
    }

    // Check subscription limits
    const checkResult = await checkSubscriptionLimits(
      sessionUser.id,
      feature as 'invoices' | 'companies' | 'customBranding' | 'export' | 'creditNotes' | 'emailSending' | 'apiAccess' | 'users'
    );

    return NextResponse.json(checkResult);
  } catch (error: any) {
    console.error('Check subscription limit error:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
} 