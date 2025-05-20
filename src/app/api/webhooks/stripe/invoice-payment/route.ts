import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature") || "";

    let event: Stripe.Event;

    try {
      event = webhookSecret
        ? stripe.webhooks.constructEvent(body, signature, webhookSecret)
        : JSON.parse(body);
    } catch (err: any) {
      console.error(`⚠️  Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata.invoiceId;

        if (!invoiceId) {
          console.error("No invoiceId found in payment intent metadata");
          return NextResponse.json({ error: "No invoiceId found" }, { status: 400 });
        }

        // Update invoice status
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: "PAID",
            paidAt: new Date(),
            payments: {
              create: {
                amount: paymentIntent.amount / 100, // Convert from cents
                currency: paymentIntent.currency,
                paymentDate: new Date(),
                paymentMethod: "STRIPE",
                transactionId: paymentIntent.id,
                status: "COMPLETED"
              }
            }
          }
        });

        // Revalidate related pages
        revalidatePath(`/invoices/${invoiceId}`);
        revalidatePath("/invoices");
        revalidatePath("/dashboard");

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata.invoiceId;

        if (invoiceId) {
          await prisma.payment.create({
            data: {
              invoiceId,
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency,
              paymentDate: new Date(),
              paymentMethod: "STRIPE",
              transactionId: paymentIntent.id,
              status: "FAILED",
              notes: paymentIntent.last_payment_error?.message || "Payment failed"
            }
          });

          // Revalidate related pages
          revalidatePath(`/invoices/${invoiceId}`);
          revalidatePath("/invoices");
          revalidatePath("/dashboard");
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Error processing webhook:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 