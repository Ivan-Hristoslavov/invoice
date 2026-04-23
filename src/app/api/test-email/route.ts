import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * DEV-ONLY diagnostic endpoint to verify SMTP configuration.
 *
 * Guards:
 *   - Hidden in production unless `ALLOW_TEST_EMAIL=1` is set (returns 404).
 *   - Requires an authenticated session.
 *   - Per-user rate limit: 1 request / minute.
 */
function getSmtpTransporter() {
  const smtpServer = process.env.SMTP_SERVER;
  const smtpPort = process.env.SMTP_PORT;
  const smtpSecurity = process.env.SMTP_SECURITY;
  const smtpUsername = process.env.SMTP_USERNAME;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpServer || !smtpPort || !smtpUsername || !smtpPassword) {
    throw new Error(
      "SMTP configuration is incomplete. Please check SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, and SMTP_PASSWORD environment variables."
    );
  }

  const port = parseInt(smtpPort, 10);
  const isSecure = smtpSecurity === "SSL" || port === 465;

  return nodemailer.createTransport({
    host: smtpServer,
    port,
    secure: isSecure,
    auth: { user: smtpUsername, pass: smtpPassword },
    ...(smtpSecurity === "TLS" && !isSecure ? { requireTLS: true } : {}),
  });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_TEST_EMAIL) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
  }

  const ip = getClientIp(request.headers);
  const { success } = await rateLimit(
    `test-email:${session.user.id ?? session.user.email ?? ip}`,
    { windowMs: 60_000, maxRequests: 1 }
  );
  if (!success) {
    return NextResponse.json(
      { error: "Твърде много заявки. Изчакайте 1 минута." },
      { status: 429 }
    );
  }

  try {
    const smtpServer = process.env.SMTP_SERVER;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUsername = process.env.SMTP_USERNAME;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpServer || !smtpPort || !smtpUsername || !smtpPassword) {
      return NextResponse.json(
        {
          error:
            "SMTP configuration is incomplete. Please check SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, and SMTP_PASSWORD environment variables.",
        },
        { status: 500 }
      );
    }

    const fromAddress =
      process.env.SMTP_FROM_ADDRESS || process.env.EMAIL_FROM_ADDRESS;
    if (!fromAddress) {
      return NextResponse.json(
        { error: "SMTP_FROM_ADDRESS or EMAIL_FROM_ADDRESS is not configured" },
        { status: 500 }
      );
    }

    // Only send to the authenticated user's own email.
    const toAddress = session.user.email;
    if (!toAddress) {
      return NextResponse.json(
        { error: "Сесията няма асоцииран имейл адрес" },
        { status: 400 }
      );
    }

    const transporter = getSmtpTransporter();
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toAddress,
      subject: "Тестов имейл от InvoicyPro",
      html: `
        <h1>Здравейте!</h1>
        <p>Това е тестов имейл от InvoicyPro — SMTP конфигурацията работи.</p>
        <p>Изпратен към: ${toAddress}</p>
      `,
    });

    return NextResponse.json({
      success: true,
      data: { messageId: info.messageId },
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json({ error: "Error sending email" }, { status: 500 });
  }
}
