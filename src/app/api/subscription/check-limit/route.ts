import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { checkSubscriptionLimits } from '@/middleware/subscription';

export async function GET(req: Request) {
  try {
    // Get the session
    const session = await getServerSession();
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the feature to check from query params
    const url = new URL(req.url);
    const feature = url.searchParams.get('feature');
    
    if (!feature) {
      return new NextResponse('Feature parameter is required', { status: 400 });
    }
    
    // Validate feature parameter
    const validFeatures = ['clients', 'invoices', 'products', 'customBranding'];
    if (!validFeatures.includes(feature)) {
      return new NextResponse('Invalid feature parameter', { status: 400 });
    }

    // Check subscription limits
    const checkResult = await checkSubscriptionLimits(
      session.user.id as string,
      feature as 'clients' | 'invoices' | 'products' | 'customBranding'
    );

    return NextResponse.json(checkResult);
  } catch (error: any) {
    console.error('Check subscription limit error:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
} 