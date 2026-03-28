import nodemailer from "nodemailer";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Моля, въведете име").max(120),
  email: z.string().trim().email("Моля, въведете валиден имейл"),
  subject: z.string().trim().min(3, "Моля, въведете тема").max(160),
  message: z.string().trim().min(10, "Съобщението е твърде кратко").max(4000),
  inquiryType: z.enum(["support", "demo", "sales"]).default("support"),
  website: z.string().optional().default(""),
});

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSmtpTransporter() {
  const smtpServer = process.env.SMTP_SERVER;
  const smtpPort = process.env.SMTP_PORT;
  const smtpSecurity = process.env.SMTP_SECURITY;
  const smtpUsername = process.env.SMTP_USERNAME;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpServer || !smtpPort || !smtpUsername || !smtpPassword) {
    return null;
  }

  const port = Number.parseInt(smtpPort, 10);
  const isSecure = smtpSecurity === "SSL" || port === 465;

  return nodemailer.createTransport({
    host: smtpServer,
    port,
    secure: isSecure,
    auth: {
      user: smtpUsername,
      pass: smtpPassword,
    },
    ...(smtpSecurity === "TLS" && !isSecure ? { requireTLS: true } : {}),
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const limiter = rateLimit(`contact:${ip}`, { windowMs: 300_000, maxRequests: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { message: "Твърде много заявки. Моля, опитайте отново след няколко минути." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Невалиден формат на заявката." }, { status: 400 });
    }
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const message =
        fieldErrors.name?.[0] ||
        fieldErrors.email?.[0] ||
        fieldErrors.subject?.[0] ||
        fieldErrors.message?.[0] ||
        "Невалидни данни от формата.";
      return NextResponse.json({ message }, { status: 400 });
    }

    const { website, inquiryType, name, email, subject, message } = parsed.data;

    // Honeypot trap for bots.
    if (website) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const transporter = getSmtpTransporter();
    const fromAddress = process.env.SMTP_FROM_ADDRESS || process.env.EMAIL_FROM_ADDRESS;
    const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@invoicy.bg";
    const toAddress = process.env.SMTP_TO_ADDRESS || supportEmail;

    if (!transporter || !fromAddress || !toAddress) {
      return NextResponse.json(
        {
          message:
            `Формата е временно недостъпна. Изпратете ни имейл на ${supportEmail}.`,
        },
        { status: 503 }
      );
    }

    const inquiryLabel =
      inquiryType === "demo" ? "Заявка за демо" : inquiryType === "sales" ? "Търговско запитване" : "Поддръжка";

    await transporter.sendMail({
      from: fromAddress,
      to: toAddress,
      replyTo: email,
      subject: `[Контакт] ${inquiryLabel}: ${subject}`,
      html: `
        <h2>Ново запитване от сайта</h2>
        <p><strong>Тип:</strong> ${escapeHtml(inquiryLabel)}</p>
        <p><strong>Име:</strong> ${escapeHtml(name)}</p>
        <p><strong>Имейл:</strong> ${escapeHtml(email)}</p>
        <p><strong>Тема:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Съобщение:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
      `,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Запитването е изпратено успешно. Ще се свържем с вас скоро.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form submit failed:", error);
    return NextResponse.json(
      { message: "Възникна грешка при изпращането. Моля, опитайте отново." },
      { status: 500 }
    );
  }
}
