import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Lazy initialization to avoid build-time errors
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS!,
      to: 'hristoslavov.ivanov@gmail.com',
      subject: 'Тестов имейл от RapidFrame',
      html: `
        <h1>Здравейте!</h1>
        <p>Това е тестов имейл от RapidFrame системата за фактуриране.</p>
        <p>Ако виждате този имейл, значи конфигурацията на Resend работи успешно!</p>
        <br>
        <p>Поздрави,</p>
        <p>Екипът на ${process.env.NEXT_PUBLIC_APP_NAME}</p>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Error sending email' },
      { status: 500 }
    );
  }
} 