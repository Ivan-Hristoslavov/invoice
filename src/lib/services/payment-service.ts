import Stripe from 'stripe';
import { prisma } from '@/lib/db/prisma';
import { Prisma, Payment, PaymentMethod, InvoiceStatus } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
});

export async function createPaymentLink(invoiceId: string) {
  try {
    // Fetch invoice details with payments
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        company: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.status === "PAID") {
      throw new Error("Invoice is already paid");
    }

    // Calculate amount due
    const totalPaid = invoice.payments.reduce((sum, payment) => 
      sum + Number(payment.amount.toString()), 0);
    const amountDue = Number(invoice.total.toString()) - totalPaid;

    if (amountDue <= 0) {
      throw new Error("Invoice is already paid in full");
    }

    // First create a product for this invoice
    const product = await stripe.products.create({
      name: `Invoice #${invoice.invoiceNumber}`,
      description: `Payment for invoice #${invoice.invoiceNumber}`,
    });

    // Then create a price for the product
    const price = await stripe.prices.create({
      product: product.id,
      currency: invoice.currency.toLowerCase(),
      unit_amount: Math.round(amountDue * 100), // Convert to cents
    });

    // Finally create the payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      payment_intent_data: {
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
        },
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/payment-success`,
        },
      },
    });

    return {
      url: paymentLink.url,
    };
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}

export async function getPaymentStatus(invoiceId: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const totalPaid = invoice.payments.reduce((sum, payment) => 
      sum + Number(payment.amount.toString()), 0);
    const amountDue = Number(invoice.total.toString()) - totalPaid;

    return {
      status: invoice.status,
      lastPayment: invoice.payments[0] || null,
      amountDue,
      paidAt: invoice.paidAt,
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
}

export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        invoice: true,
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "COMPLETED") {
      throw new Error("Payment cannot be refunded");
    }

    if (!payment.transactionId) {
      throw new Error("Payment has no transaction ID");
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.transactionId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    // Create refund record in database
    const refundPayment = await prisma.payment.create({
      data: {
        invoiceId: payment.invoiceId,
        amount: new Prisma.Decimal(amount || Number(payment.amount.toString())),
        paymentDate: new Date(),
        paymentMethod: PaymentMethod.CREDIT_CARD,
        transactionId: refund.id,
        status: "REFUNDED",
        notes: "Възстановена сума",
        refundedPaymentId: payment.id,
      },
    });
    
    // Update the original payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: "REFUNDED" 
      },
    });

    // Update invoice status if fully refunded
    if (!amount || amount === Number(payment.amount.toString())) {
      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: InvoiceStatus.CANCELLED,
          paidAt: null,
        },
      });
    }

    return refundPayment;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw error;
  }
} 