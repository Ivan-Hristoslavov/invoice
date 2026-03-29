import "server-only";

import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

type EnsureStripeCustomerBindingParams = {
  userId: string;
  email: string;
  name?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function persistStripeCustomerId(userId: string, stripeCustomerId: string) {
  const supabase = createAdminClient();

  await supabase
    .from("User")
    .update({
      stripeCustomerId,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", userId);
}

export async function ensureStripeCustomerBinding({
  userId,
  email,
  name,
}: EnsureStripeCustomerBindingParams) {
  const normalizedEmail = normalizeEmail(email);
  const supabase = createAdminClient();
  const stripe = await getStripe();

  const { data: user } = await supabase
    .from("User")
    .select("id, stripeCustomerId")
    .eq("id", userId)
    .maybeSingle();

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customers = await stripe.customers.list({
    email: normalizedEmail,
    limit: 10,
  });

  const metadataMatch = customers.data.find(
    (customer) => customer.metadata?.userId === userId
  );
  const reusableCustomer =
    metadataMatch ||
    (customers.data.length === 1 &&
    normalizeEmail(customers.data[0].email || "") === normalizedEmail
      ? customers.data[0]
      : null);

  if (reusableCustomer) {
    await stripe.customers.update(reusableCustomer.id, {
      metadata: {
        ...reusableCustomer.metadata,
        userId,
      },
      name: reusableCustomer.name || name || undefined,
    });
    await persistStripeCustomerId(userId, reusableCustomer.id);
    return reusableCustomer.id;
  }

  const customer = await stripe.customers.create({
    email: normalizedEmail,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  await persistStripeCustomerId(userId, customer.id);
  return customer.id;
}
