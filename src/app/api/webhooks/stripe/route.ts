import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { headers } from "next/headers";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import cuid from "cuid";

// Define types locally since we're not using Prisma
type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "UNPAID" | "CANCELED" | "INCOMPLETE" | "INCOMPLETE_EXPIRED" | "TRIALING" | "PAUSED";
type PaymentStatus = "PAID" | "UNPAID" | "FAILED" | "PENDING" | "REFUNDED" | "VOID";

// Define custom types for easier use
type SubscriptionPlan = "FREE" | "PRO" | "BUSINESS";
type PaymentStatus = "PAID" | "FAILED" | "REFUNDED" | "COMPLETED";

// Lazy initialization helper to avoid build-time errors
function getStripe() {
  const stripeKey = process.env.STRIPE_SECRET_KEY_FIXED || process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY_FIXED или STRIPE_SECRET_KEY не е конфигуриран');
  }
  return new Stripe(stripeKey, {
    apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
  });
}

// Webhook secret for validating events
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Type for Stripe subscription with additional fields
type StripeSubscriptionWithDetails = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

// Type for Stripe invoice with subscription property
interface StripeInvoiceWithSubscription extends Stripe.Invoice {
  subscription?: string;
  payment_method_details?: {
    type?: string;
    [key: string]: any;
  };
  payment_intent?: string | Stripe.PaymentIntent;
}

// Function to log webhook event to database
async function logWebhookEvent(eventType: string, eventId: string, status: "SUCCESS" | "FAILED", data: any) {
  try {
    await supabaseAdmin
      .from('WebhookEventLog')
      .insert({
        id: cuid(),
        eventType,
        eventId,
        status,
        payload: JSON.stringify(data),
        processedAt: new Date().toISOString(),
      });
    console.log(`Записано webhook събитие: ${eventType} (${eventId}) - Статус: ${status}`);
  } catch (error) {
    console.error(`Неуспешно логване на webhook събитие: ${error}`);
  }
}

// Create or update subscription history entry
async function logSubscriptionHistory(subscriptionId: string, status: SubscriptionStatus, event: string) {
  try {
    await supabaseAdmin
      .from('SubscriptionHistory')
      .insert({
        id: cuid(),
        subscriptionId,
        status,
        event,
        createdAt: new Date().toISOString(),
      });
    console.log(`Записана история на абонамент: ${subscriptionId} - ${event}`);
  } catch (error) {
    console.error(`Неуспешно логване на история на абонамент: ${error}`);
  }
}

/**
 * Handles Stripe webhook events to maintain subscription data in the database
 */
