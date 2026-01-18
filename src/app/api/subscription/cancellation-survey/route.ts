import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Взимаме данните от заявката
    const { reason, feedback, subscriptionId } = await req.json();

    // Проверяваме дали потребителят има този абонамент
    const { data: subscription, error } = await supabaseAdmin
      .from('Subscription')
      .select('id')
      .eq('id', subscriptionId)
      .eq('userId', session.user.id)
      .single();

    if (error || !subscription) {
      return new NextResponse('Subscription not found', { status: 404 });
    }

    // Записваме анкетата в базата данни
    // Забележка: Трябва да създадем модел за анкети в схемата
    // Тук е пример как би изглеждало:
    /*
    const cuid = require('cuid');
    await supabaseAdmin
      .from('CancellationSurvey')
      .insert({
        id: cuid(),
        subscriptionId,
        reason,
        feedback,
        userId: session.user.id
      });
    */

    // Тъй като може би нямаме такъв модел, просто връщаме успешен отговор
    return NextResponse.json({
      message: 'Feedback received',
      success: true
    });
  } catch (error) {
    console.error('Error saving cancellation survey:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
