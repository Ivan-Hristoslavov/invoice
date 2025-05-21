import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { headers } from "next/headers";
import Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import { InvoiceStatus, SubscriptionStatus, PaymentMethod } from "@prisma/client";

// Define custom types for easier use
type SubscriptionPlan = "BASIC" | "PRO" | "VIP";
type PaymentStatus = "PAID" | "FAILED" | "REFUNDED" | "COMPLETED";

// Initialize Stripe with the secret key
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_FIXED || "",
  {
    apiVersion: "2025-04-30.basil" as Stripe.LatestApiVersion,
  }
);

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
    // Use manual SQL insertion if needed due to Prisma client type issues
    await prisma.$executeRaw`
      INSERT INTO "WebhookEventLog" ("id", "eventType", "eventId", "status", "payload", "processedAt")
      VALUES (gen_random_uuid(), ${eventType}, ${eventId}, ${status}, ${JSON.stringify(data)}, now())
    `;
    console.log(`Logged webhook event: ${eventType} (${eventId}) - Status: ${status}`);
  } catch (error) {
    console.error(`Failed to log webhook event: ${error}`);
  }
}

// Create or update subscription history entry
async function logSubscriptionHistory(subscriptionId: string, status: SubscriptionStatus, event: string) {
  try {
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        status,
        event
      }
    });
    console.log(`Logged subscription history: ${subscriptionId} - ${event}`);
  } catch (error) {
    console.error(`Failed to log subscription history: ${error}`);
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
        console.error("Could not parse webhook body", parseErr);
      }
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    
    if (!event) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }
    
    // Log the received event immediately
    await logWebhookEvent(event.type, event.id, "SUCCESS", event.data.object);

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata?.invoiceId;

        if (!invoiceId) {
          console.error("No invoiceId found in payment intent metadata");
          await logWebhookEvent(event.type, event.id, "FAILED", { error: "No invoiceId found" });
          return NextResponse.json({ error: "No invoiceId found" }, { status: 400 });
        }

        try {
          // Find invoice with related client and company
          const invoiceWithRelations = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
              client: true,
              company: true
            }
          });
          
          if (!invoiceWithRelations) {
            throw new Error(`Invoice with ID ${invoiceId} not found`);
          }
          
          // Update invoice status and create payment record
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: "PAID" as InvoiceStatus,
              paidAt: new Date(),
              payments: {
                create: {
                  amount: paymentIntent.amount / 100,
                  paymentDate: new Date(),
                  paymentMethod: "CREDIT_CARD" as PaymentMethod,
                  transactionId: paymentIntent.id,
                  status: "PAID",
                  notes: "Платено чрез Stripe",
                  reference: paymentIntent.id
                }
              }
            }
          });

          // Send confirmation emails
          try {
            // Send to client
            if (invoiceWithRelations.client?.email) {
              await sendPaymentConfirmationEmail({
                to: invoiceWithRelations.client.email,
                invoiceNumber: invoiceWithRelations.invoiceNumber,
                amount: Number(invoiceWithRelations.total),
                currency: invoiceWithRelations.currency,
                clientName: invoiceWithRelations.client.name,
                companyName: invoiceWithRelations.company.name
              });
            }

            // Send to company
            if (invoiceWithRelations.company?.email) {
              await sendPaymentConfirmationEmail({
                to: invoiceWithRelations.company.email,
                invoiceNumber: invoiceWithRelations.invoiceNumber,
                amount: Number(invoiceWithRelations.total),
                currency: invoiceWithRelations.currency,
                clientName: invoiceWithRelations.client.name,
                companyName: invoiceWithRelations.company.name
              });
            }
          } catch (error) {
            console.error("Error sending confirmation emails:", error);
            // Don't throw error here, just log it
          }

          // Revalidate pages
          revalidatePath(`/invoices/${invoiceId}`);
          revalidatePath("/invoices");
          revalidatePath("/dashboard");
        } catch (error) {
          console.error("Error processing payment_intent.succeeded:", error);
          await logWebhookEvent(event.type, event.id, "FAILED", { error: String(error) });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const invoiceId = paymentIntent.metadata?.invoiceId;

        if (!invoiceId) {
          await logWebhookEvent(event.type, event.id, "FAILED", { error: "No invoiceId found" });
          return NextResponse.json({ error: "No invoiceId found" }, { status: 400 });
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
          console.error("Error processing payment_intent.payment_failed:", error);
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
            console.error(`No payment found for payment intent ${paymentIntentId}`);
            await logWebhookEvent(event.type, event.id, "FAILED", { error: `No payment found for payment intent ${paymentIntentId}` });
          }
        } catch (error) {
          console.error("Error processing charge.refunded:", error);
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
          console.error("No customer email or ID found in checkout session");
          await logWebhookEvent(event.type, event.id, "FAILED", { error: "No customer email or ID found" });
          return NextResponse.json({ received: true }); // Still return 200 to acknowledge the event
        }
        
        // Determine subscription details
        const customerId = typeof session.customer === 'string' ? session.customer : '';
        const customerEmail = session.customer_email || '';
        
        // Check for subscription ID (it might be undefined for non-subscription checkouts)
        if (!session.subscription) {
          console.log("No subscription created in this checkout session");
          return NextResponse.json({ received: true });
        }
        
        const subscriptionId = typeof session.subscription === 'string' 
          ? session.subscription 
          : '';
        
        if (!subscriptionId) {
          console.log("Invalid subscription ID format");
          return NextResponse.json({ received: true });
        }
        
        try {
          // Get full subscription details from Stripe
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
            console.error("Could not find or create user from checkout data");
            await logWebhookEvent(event.type, event.id, "FAILED", { error: "Could not find or create user" });
            return NextResponse.json({ received: true }); // Still acknowledge the event
          }
          
          // Determine plan from checkout session amount
          const amount = session.amount_total || 0;
          let plan: SubscriptionPlan;
          
          if (amount >= 4999) {
            plan = "VIP";
          } else if (amount >= 1999) {
            plan = "PRO";
          } else {
            plan = "BASIC";
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
          return NextResponse.json({ error: "User not found" }, { status: 400 });
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
          let plan = existingSubscription.plan;
          if (priceAmount) {
            if (priceAmount >= 3000) {
              plan = "VIP";
            } else if (priceAmount >= 2000) {
              plan = "PRO";
            } else {
              plan = "BASIC";
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
              "Subscription updated"
            );
          }
        } else {
          console.error(`No subscription found for stripe subscription ID ${subscription.id}`);
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
          return NextResponse.json({ error: "User not found" }, { status: 400 });
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
            "Subscription canceled"
          );
          
          console.log(`Subscription ${existingSubscription.id} marked as canceled`);
        } else {
          console.error(`No subscription found for stripe subscription ID ${subscription.id}`);
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
            console.log("No customer ID found in invoice");
            return NextResponse.json({ received: true });
          }
          
          // Check if this is a subscription invoice
          if (!invoice.subscription) {
            console.log("Not a subscription invoice");
            return NextResponse.json({ received: true });
          }
          
          const subscriptionId = typeof invoice.subscription === 'string' 
            ? invoice.subscription 
            : '';
          
          if (!subscriptionId) {
            console.log("Invalid subscription ID format in invoice");
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
            console.log(`No subscription found with ID ${subscriptionId} - might be a new subscription`);
            
            // Try to retrieve the subscription details from Stripe
            try {
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
              "Subscription payment succeeded"
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
          return NextResponse.json({ error: "Missing required IDs" }, { status: 400 });
        }
        
        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId }
        });
        
        if (!user) {
          console.error(`No user found for customer ${customerId}`);
          return NextResponse.json({ error: "User not found" }, { status: 400 });
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
            "Payment failed for subscription"
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
          console.error(`No subscription found for stripe subscription ID ${subscriptionId}`);
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
            console.log("No customer ID found in subscription");
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
                console.log(`Could not retrieve valid customer data from Stripe`);
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
    console.error("Error processing webhook:", error);
    if (error instanceof Error) {
      console.error(`Error stack: ${error.stack}`);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to process a subscription for a user
async function processSubscriptionForUser(user: any, subscription: StripeSubscriptionWithDetails) {
  // Check if subscription already exists
  const existingSubscription = await prisma.subscription.findFirst({
    where: { 
      stripeSubscriptionId: subscription.id,
      userId: user.id
    }
  });
  
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
  
  // Determine plan from price amount
  const priceAmount = subscription.items.data[0]?.price.unit_amount || 0;
  let plan: SubscriptionPlan;
  
  if (priceAmount >= 3000) {
    plan = "VIP";
  } else if (priceAmount >= 2000) {
    plan = "PRO";
  } else {
    plan = "BASIC";
  }
  
  // Get price ID
  const priceId = subscription.items.data[0]?.price.id || "";
  
  // Create new subscription
  const newSubscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      stripeSubscriptionId: subscription.id,
      status: status,
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
    status,
    `New subscription created with plan ${plan}`
  );
  
  console.log(`Created new subscription for user ${user.id}`);
}