export async function POST(req: Request) {
  let event: Stripe.Event | null = null;
  
  try {
    const body = await req.text();
    const headersList = headers();
    const signature = (await headersList).get("stripe-signature") || "";
    const stripe = getStripe();

    try {
      // Verify webhook signature
      event = webhookSecret
        ? stripe.webhooks.constructEvent(body, signature, webhookSecret)
        : JSON.parse(body);
    } catch (err: any) {
      console.error(`⚠️  Webhook signature verification failed: ${err.message}`);
      // Try to extract event ID and type from body for logging
      let eventData;
      try {
        eventData = JSON.parse(body);
        if (eventData.id && eventData.type) {
          await logWebhookEvent(eventData.type, eventData.id, "FAILED", { error: err.message });
        }
      } catch (parseErr) {
        console.error("Неуспешно парсване на тялото на webhook", parseErr);
      }
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    
    if (!event) {
      return NextResponse.json({ error: "Невалидно събитие" }, { status: 400 });
    }
    
    // Log the received event immediately
    await logWebhookEvent(event.type, event.id, "SUCCESS", event.data.object);

    // Handle different event types
    switch (event.type) {
      // Invoice payment processing removed - invoices are for issuance only
      // Only subscription payments are processed here
      case "payment_intent.succeeded": {
        // Only handle subscription payments, not invoice payments
        // Invoice payments should not be processed through this system
        console.log("Плащането е успешно (само за абонамент)");
        break;
      }

      case "payment_intent.payment_failed": {
        // Only handle subscription payments, not invoice payments
        console.log("Плащането е неуспешно (само за абонамент)");
        break;
      }

      case "payment_intent.payment_failed_old": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata?.invoiceId;

        if (!invoiceId) {
          await logWebhookEvent(event.type, event.id, "FAILED", { error: "Липсва invoiceId" });
          return NextResponse.json({ error: "Липсва invoiceId" }, { status: 400 });
        }

        try {
          // Record failed payment attempt
          await prisma.payment.create({
            data: {
              invoiceId,
              amount: paymentIntent.amount / 100,
              paymentDate: new Date(),
              paymentMethod: "CREDIT_CARD" as PaymentMethod,
              transactionId: paymentIntent.id,
              status: "FAILED",
              notes: paymentIntent.last_payment_error?.message || "Неуспешно плащане",
              reference: paymentIntent.id
            },
          });

          // Revalidate pages
          revalidatePath(`/invoices/${invoiceId}`);
          revalidatePath("/invoices");
        } catch (error) {
          console.error("Грешка при обработка на payment_intent.payment_failed:", error);
          await logWebhookEvent(event.type, event.id, "FAILED", { error: String(error) });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;
        
        try {
          // Find the payment by transaction ID (payment_intent_id)
          const payment = await prisma.payment.findFirst({
            where: { reference: paymentIntentId },
            include: { invoice: true },
          });
  
          if (payment) {
            // Create refund record
            await prisma.payment.create({
              data: {
                invoiceId: payment.invoiceId,
                amount: -(charge.amount_refunded / 100),
                paymentDate: new Date(),
                paymentMethod: "CREDIT_CARD" as PaymentMethod,
                transactionId: charge.id,
                status: "FAILED",
                notes: "Възстановена сума",
                reference: charge.id,
                refundedPaymentId: payment.id
              },
            });
  
            // Update invoice status if fully refunded
            await prisma.invoice.update({
              where: { id: payment.invoiceId },
              data: {
                status: "CANCELLED" as InvoiceStatus, // Use CANCELLED instead of REFUNDED
                paidAt: null,
              },
            });
  
            // Revalidate pages
            revalidatePath(`/invoices/${payment.invoiceId}`);
            revalidatePath("/invoices");
            revalidatePath("/dashboard");
          } else {
            console.error(`Не е намерено плащане за payment intent ${paymentIntentId}`);
            await logWebhookEvent(event.type, event.id, "FAILED", { error: `Не е намерено плащане за payment intent ${paymentIntentId}` });
          }
        } catch (error) {
          console.error("Грешка при обработка на charge.refunded:", error);
          await logWebhookEvent(event.type, event.id, "FAILED", { error: String(error) });
        }
        break;
      }
      
      // SUBSCRIPTION CREATION VIA CHECKOUT
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Log the session for debugging
        console.log(`Processing checkout session: ${JSON.stringify(session, null, 2)}`);
        
        // Check for customer information
        if (!session.customer && !session.customer_email) {
          console.error("Липсва имейл или ID на клиент в checkout сесията");
          await logWebhookEvent(event.type, event.id, "FAILED", { error: "Липсва имейл или ID на клиент" });
          return NextResponse.json({ received: true }); // Still return 200 to acknowledge the event
        }
        
        // Determine subscription details
        const customerId = typeof session.customer === 'string' ? session.customer : '';
        const customerEmail = session.customer_email || '';
        
        // Check for subscription ID (it might be undefined for non-subscription checkouts)
        if (!session.subscription) {
          console.log("В тази checkout сесия не е създаден абонамент");
          return NextResponse.json({ received: true });
        }
        
        const subscriptionId = typeof session.subscription === 'string' 
          ? session.subscription 
          : '';
        
        if (!subscriptionId) {
          console.log("Невалиден формат на subscription ID");
          return NextResponse.json({ received: true });
        }
        
        try {
          // Get full subscription details from Stripe
          const stripe = getStripe();
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          const subscription = stripeSubscription as unknown as StripeSubscriptionWithDetails;
          
          // Find or create user
          let user = null;
          
          // Try finding by stripeCustomerId first if available
          if (customerId) {
            user = await prisma.user.findFirst({
              where: { stripeCustomerId: customerId }
            });
          }
          
          // If not found and we have email, try by email
          if (!user && customerEmail) {
            user = await prisma.user.findFirst({
              where: { email: customerEmail }
            });
          }
          
          // Create new user if not found and we have an email
          if (!user && customerEmail) {
            user = await prisma.user.create({
              data: {
                email: customerEmail,
                stripeCustomerId: customerId || undefined,
                name: customerEmail.split("@")[0],
              }
            });
            console.log(`Created new user with email ${customerEmail}`);
          } else if (user && customerId && !user.stripeCustomerId) {
            // Update existing user with Stripe customer ID if missing
            user = await prisma.user.update({
              where: { id: user.id },
              data: { stripeCustomerId: customerId }
            });
            console.log(`Updated user ${user.id} with Stripe customer ID ${customerId}`);
          }
          
          if (!user) {
            console.error("Неуспешно намиране или създаване на потребител от checkout данни");
            await logWebhookEvent(event.type, event.id, "FAILED", { error: "Неуспешно намиране или създаване на потребител" });
            return NextResponse.json({ received: true }); // Still acknowledge the event
          }
          
          // Determine plan from checkout session amount
          const amount = session.amount_total || 0;
          let plan: SubscriptionPlan;
          
          // Plan determination based on EUR prices:
          // FREE: 0 EUR
          // PRO: 13 EUR/month (130 EUR/year) = 1300 cents
          // BUSINESS: 28 EUR/month (280 EUR/year) = 2800 cents
          if (amount >= 2800) {
            plan = "BUSINESS";
          } else if (amount >= 1300) {
            plan = "PRO";
          } else {
            plan = "FREE";
          }
          
          // Get price info from subscription
          const priceId = subscription.items.data[0]?.price.id || "";
          
          // Create or update subscription record
          const existingSubscription = await prisma.subscription.findFirst({
            where: { userId: user.id }
          });
          
          if (existingSubscription) {
            const updatedSubscription = await prisma.subscription.update({
              where: { id: existingSubscription.id },
              data: {
                stripeSubscriptionId: subscriptionId,
                status: "ACTIVE" as SubscriptionStatus,
                plan: plan,
                priceId: priceId,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                updatedAt: new Date()
              }
            });
            
            // Record history
            await logSubscriptionHistory(
              existingSubscription.id,
              "ACTIVE" as SubscriptionStatus,
              `Subscription updated to plan ${plan}`
            );
            
            console.log(`Updated existing subscription for user ${user.id}`);
          } else {
            const newSubscription = await prisma.subscription.create({
              data: {
                userId: user.id,
                stripeSubscriptionId: subscriptionId,
                status: "ACTIVE" as SubscriptionStatus,
                plan: plan,
                priceId: priceId,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end
              }
            });
            
            // Record history
            await logSubscriptionHistory(
              newSubscription.id,
              "ACTIVE" as SubscriptionStatus,
              `New subscription created with plan ${plan}`
            );
            
            // Record payment
            await prisma.subscriptionPayment.create({
              data: {
                subscriptionId: newSubscription.id,
                stripeInvoiceId: `checkout_${session.id}_${Date.now()}`,
                amount: amount / 100,
                status: "PAID",
                currency: session.currency || "USD"
              }
            });
            
            console.log(`Created new subscription for user ${user.id}`);
          }
        } catch (error: any) {
          console.error(`Error processing checkout session: ${error.message}`);
          await logWebhookEvent(event.type, event.id, "FAILED", { error: error.message });
          // Still return 200 to acknowledge receipt of the webhook
          return NextResponse.json({ received: true });
        }
        
        break;
      }
      
      // SUBSCRIPTION UPDATES
      case "customer.subscription.updated": {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const subscription = stripeSubscription as unknown as StripeSubscriptionWithDetails;
        const customerId = subscription.customer as string;
        
        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId }
        });
        
        if (!user) {
          console.error(`No user found for customer ${customerId}`);
          return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 400 });
        }
        
        // Map Stripe status to our status
        let status: SubscriptionStatus;
        switch (subscription.status) {
          case "active":
            status = "ACTIVE";
            break;
          case "past_due":
            status = "PAST_DUE";
            break;
          case "unpaid":
            status = "UNPAID";
            break;
          case "canceled":
            status = "CANCELED";
            break;
          case "incomplete":
            status = "INCOMPLETE";
            break;
          case "incomplete_expired":
            status = "INCOMPLETE_EXPIRED";
            break;
          case "trialing":
            status = "TRIALING";
            break;
          case "paused":
            status = "PAUSED";
            break;
          default:
            status = "ACTIVE";
        }
        
        // Find existing subscription
        const existingSubscription = await prisma.subscription.findFirst({
          where: { 
            stripeSubscriptionId: subscription.id,
            userId: user.id
          }
        });
        
        if (existingSubscription) {
          // Get price info from subscription
          const priceId = subscription.items.data[0]?.price.id || existingSubscription.priceId;
          const priceAmount = subscription.items.data[0]?.price.unit_amount || 0;
          
          // Determine plan from price amount
          // Plan determination based on EUR prices (in cents):
          // FREE: 0 EUR
          // PRO: 13 EUR/month (130 EUR/year) = 1300 cents
          // BUSINESS: 28 EUR/month (280 EUR/year) = 2800 cents
          let plan = existingSubscription.plan;
          if (priceAmount) {
            if (priceAmount >= 2800) {
              plan = "BUSINESS";
            } else if (priceAmount >= 1300) {
              plan = "PRO";
            } else {
              plan = "FREE";
            }
          }
          
          // Check if status or plan changed
          const statusChanged = existingSubscription.status !== status;
          const planChanged = existingSubscription.plan !== plan;
          
          // Update subscription
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status,
              plan,
              priceId,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              updatedAt: new Date()
            }
          });
          
          // Record history for changes
          if (statusChanged) {
            await logSubscriptionHistory(
              existingSubscription.id,
              status,
              `Subscription status changed to ${status}`
            );
          }
          
          if (planChanged) {
            await logSubscriptionHistory(
              existingSubscription.id,
              status,
              `Subscription plan changed to ${plan}`
            );
          }
          
          if (!statusChanged && !planChanged) {
            await logSubscriptionHistory(
              existingSubscription.id,
              status,
            "Абонаментът е обновен"
            );
          }
        } else {
          console.error(`Не е намерен абонамент за stripe subscription ID ${subscription.id}`);
        }
        
        break;
      }
      
      // SUBSCRIPTION DELETION
      case "customer.subscription.deleted": {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const subscription = stripeSubscription as unknown as StripeSubscriptionWithDetails;
        const customerId = subscription.customer as string;
        
        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId }
        });
        
        if (!user) {
          console.error(`No user found for customer ${customerId}`);
          return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 400 });
        }
        
        // Find the subscription
        const existingSubscription = await prisma.subscription.findFirst({
          where: { 
            stripeSubscriptionId: subscription.id,
            userId: user.id
          }
        });
        
        if (existingSubscription) {
          // Update subscription to canceled
          await prisma.subscription.update({
            where: { id: existingSubscription.id },
            data: {
              status: "CANCELED" as SubscriptionStatus,
              cancelAtPeriodEnd: true,
              updatedAt: new Date()
            }
          });
          
          // Record history
          await logSubscriptionHistory(
            existingSubscription.id,
            "CANCELED" as SubscriptionStatus,
            "Абонаментът е отменен"
          );
          
          console.log(`Subscription ${existingSubscription.id} marked as canceled`);
        } else {
          console.error(`Не е намерен абонамент за stripe subscription ID ${subscription.id}`);
        }
        
        break;
      }
      
      // INVOICE PAYMENT SUCCEEDED
      case "invoice.paid": {
        const invoiceObject = event.data.object as Stripe.Invoice;
        const invoice = invoiceObject as StripeInvoiceWithSubscription;
        
        // Log the invoice for debugging
        console.log(`Processing invoice payment: ${JSON.stringify({
          id: invoice.id,
          customer: invoice.customer,
          subscription: invoice.subscription
        }, null, 2)}`);
        
        try {
          const customerId = typeof invoice.customer === 'string' ? invoice.customer : '';
          
          if (!customerId) {
            console.log("Липсва customer ID във фактурата");
            return NextResponse.json({ received: true });
          }
          
          // Check if this is a subscription invoice
          if (!invoice.subscription) {
            console.log("Фактурата не е за абонамент");
            return NextResponse.json({ received: true });
          }
          
          const subscriptionId = typeof invoice.subscription === 'string' 
            ? invoice.subscription 
            : '';
          
          if (!subscriptionId) {
            console.log("Невалиден формат на subscription ID във фактурата");
            return NextResponse.json({ received: true });
          }
          
          // Find user by Stripe customer ID
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId }
          });
          
          if (!user) {
            console.log(`No user found for customer ${customerId} - this might be normal for new users`);
            return NextResponse.json({ received: true });
          }
          
          // Find subscription in our database
          const subscription = await prisma.subscription.findFirst({
            where: { 
              stripeSubscriptionId: subscriptionId
            }
          });
          
          if (!subscription) {
            console.log(`Не е намерен абонамент с ID ${subscriptionId} - възможно е да е нов абонамент`);
            
            // Try to retrieve the subscription details from Stripe
            try {
              const stripe = getStripe();
              const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
              
              if (stripeSubscription && stripeSubscription.status === 'active') {
                // This could be a subscription created in a different webhook that hasn't been processed yet
                // We'll acknowledge the webhook but not try to create anything to avoid race conditions
                console.log(`Subscription exists in Stripe but not in our database yet`);
              }
            } catch (err) {
              console.error(`Error retrieving subscription from Stripe: ${err}`);
            }
            
            return NextResponse.json({ received: true });
          }
          
          // Make sure this subscription belongs to the user
          if (subscription.userId !== user.id) {
            console.error(`Subscription ${subscription.id} does not belong to user ${user.id}`);
            return NextResponse.json({ received: true });
          }
          
          // Record payment
          const invoiceId = invoice.id || `inv_${Date.now()}`;
          const uniqueInvoiceId = `${invoiceId}_${Date.now()}`;
          
          // Check if this payment was already recorded to avoid duplicates
          const existingPayment = await prisma.subscriptionPayment.findFirst({
            where: { 
              stripeInvoiceId: { contains: invoiceId }
            }
          });
          
          if (!existingPayment) {
            await prisma.subscriptionPayment.create({
              data: {
                subscriptionId: subscription.id,
                stripeInvoiceId: uniqueInvoiceId,
                amount: (invoice.amount_paid || 0) / 100,
                status: "PAID",
                currency: invoice.currency || "USD",
                paymentMethod: invoice.payment_method_details?.type || null,
                paymentIntentId: invoice.payment_intent as string || null
              }
            });
            console.log(`Recorded payment for subscription ${subscription.id}`);
          } else {
            console.log(`Payment for invoice ${invoiceId} already recorded`);
          }
          
          // Update subscription if needed
          if (subscription.status !== "ACTIVE") {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: "ACTIVE" as SubscriptionStatus,
                updatedAt: new Date()
              }
            });
            
            // Record history
            await logSubscriptionHistory(
              subscription.id,
              "ACTIVE" as SubscriptionStatus,
              "Плащането на абонамент е успешно"
            );
            
            console.log(`Updated subscription ${subscription.id} to ACTIVE status`);
          }
        } catch (error: any) {
          console.error(`Error processing invoice payment: ${error.message}`);
          // Still return 200 to acknowledge receipt of the webhook
          return NextResponse.json({ received: true });
        }
        
        break;
      }
      
      // INVOICE PAYMENT FAILED
      case "invoice.payment_failed": {
        const invoiceObject = event.data.object as Stripe.Invoice;
        const invoice = invoiceObject as StripeInvoiceWithSubscription;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription;
        
        if (!customerId || !subscriptionId) {
          console.error(`Missing customer or subscription ID in failed invoice: ${invoice.id}`);
          return NextResponse.json({ error: "Липсват задължителни идентификатори" }, { status: 400 });
        }
        
        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId }
        });
        
        if (!user) {
          console.error(`No user found for customer ${customerId}`);
          return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 400 });
        }
        
        // Find subscription in our database
        const subscription = await prisma.subscription.findFirst({
          where: { 
            stripeSubscriptionId: subscriptionId,
            userId: user.id
          }
        });
        
        if (subscription) {
          // Update subscription status
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "PAST_DUE" as SubscriptionStatus,
              updatedAt: new Date()
            }
          });
          
          // Record history
          await logSubscriptionHistory(
            subscription.id,
            "PAST_DUE" as SubscriptionStatus,
            "Плащането на абонамента е неуспешно"
          );
          
          // Record failed payment
          const invoiceId = invoice.id || `inv_failed_${Date.now()}`;
          await prisma.subscriptionPayment.create({
            data: {
              subscriptionId: subscription.id,
              stripeInvoiceId: `${invoiceId}_${Date.now()}`,
              amount: invoice.amount_due / 100,
              status: "FAILED",
              currency: invoice.currency || "USD"
            }
          });
          
          console.log(`Recorded failed payment for subscription ${subscription.id}`);
        } else {
          console.error(`Не е намерен абонамент за stripe subscription ID ${subscriptionId}`);
        }
        
        break;
      }
      
      // SUBSCRIPTION CREATION
      case "customer.subscription.created": {
        const stripeSubscription = event.data.object as Stripe.Subscription;
        const subscription = stripeSubscription as unknown as StripeSubscriptionWithDetails;
        
        // Log the subscription for debugging
        console.log(`Processing new subscription: ${JSON.stringify({
          id: subscription.id,
          customer: subscription.customer,
          status: subscription.status
        }, null, 2)}`);
        
        try {
          const customerId = typeof subscription.customer === 'string' ? subscription.customer : '';
          
          if (!customerId) {
            console.log("Липсва customer ID в абонамента");
            return NextResponse.json({ received: true });
          }
          
          // Find user by Stripe customer ID
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: customerId }
          });
          
          if (!user) {
            console.log(`No user found for customer ${customerId} - this might be a new customer`);
            
            // Try to get customer email from Stripe
            try {
              const stripe = getStripe();
              const stripeCustomer = await stripe.customers.retrieve(customerId);
              if (stripeCustomer && !stripeCustomer.deleted && stripeCustomer.email) {
                // Try to find user by email
                const userByEmail = await prisma.user.findFirst({
                  where: { email: stripeCustomer.email }
                });
                
                if (userByEmail) {
                  // Update the user with the Stripe customer ID
                  await prisma.user.update({
                    where: { id: userByEmail.id },
                    data: { stripeCustomerId: customerId }
                  });
                  console.log(`Updated user ${userByEmail.id} with Stripe customer ID ${customerId}`);
                  
                  // Continue processing with this user
                  const userWithStripeId = await prisma.user.findFirst({
                    where: { id: userByEmail.id }
                  });
                  
                  if (userWithStripeId) {
                    // Process subscription creation with the updated user
                    await processSubscriptionForUser(userWithStripeId, subscription);
                  }
                } else {
                  console.log(`No user found with email ${stripeCustomer.email}`);
                }
              } else {
                console.log(`Неуспешно извличане на валидни данни за клиент от Stripe`);
              }
            } catch (err: any) {
              console.error(`Error retrieving customer from Stripe: ${err.message}`);
            }
            
            return NextResponse.json({ received: true });
          }
          
          // Process subscription for existing user
          await processSubscriptionForUser(user, subscription);
        } catch (error: any) {
          console.error(`Error processing subscription creation: ${error.message}`);
          return NextResponse.json({ received: true });
        }
        
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Грешка при обработка на webhook:", error);
    if (error instanceof Error) {
      console.error(`Error stack: ${error.stack}`);
    }
    return NextResponse.json(
      { error: "Вътрешна сървърна грешка" },
      { status: 500 }
    );
  }
}

