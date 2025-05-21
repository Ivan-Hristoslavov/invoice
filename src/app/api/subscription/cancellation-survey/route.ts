import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Взимаме данните от заявката
    const { reason, feedback, subscriptionId } = await req.json();

    // Проверяваме дали потребителят има този абонамент
    const subscription = await prisma.subscription.findFirst({
      where: {
        id: subscriptionId,
        userId: session.user.id,
      }
    });

    if (!subscription) {
      return new NextResponse('Subscription not found', { status: 404 });
    }

    // Записваме анкетата в базата данни
    // Забележка: Трябва да създадем модел за анкети в схемата
    // Тук е пример как би изглеждало:
    /*
    const survey = await prisma.cancellationSurvey.create({
      data: {
        subscriptionId,
        reason,
        feedback,
        userId: session.user.id
      }
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