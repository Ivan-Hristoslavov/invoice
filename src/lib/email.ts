import { Resend } from 'resend';
import { generateInvoicePdfBuffer } from './invoice-export';
import { prisma } from './db';

const resend = new Resend(process.env.RESEND_API_KEY);

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
      let invoice = await prisma.invoice.findFirst({
        where: {
          invoiceNumber,
          ...(typeof arguments[0].userId === 'string' ? { userId: arguments[0].userId } : {})
        },
        include: {
          client: true,
          company: true,
          items: true,
          payments: true,
        },
      });
      if (!invoice) throw new Error('Invoice not found or access denied');
      const pdf = await generateInvoicePdfBuffer(invoice);
      attachments.push({
        filename: pdf.filename,
        content: pdf.buffer,
      });
    } catch (err) {
      console.error('PDF not attached:', err);
    }

    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS!,
      to,
      subject,
      html: content,
      ...(attachments.length > 0 ? { attachments } : {}),
    });

    return { success: true, data };
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
    const currencySymbol = currency === 'BGN' ? 'лв.' : currency;
    
    await resend.emails.send({
      from: `${process.env.NEXT_PUBLIC_APP_NAME} <invoices@${process.env.NEXT_PUBLIC_APP_DOMAIN}>`,
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
    const currencySymbol = currency === 'BGN' ? 'лв.' : currency;
    
    await resend.emails.send({
      from: `${process.env.NEXT_PUBLIC_APP_NAME} <invoices@${process.env.NEXT_PUBLIC_APP_DOMAIN}>`,
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
    const currencySymbol = currency === 'BGN' ? 'лв.' : currency;
    
    await resend.emails.send({
      from: `${process.env.NEXT_PUBLIC_APP_NAME} <invoices@${process.env.NEXT_PUBLIC_APP_DOMAIN}>`,
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