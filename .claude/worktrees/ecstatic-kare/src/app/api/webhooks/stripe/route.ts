import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import cuid from "cuid";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import {
  getStripe,
  mapStripeStatusToDbStatus,
  resolvePlanFromPriceId,
} from "@/lib/stripe";

type DbSubscriptionStatus =
  | "ACTIVE"
  | "PAST_DUE"
  | "UNPAID"
  | "CANCELED"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING"
  | "PAUSED";

type AppUser = {
  id: string;
  email: string | null;
  stripeCustomerId?: string | null;
};

type StripeSubscriptionWithPeriods = Stripe.Subscription & {
  current_period_start: number;
  current_period_end: number;
};

type StripeInvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
  payment_intent?: string | Stripe.PaymentIntent | null;
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

function getPrimaryPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price?.id || null;
}

async function hasProcessedEvent(eventId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("WebhookEventLog")
    .select("id")
    .eq("eventId", eventId)
    .eq("status", "SUCCESS")
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

async function logWebhookEvent(event: Stripe.Event, status: "SUCCESS" | "FAILED", payload: unknown) {
  const supabase = createAdminClient();
  await supabase.from("WebhookEventLog").insert({
    id: cuid(),
    eventType: event.type,
    eventId: event.id,
    status,
    payload: JSON.stringify(payload),
    processedAt: new Date().toISOString(),
  });
}

async function logSubscriptionHistory(
  subscriptionId: string,
  status: DbSubscriptionStatus,
  event: string
) {
  const supabase = createAdminClient();
  await supabase.from("SubscriptionHistory").insert({
    id: cuid(),
    subscriptionId,
    status,
    event,
    createdAt: new Date().toISOString(),
  });
}

async function syncUserStripeCustomerId(userId: string, stripeCustomerId: string) {
  const supabase = createAdminClient();
  await supabase
    .from("User")
    .update({
      stripeCustomerId,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", userId);
}

async function getUserById(userId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("User")
    .select("id, email, stripeCustomerId")
    .eq("id", userId)
    .maybeSingle();

  return (data as AppUser | null) ?? null;
}

async function getUserByStripeCustomerId(stripeCustomerId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("User")
    .select("id, email, stripeCustomerId")
    .eq("stripeCustomerId", stripeCustomerId)
    .maybeSingle();

  return (data as AppUser | null) ?? null;
}

async function getUserByEmail(email?: string | null) {
  if (!email) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("User")
    .select("id, email, stripeCustomerId")
    .ilike("email", email.trim().toLowerCase())
    .maybeSingle();

  return (data as AppUser | null) ?? null;
}

async function resolveStripeCustomerEmail(stripeCustomerId: string) {
  const stripe = await getStripe();
  const customer = await stripe.customers.retrieve(stripeCustomerId);

  if (customer.deleted) {
    return null;
  }

  return customer.email || null;
}

async function bindStripeCustomerId(user: AppUser, stripeCustomerId?: string | null) {
  if (!stripeCustomerId) {
    return user;
  }

  const owner = await getUserByStripeCustomerId(stripeCustomerId);
  if (owner && owner.id !== user.id) {
    throw new Error("Stripe customer is already linked to another user");
  }

  if (user.stripeCustomerId !== stripeCustomerId) {
    await syncUserStripeCustomerId(user.id, stripeCustomerId);
  }

  return {
    ...user,
    stripeCustomerId,
  };
}

async function resolveUserForCheckoutSession(session: Stripe.Checkout.Session) {
  const metadataUserId = session.metadata?.userId || session.client_reference_id || null;
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : null;

  if (metadataUserId) {
    const user = await getUserById(metadataUserId);
    if (!user) {
      return null;
    }

    return bindStripeCustomerId(user, stripeCustomerId);
  }

  if (stripeCustomerId) {
    const byCustomer = await getUserByStripeCustomerId(stripeCustomerId);
    if (byCustomer) return byCustomer;
  }

  const byEmail = await getUserByEmail(session.customer_email);
  if (byEmail && stripeCustomerId && byEmail.stripeCustomerId !== stripeCustomerId) {
    await syncUserStripeCustomerId(byEmail.id, stripeCustomerId);
  }

  return byEmail;
}

async function resolveUserForSubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string | null
) {
  const metadataUserId = subscription.metadata?.userId || null;
  const stripeCustomerId =
    typeof subscription.customer === "string" ? subscription.customer : null;

  const priorityUserId = metadataUserId || fallbackUserId || null;
  if (priorityUserId) {
    const user = await getUserById(priorityUserId);
    if (!user) {
      return null;
    }

    return bindStripeCustomerId(user, stripeCustomerId);
  }

  if (stripeCustomerId) {
    const byCustomer = await getUserByStripeCustomerId(stripeCustomerId);
    if (byCustomer) return byCustomer;

    const email = await resolveStripeCustomerEmail(stripeCustomerId);
    const byEmail = await getUserByEmail(email);
    if (byEmail) {
      await syncUserStripeCustomerId(byEmail.id, stripeCustomerId);
      return byEmail;
    }
  }

  return null;
}

async function upsertSubscriptionFromStripe(
  userId: string,
  rawSubscription: Stripe.Subscription,
  historyEvent: string
) {
  const supabase = createAdminClient();
  const subscription = rawSubscription as StripeSubscriptionWithPeriods;
  const priceId = getPrimaryPriceId(subscription);
  const priceInfo = resolvePlanFromPriceId(priceId);

  if (!priceInfo || !priceId) {
    throw new Error(`Unknown Stripe price ID: ${priceId || "missing"}`);
  }

  const status = mapStripeStatusToDbStatus(subscription.status);
  const existingResult = await supabase
    .from("Subscription")
    .select("id, status, plan, stripeSubscriptionId")
    .eq("stripeSubscriptionId", subscription.id)
    .maybeSingle();

  const existingSubscription = existingResult.data;
  const payload = {
    id: existingSubscription?.id || cuid(),
    userId,
    stripeSubscriptionId: subscription.id,
    status,
    plan: priceInfo.plan,
    priceId,
    quantity: subscription.items.data[0]?.quantity || 1,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    createdAt: existingSubscription ? undefined : new Date().toISOString(),
  };

  const { data: savedSubscription, error } = await supabase
    .from("Subscription")
    .upsert(payload, { onConflict: "stripeSubscriptionId" })
    .select("id, status, plan")
    .single();

  if (error || !savedSubscription) {
    throw error || new Error("Failed to save subscription");
  }

  const shouldLog =
    !existingSubscription ||
    existingSubscription.status !== savedSubscription.status ||
    existingSubscription.plan !== savedSubscription.plan ||
    historyEvent.includes("created") ||
    historyEvent.includes("deleted");

  if (shouldLog) {
    await logSubscriptionHistory(savedSubscription.id, savedSubscription.status, historyEvent);
  }

  revalidatePath("/settings/subscription");
  revalidatePath("/settings/billing");

  return savedSubscription;
}

async function recordSubscriptionPayment(
  rawInvoice: Stripe.Invoice,
  paymentStatus: "PAID" | "FAILED"
) {
  const supabase = createAdminClient();
  const stripeInvoice = rawInvoice as StripeInvoiceWithSubscription;
  const subscriptionId =
    typeof stripeInvoice.subscription === "string" ? stripeInvoice.subscription : null;

  if (!subscriptionId || !stripeInvoice.id) {
    return;
  }

  const { data: subscription } = await supabase
    .from("Subscription")
    .select("id, userId, status")
    .eq("stripeSubscriptionId", subscriptionId)
    .maybeSingle();

  if (!subscription) {
    return;
  }

  const amount =
    paymentStatus === "PAID"
      ? Number((stripeInvoice.amount_paid || 0) / 100)
      : Number((stripeInvoice.amount_due || 0) / 100);

  const paymentPayload = {
    id: cuid(),
    subscriptionId: subscription.id,
    stripeInvoiceId: stripeInvoice.id,
    amount,
    status: paymentStatus,
    currency: stripeInvoice.currency || "eur",
    paymentMethod: null,
    paymentIntentId:
      typeof stripeInvoice.payment_intent === "string"
        ? stripeInvoice.payment_intent
        : null,
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("SubscriptionPayment")
    .upsert(paymentPayload, { onConflict: "stripeInvoiceId" });

  if (error) {
    throw error;
  }

  const nextStatus: DbSubscriptionStatus =
    paymentStatus === "PAID" ? "ACTIVE" : "PAST_DUE";

  await supabase
    .from("Subscription")
    .update({
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", subscription.id);

  await logSubscriptionHistory(
    subscription.id,
    nextStatus,
    paymentStatus === "PAID"
      ? "Платежът по абонамента е успешен"
      : "Платежът по абонамента е неуспешен"
  );

  revalidatePath("/settings/subscription");
  revalidatePath("/settings/billing");
}

async function constructStripeEvent(requestBody: string, signature: string) {
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  const stripe = await getStripe();
  return stripe.webhooks.constructEvent(requestBody, signature, webhookSecret);
}

export async function POST(req: Request) {
  let event: Stripe.Event | null = null;

  try {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature") || "";
    event = await constructStripeEvent(body, signature);

    if (await hasProcessedEvent(event.id)) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const user = await resolveUserForCheckoutSession(session);
        if (!user) {
          throw new Error("Could not resolve checkout session user");
        }

        const stripeCustomerId =
          typeof session.customer === "string" ? session.customer : null;
        if (stripeCustomerId) {
          await bindStripeCustomerId(user, stripeCustomerId);
        }

        if (typeof session.subscription === "string") {
          const stripe = await getStripe();
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await upsertSubscriptionFromStripe(
            user.id,
            subscription,
            `Checkout completed for ${session.metadata?.plan || "subscription"}`
          );
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const user = await resolveUserForSubscription(subscription);

        if (!user) {
          throw new Error("Could not resolve Stripe subscription user");
        }

        const historyEvent =
          event.type === "customer.subscription.created"
            ? "Stripe subscription created"
            : event.type === "customer.subscription.deleted"
              ? "Stripe subscription deleted"
              : "Stripe subscription updated";

        await upsertSubscriptionFromStripe(user.id, subscription, historyEvent);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as StripeInvoiceWithSubscription;
        if (!invoice.subscription) break;
        await recordSubscriptionPayment(invoice, "PAID");
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as StripeInvoiceWithSubscription;
        if (!invoice.subscription) break;
        await recordSubscriptionPayment(invoice, "FAILED");
        break;
      }

      default:
        break;
    }

    await logWebhookEvent(event, "SUCCESS", event.data.object);
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook processing failed:", error);

    if (event) {
      try {
        await logWebhookEvent(event, "FAILED", {
          error: error?.message || "Unknown webhook error",
        });
      } catch (logError) {
        console.error("Webhook failure logging failed:", logError);
      }
    }

    return NextResponse.json(
      { error: error?.message || "Webhook processing failed" },
      { status: 400 }
    );
  }
}
