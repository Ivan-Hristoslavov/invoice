import nodemailer from 'nodemailer';
import { exportInvoicePdfBuffer } from './invoice-export';
import { createAdminClient } from './supabase/server';
import { withDocumentSnapshots } from './document-snapshots';
import { APP_NAME } from "@/config/constants";

// Lazy initialization helper to avoid build-time errors
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

function getFromAddress(): string {
  // Use SMTP_FROM_ADDRESS if available, otherwise fall back to EMAIL_FROM_ADDRESS
  const fromAddress = process.env.SMTP_FROM_ADDRESS || process.env.EMAIL_FROM_ADDRESS;
  if (!fromAddress) {
    throw new Error('SMTP_FROM_ADDRESS or EMAIL_FROM_ADDRESS is not configured');
  }
  return fromAddress;
}

interface SendInvoiceEmailParams {
  to: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paymentLink: string;
  pdfUrl?: string;
  clientName: string;
  companyName: string;
  createAccountUrl?: string;
  bankDetails?: {
    bankName: string;
    iban: string;
    bic: string;
    accountHolder: string;
  };
}

type SendInvoiceEmailOptions = {
  to: string;
  invoiceNumber: string;
  type: 'invoice_only' | 'invoice_with_payment';
  paymentLink?: string;
};

