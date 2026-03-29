import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripeInstance } from '@/lib/stripe';
import { getCountryCode } from '@/lib/utils';
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: company, error: companyError } = await supabase
      .from("Company")
      .select("id, name, email, country, stripeAccountId")
      .eq("userId", sessionUser.id)
      .order("createdAt", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (companyError) {
      throw companyError;
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const stripe = await getStripeInstance();
    let stripeAccountId = company.stripeAccountId;

    // If no Stripe account, create one
    if (!stripeAccountId) {
      const countryCode = getCountryCode(company.country);

      const account = await stripe.accounts.create({
        type: 'express',
        country: countryCode,
        email: company.email || undefined,
        business_type: 'company',
        business_profile: {
          name: company.name,
          product_description: 'Invoice payments via invoice app',
        },
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
      });
      stripeAccountId = account.id;
      const { error: updateError } = await supabase
        .from("Company")
        .update({ stripeAccountId, updatedAt: new Date().toISOString() })
        .eq("id", company.id)
        .eq("userId", sessionUser.id);

      if (updateError) {
        throw updateError;
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: process.env.NEXT_PUBLIC_APP_URL + '/settings/company?stripe=refresh',
      return_url: process.env.NEXT_PUBLIC_APP_URL + '/settings/company?stripe=success',
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('Stripe Connect onboarding error:', error);
    return NextResponse.json({ error: 'Failed to create Stripe onboarding link' }, { status: 500 });
  }
} 