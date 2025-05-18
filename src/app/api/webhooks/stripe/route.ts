import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import Stripe from "stripe";
import {
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentStatus,
  PrismaClient,
} from "@prisma/client";

// Extended PrismaClient type to include SubscriptionHistory
interface ExtendedPrismaClient extends PrismaClient {
  subscriptionHistory: {
    create: (params: {
      data: {
        subscriptionId: string;
        status: SubscriptionStatus;
        event: string;
      };
    }) => Promise<any>;
  };
}

// Cast prisma to include the SubscriptionHistory model
const extendedPrisma = prisma as unknown as ExtendedPrismaClient;

// Initialize Stripe with the secret key
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_FIXED || "",
  {
    apiVersion: "2023-10-16" as any,
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

/**
 * Handles Stripe webhook events to maintain subscription data in the database
 */
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature") || "";

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } else {
        // For development where signature verification might not be set up
        event = JSON.parse(body) as Stripe.Event;
        console.warn("⚠️ Webhook signature verification disabled");
      }
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`Webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      // SUBSCRIPTION CREATION VIA CHECKOUT
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Log the session for debugging
        console.log(`Processing checkout session: ${JSON.stringify(session, null, 2)}`);
        
        // Check for customer information
        if (!session.customer && !session.customer_email) {
          console.error("No customer email or ID found in checkout session");
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
            return NextResponse.json({ received: true }); // Still acknowledge the event
          }
          
          // Determine plan from checkout session amount
          const amount = session.amount_total || 0;
          let plan: SubscriptionPlan;
          
          if (amount >= 4999) {
            plan = SubscriptionPlan.VIP;
          } else if (amount >= 1999) {
            plan = SubscriptionPlan.PRO;
          } else {
            plan = SubscriptionPlan.BASIC;
          }
          
          // Get price info from subscription
          const priceId = subscription.items.data[0]?.price.id || "";
          
          // Create or update subscription record
          const existingSubscription = await prisma.subscription.findFirst({
            where: { userId: user.id }
          });
          
          if (existingSubscription) {
            await prisma.subscription.update({
              where: { id: existingSubscription.id },
              data: {
                stripeSubscriptionId: subscriptionId,
                status: SubscriptionStatus.ACTIVE,
                plan: plan,
                priceId: priceId,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                updatedAt: new Date()
              }
            });
            
            // Record history
            await extendedPrisma.subscriptionHistory.create({
              data: {
                subscriptionId: existingSubscription.id,
                status: SubscriptionStatus.ACTIVE,
                event: `Subscription updated to plan ${plan}`
              }
            });
            
            console.log(`Updated existing subscription for user ${user.id}`);
          } else {
            const newSubscription = await prisma.subscription.create({
              data: {
                userId: user.id,
                stripeSubscriptionId: subscriptionId,
                status: SubscriptionStatus.ACTIVE,
                plan: plan,
                priceId: priceId,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAtPeriodEnd: subscription.cancel_at_period_end
              }
            });
            
            // Record history
            await extendedPrisma.subscriptionHistory.create({
              data: {
                subscriptionId: newSubscription.id,
                status: SubscriptionStatus.ACTIVE,
                event: `New subscription created with plan ${plan}`
              }
            });
            
            // Record payment
            await prisma.subscriptionPayment.create({
              data: {
                subscriptionId: newSubscription.id,
                stripeInvoiceId: `checkout_${session.id}_${Date.now()}`,
                amount: amount / 100,
                status: PaymentStatus.PAID,
                currency: session.currency || "USD"
              }
            });
            
            console.log(`Created new subscription for user ${user.id}`);
          }
        } catch (error: any) {
          console.error(`Error processing checkout session: ${error.message}`);
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
            status = SubscriptionStatus.ACTIVE;
            break;
          case "past_due":
            status = SubscriptionStatus.PAST_DUE;
            break;
          case "unpaid":
            status = SubscriptionStatus.UNPAID;
            break;
          case "canceled":
            status = SubscriptionStatus.CANCELED;
            break;
          case "incomplete":
            status = SubscriptionStatus.INCOMPLETE;
            break;
          case "incomplete_expired":
            status = SubscriptionStatus.INCOMPLETE_EXPIRED;
            break;
          case "trialing":
            status = SubscriptionStatus.TRIALING;
            break;
          case "paused":
            status = SubscriptionStatus.PAUSED;
            break;
          default:
            status = SubscriptionStatus.ACTIVE;
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
              plan = SubscriptionPlan.VIP;
            } else if (priceAmount >= 2000) {
              plan = SubscriptionPlan.PRO;
            } else {
              plan = SubscriptionPlan.BASIC;
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
            await extendedPrisma.subscriptionHistory.create({
              data: {
                subscriptionId: existingSubscription.id,
                status,
                event: `Subscription status changed to ${status}`
              }
            });
          }
          
          if (planChanged) {
            await extendedPrisma.subscriptionHistory.create({
              data: {
                subscriptionId: existingSubscription.id,
                status,
                event: `Subscription plan changed to ${plan}`
              }
            });
          }
          
          if (!statusChanged && !planChanged) {
            await extendedPrisma.subscriptionHistory.create({
              data: {
                subscriptionId: existingSubscription.id,
                status,
                event: "Subscription updated"
              }
            });
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
              status: SubscriptionStatus.CANCELED,
              cancelAtPeriodEnd: true,
              updatedAt: new Date()
            }
          });
          
          // Record history
          await extendedPrisma.subscriptionHistory.create({
            data: {
              subscriptionId: existingSubscription.id,
              status: SubscriptionStatus.CANCELED,
              event: "Subscription canceled"
            }
          });
          
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
                status: PaymentStatus.PAID,
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
          if (subscription.status !== SubscriptionStatus.ACTIVE) {
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                status: SubscriptionStatus.ACTIVE,
                updatedAt: new Date()
              }
            });
            
            // Record history
            await extendedPrisma.subscriptionHistory.create({
              data: {
                subscriptionId: subscription.id,
                status: SubscriptionStatus.ACTIVE,
                event: "Subscription payment succeeded"
              }
            });
            
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
              status: SubscriptionStatus.PAST_DUE,
              updatedAt: new Date()
            }
          });
          
          // Record history
          await extendedPrisma.subscriptionHistory.create({
            data: {
              subscriptionId: subscription.id,
              status: SubscriptionStatus.PAST_DUE,
              event: "Payment failed for subscription"
            }
          });
          
          // Record failed payment
          const invoiceId = invoice.id || `inv_failed_${Date.now()}`;
          await prisma.subscriptionPayment.create({
            data: {
              subscriptionId: subscription.id,
              stripeInvoiceId: `${invoiceId}_${Date.now()}`,
              amount: invoice.amount_due / 100,
              status: PaymentStatus.FAILED,
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
    console.error(`Webhook error: ${error.message}`);
    if (error instanceof Error) {
      console.error(`Error stack: ${error.stack}`);
    }
    return NextResponse.json(
      { error: `Webhook error: ${error.message}` },
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
      status = SubscriptionStatus.ACTIVE;
      break;
    case "trialing":
      status = SubscriptionStatus.TRIALING;
      break;
    case "incomplete":
      status = SubscriptionStatus.INCOMPLETE;
      break;
    default:
      status = SubscriptionStatus.ACTIVE;
  }
  
  // Determine plan from price amount
  const priceAmount = subscription.items.data[0]?.price.unit_amount || 0;
  let plan: SubscriptionPlan;
  
  if (priceAmount >= 3000) {
    plan = SubscriptionPlan.VIP;
  } else if (priceAmount >= 2000) {
    plan = SubscriptionPlan.PRO;
  } else {
    plan = SubscriptionPlan.BASIC;
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
  await extendedPrisma.subscriptionHistory.create({
    data: {
      subscriptionId: newSubscription.id,
      status: status,
      event: `New subscription created with plan ${plan}`
    }
  });
  
  console.log(`Created new subscription for user ${user.id}`);
}