export async function sendInvoiceEmail({ to, invoiceNumber, type, paymentLink }: SendInvoiceEmailOptions & { userId?: string }) {
  try {
    let subject = `Фактура #${invoiceNumber}`;
    let content = '';

    if (type === 'invoice_only') {
      content = `
        <h1>Здравейте!</h1>
        <p>Изпращаме Ви фактура #${invoiceNumber}.</p>
        <p>Можете да намерите PDF файла на фактурата в прикачените файлове.</p>
        <br>
        <p>Поздрави,</p>
        <p>Екипът на ${process.env.NEXT_PUBLIC_APP_NAME}</p>
      `;
    } else if (type === 'invoice_with_payment') {
      content = `
        <h1>Здравейте!</h1>
        <p>Изпращаме Ви фактура #${invoiceNumber}.</p>
        <p>Можете да намерите PDF файла на фактурата в прикачените файлове.</p>
        <br>
        <p><strong>Опции за плащане:</strong></p>
        <p>1. Онлайн плащане: <a href="${paymentLink}">Кликнете тук за плащане</a></p>
        <p>2. Банков превод: [Вашите банкови детайли тук]</p>
        <br>
        <p>Поздрави,</p>
        <p>Екипът на ${process.env.NEXT_PUBLIC_APP_NAME}</p>
      `;
    }

    let attachments = [];
    try {
      const supabase = createAdminClient();
      const userId = typeof arguments[0].userId === 'string' ? arguments[0].userId : undefined;
      
      let query = supabase
        .from('Invoice')
        .select('*, client:Client(*), company:Company(*), items:InvoiceItem(*)')
        .eq('invoiceNumber', invoiceNumber);
      
      if (userId) {
        query = query.eq('userId', userId);
      }
      
      const { data: invoice, error } = await query.single();
      
      if (error || !invoice) {
        throw new Error('Invoice not found or access denied');
      }
      
      // Fetch bank account if company exists
      let bankAccount = null;
      if (invoice.company) {
        const { data: bankData } = await supabase
          .from('BankAccount')
          .select('*')
          .eq('companyId', invoice.company.id)
          .limit(1)
          .single();
        bankAccount = bankData;
      }
      
      const snapshotInvoice = withDocumentSnapshots(
        invoice,
        invoice.company ? { ...invoice.company, bankAccount } : null,
        invoice.client,
        invoice.items || []
      );
      const fullInvoice = {
        ...snapshotInvoice,
        company: snapshotInvoice.company
          ? {
              ...snapshotInvoice.company,
              bankAccount:
                snapshotInvoice.company.bankAccountDetails || bankAccount || null,
            }
          : null,
        isOriginal: true,
      };
      
      // Pass invoice data directly to avoid HTTP request (server-side)
      const pdf = await exportInvoicePdfBuffer(invoice.id, fullInvoice);
      attachments.push({
        filename: pdf.filename,
        content: pdf.buffer,
      });
    } catch (err) {
      console.error('PDF not attached:', err);
    }

    const transporter = getSmtpTransporter();
    const mailOptions = {
      from: getFromAddress(),
      to,
      subject,
      html: content,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const info = await transporter.sendMail(mailOptions);

    return { success: true, data: info };
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}

export async function sendPaymentConfirmationEmail({
  to,
  invoiceNumber,
  amount,
  currency,
  clientName,
  companyName,
}: {
  to: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  clientName: string;
  companyName: string;
}) {
  try {
    const currencySymbol = '€';
    
    const transporter = getSmtpTransporter();
    const fromAddress = getFromAddress();
    
    // Format from address with app name if available
    const from = process.env.NEXT_PUBLIC_APP_NAME && process.env.NEXT_PUBLIC_APP_DOMAIN
      ? `${process.env.NEXT_PUBLIC_APP_NAME} <${fromAddress}>`
      : fromAddress;

    await transporter.sendMail({
      from,
      to,
      subject: `Потвърждение за плащане на фактура #${invoiceNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Здравейте${clientName ? `, ${clientName}` : ''}!</h2>
          
          <p>Потвърждаваме успешното плащане на фактура #${invoiceNumber} от ${companyName} на стойност ${amount} ${currencySymbol}.</p>
          
          <div style="margin: 20px 0; padding: 20px; background-color: #f0fdf4; border-radius: 8px;">
            <p style="margin: 0; color: #166534;">
              ✅ Плащането е обработено успешно
            </p>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Това е автоматично генериран email. Моля, не отговаряйте на този адрес.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
}

export async function sendInvoiceWithoutPaymentLink({
  to,
  invoiceNumber,
  amount,
  currency,
  pdfUrl,
  clientName,
  companyName,
}: Omit<SendInvoiceEmailParams, 'paymentLink' | 'createAccountUrl' | 'bankDetails'>) {
  try {
    const currencySymbol = '€';
    
    const transporter = getSmtpTransporter();
    const fromAddress = getFromAddress();
    
    // Format from address with app name if available
    const from = process.env.NEXT_PUBLIC_APP_NAME && process.env.NEXT_PUBLIC_APP_DOMAIN
      ? `${process.env.NEXT_PUBLIC_APP_NAME} <${fromAddress}>`
      : fromAddress;

    await transporter.sendMail({
      from,
      to,
      subject: `Фактура #${invoiceNumber} от ${companyName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Здравейте${clientName ? `, ${clientName}` : ''}!</h2>
          
          <p>Изпращаме Ви фактура #${invoiceNumber} от ${companyName} на стойност ${amount} ${currencySymbol}.</p>
          
          ${pdfUrl ? `
          <p>
            <a href="${pdfUrl}" style="display: inline-block; margin: 10px 0; padding: 10px 20px; background-color: #f3f4f6; color: #374151; text-decoration: none; border-radius: 6px;">
              📄 Изтегли фактурата
            </a>
          </p>
          ` : ''}
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Това е автоматично генериран email. Моля, не отговаряйте на този адрес.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}

export async function sendInvoiceWithPaymentDetails({
  to,
  invoiceNumber,
  amount,
  currency,
  paymentLink,
  pdfUrl,
  clientName,
  companyName,
  bankDetails,
}: Omit<SendInvoiceEmailParams, 'createAccountUrl'> & { bankDetails: NonNullable<SendInvoiceEmailParams['bankDetails']> }) {
  try {
    const currencySymbol = '€';
    
    const transporter = getSmtpTransporter();
    const fromAddress = getFromAddress();
    
    // Format from address with app name if available
    const from = process.env.NEXT_PUBLIC_APP_NAME && process.env.NEXT_PUBLIC_APP_DOMAIN
      ? `${process.env.NEXT_PUBLIC_APP_NAME} <${fromAddress}>`
      : fromAddress;

    await transporter.sendMail({
      from,
      to,
      subject: `Фактура #${invoiceNumber} от ${companyName} - Информация за плащане`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Здравейте${clientName ? `, ${clientName}` : ''}!</h2>
          
          <p>Изпращаме Ви фактура #${invoiceNumber} от ${companyName} на стойност ${amount} ${currencySymbol}.</p>
          
          ${pdfUrl ? `
          <p>
            <a href="${pdfUrl}" style="display: inline-block; margin: 10px 0; padding: 10px 20px; background-color: #f3f4f6; color: #374151; text-decoration: none; border-radius: 6px;">
              📄 Изтегли фактурата
            </a>
          </p>
          ` : ''}
          
          <div style="margin: 20px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px;">Начини за плащане:</h3>
            
            <div style="margin-bottom: 20px;">
              <h4 style="margin: 0 0 10px 0; font-size: 16px;">💳 Онлайн с карта:</h4>
              <a href="${paymentLink}" style="display: inline-block; padding: 12px 24px; background-color: #635BFF; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;">
                Плати онлайн
              </a>
            </div>
            
            <div>
              <h4 style="margin: 0 0 10px 0; font-size: 16px;">🏦 Банков превод:</h4>
              <p style="margin: 0 0 5px 0;">Банка: ${bankDetails.bankName}</p>
              <p style="margin: 0 0 5px 0;">IBAN: ${bankDetails.iban}</p>
              <p style="margin: 0 0 5px 0;">BIC: ${bankDetails.bic}</p>
              <p style="margin: 0 0 5px 0;">Получател: ${bankDetails.accountHolder}</p>
              <p style="margin: 0; font-style: italic;">Моля, посочете номера на фактурата (${invoiceNumber}) като основание за плащането.</p>
            </div>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Това е автоматично генериран email. Моля, не отговаряйте на този адрес.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const transporter = getSmtpTransporter();
  const fromAddress = getFromAddress();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Invoicy";

  const from = process.env.NEXT_PUBLIC_APP_DOMAIN
    ? `${appName} <${fromAddress}>`
    : fromAddress;

  await transporter.sendMail({
    from,
    to,
    subject: `Възстановяване на парола - ${appName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Здравейте, ${name}!</h2>
        <p>Получихме заявка за възстановяване на вашата парола.</p>
        <p>Кликнете бутона по-долу, за да зададете нова парола:</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Задай нова парола
          </a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">
          Линкът е валиден 1 час. Ако не сте заявили възстановяване на парола, игнорирайте този имейл.
        </p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;" />
        <p style="font-size: 12px; color: #9ca3af;">
          Това е автоматично генериран имейл от ${appName}. Моля, не отговаряйте.
        </p>
      </div>
    `,
  });
}

export async function sendTeamInviteEmail({
  to,
  companyName,
  inviterName,
  roleLabel,
  acceptUrl,
  magicLinkUrl,
}: {
  to: string;
  companyName: string;
  inviterName: string;
  roleLabel: string;
  acceptUrl: string;
  magicLinkUrl: string;
}) {
  const transporter = getSmtpTransporter();
  const fromAddress = getFromAddress();
  const from = process.env.NEXT_PUBLIC_APP_DOMAIN
    ? `${APP_NAME} <${fromAddress}>`
    : fromAddress;

  await transporter.sendMail({
    from,
    to,
    subject: `Покана за екипа в ${companyName}`,
    html: `
      <div style="margin:0;padding:32px 16px;background:#0f172a;color:#e5eefb;font-family:Inter,Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;">
          <div style="margin-bottom:20px;">
            <div style="display:inline-block;padding:8px 14px;border:1px solid rgba(255,255,255,0.12);border-radius:999px;background:rgba(14,165,233,0.10);font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#7dd3fc;">
              ${APP_NAME}
            </div>
          </div>

          <div style="background:linear-gradient(180deg,#111827 0%,#0f172a 100%);border:1px solid rgba(148,163,184,0.18);border-radius:28px;padding:32px;box-shadow:0 24px 80px rgba(15,23,42,0.35);">
            <h1 style="margin:0 0 12px;font-size:32px;line-height:1.1;font-weight:800;color:#f8fafc;">
              Покана за достъп до екипа
            </h1>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#cbd5e1;">
              <strong style="color:#f8fafc;">${inviterName}</strong> ви покани в компанията
              <strong style="color:#f8fafc;">${companyName}</strong> с роля
              <strong style="color:#f8fafc;">${roleLabel}</strong>.
            </p>

            <div style="margin:0 0 24px;padding:18px 20px;border-radius:20px;background:rgba(15,23,42,0.6);border:1px solid rgba(148,163,184,0.14);">
              <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;">
                Как работи
              </div>
              <div style="font-size:15px;line-height:1.7;color:#dbe7f5;">
                Натиснете бутона по-долу и ще влезете с еднократен сигурен magic link.
                Ако нямате акаунт, ще бъде създаден автоматично за този имейл.
              </div>
            </div>

            <div style="margin:28px 0 18px;">
              <a href="${magicLinkUrl}" style="display:inline-block;padding:16px 28px;border-radius:16px;background:linear-gradient(135deg,#14b8a6 0%,#2563eb 100%);color:#ffffff;text-decoration:none;font-weight:800;font-size:16px;">
                Приеми поканата
              </a>
            </div>

            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#94a3b8;">
              Ако бутонът не работи, използвайте този линк:
            </p>
            <p style="margin:0 0 22px;word-break:break-word;">
              <a href="${magicLinkUrl}" style="color:#7dd3fc;text-decoration:none;">${magicLinkUrl}</a>
            </p>

            <div style="padding-top:20px;border-top:1px solid rgba(148,163,184,0.14);">
              <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#cbd5e1;">
                Алтернативно можете да отворите директния invite линк:
              </p>
              <p style="margin:0;word-break:break-word;">
                <a href="${acceptUrl}" style="color:#94a3b8;text-decoration:none;">${acceptUrl}</a>
              </p>
            </div>
          </div>

          <p style="margin:18px 6px 0;font-size:12px;line-height:1.6;color:#64748b;">
            Това е автоматично генериран имейл от ${APP_NAME}. Ако не очаквате тази покана, игнорирайте съобщението.
          </p>
        </div>
      </div>
    `,
  });
}