// Helper function to process a subscription for a user
async function processSubscriptionForUser(user: any, subscription: StripeSubscriptionWithDetails) {
  // Check if subscription already exists
  const { data: existingSubscription } = await supabaseAdmin
    .from('Subscription')
    .select('id')
    .eq('stripeSubscriptionId', subscription.id)
    .eq('userId', user.id)
    .single();
  
  if (existingSubscription) {
    console.log(`Subscription ${subscription.id} already exists for user ${user.id}`);
    return;
  }
  
  // Map Stripe status to our status
  let status: SubscriptionStatus;
  switch (subscription.status) {
    case "active":
      status = "ACTIVE";
      break;
    case "trialing":
      status = "TRIALING";
      break;
    case "incomplete":
      status = "INCOMPLETE";
      break;
    default:
      status = "ACTIVE";
  }
  
  // Get price ID
  const priceId = subscription.items.data[0]?.price.id || "";
  let plan: SubscriptionPlan;
  
  // Determine plan from price ID (preferred method)
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const businessPriceId = process.env.STRIPE_BUISNESS_PRICE_ID;
  
  if (businessPriceId && priceId === businessPriceId) {
    plan = "BUSINESS";
  } else if (proPriceId && priceId === proPriceId) {
    plan = "PRO";
  } else {
    // Fallback to price amount if price ID doesn't match
    const priceAmount = subscription.items.data[0]?.price.unit_amount || 0;
    // Plan determination based on EUR prices (in cents):
    // FREE: 0 EUR
    // PRO: 13 EUR/month (130 EUR/year) = 1300 cents
    // BUSINESS: 28 EUR/month (280 EUR/year) = 2800 cents
    if (priceAmount >= 2800) {
      plan = "BUSINESS";
    } else if (priceAmount >= 1300) {
      plan = "PRO";
    } else {
      plan = "FREE";
    }
  }
  
  // Create new subscription
  const { data: newSubscription, error } = await supabaseAdmin
    .from('Subscription')
    .insert({
      id: cuid(),
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      status: status,
      plan: plan,
      priceId: priceId,
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error(`Failed to create subscription: ${error}`);
    return;
  }
  
  // Record history
  if (newSubscription) {
    await logSubscriptionHistory(
      newSubscription.id,
      status,
      `New subscription created with plan ${plan}`
    );
  }
  
  console.log(`Created new subscription for user ${user.id}`);
}
