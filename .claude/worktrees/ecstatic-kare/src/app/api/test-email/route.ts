import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

function getSmtpTransporter() {
  const smtpServer = process.env.SMTP_SERVER;
  const smtpPort = process.env.SMTP_PORT;
  const smtpSecurity = process.env.SMTP_SECURITY;
  const smtpUsername = process.env.SMTP_USERNAME;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpServer || !smtpPort || !smtpUsername || !smtpPassword) {
    throw new Error('SMTP configuration is incomplete. Please check SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, and SMTP_PASSWORD environment variables.');
  }

  const port = parseInt(smtpPort, 10);
  const isSecure = smtpSecurity === 'SSL' || port === 465;

  return nodemailer.createTransport({
    host: smtpServer,
    port: port,
    secure: isSecure, // true for 465, false for other ports
    auth: {
      user: smtpUsername,
      pass: smtpPassword,
    },
    ...(smtpSecurity === 'TLS' && !isSecure ? { requireTLS: true } : {}),
  });
}

export async function POST(request: Request) {
  try {
    // Lazy initialization to avoid build-time errors
    const smtpServer = process.env.SMTP_SERVER;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUsername = process.env.SMTP_USERNAME;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpServer || !smtpPort || !smtpUsername || !smtpPassword) {
      return NextResponse.json(
        { error: 'SMTP configuration is incomplete. Please check SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, and SMTP_PASSWORD environment variables.' },
        { status: 500 }
      );
    }

    const fromAddress = process.env.SMTP_FROM_ADDRESS || process.env.EMAIL_FROM_ADDRESS;
    if (!fromAddress) {
      return NextResponse.json(
        { error: 'SMTP_FROM_ADDRESS or EMAIL_FROM_ADDRESS is not configured' },
        { status: 500 }
      );
    }

    const toAddress = process.env.SMTP_TO_ADDRESS;
    if (!toAddress) {
      return NextResponse.json(
        { error: 'SMTP_TO_ADDRESS is not configured. Set it in your environment variables.' },
        { status: 500 }
      );
    }

    const transporter = getSmtpTransporter();
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toAddress,
      subject: 'Тестов имейл от RapidFrame',
      html: `
        <h1>Здравейте!</h1>
        <p>Това е тестов имейл от RapidFrame системата за фактуриране.</p>
        <p>Ако виждате този имейл, значи конфигурацията на SMTP работи успешно!</p>
        <br>
        <p>Поздрави,</p>
        <p>Екипът на ${process.env.NEXT_PUBLIC_APP_NAME}</p>
      `,
    });

    return NextResponse.json({ success: true, data: info });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Error sending email' },
      { status: 500 }
    );
  }
}
