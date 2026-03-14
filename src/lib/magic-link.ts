import crypto from "crypto";
import cuid from "cuid";
import { createAdminClient } from "@/lib/supabase/server";

const MAGIC_LINK_TTL_HOURS = 24;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createMagicLinkToken(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const supabase = createAdminClient();
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + MAGIC_LINK_TTL_HOURS * 60 * 60 * 1000).toISOString();

  await supabase
    .from("VerificationToken")
    .delete()
    .eq("identifier", normalizedEmail);

  const { error } = await supabase
    .from("VerificationToken")
    .insert({
      identifier: normalizedEmail,
      token,
      expires,
    });

  if (error) throw error;

  return {
    token,
    expires,
    email: normalizedEmail,
  };
}

export async function consumeMagicLinkToken(email: string, token: string) {
  const normalizedEmail = normalizeEmail(email);
  const supabase = createAdminClient();

  const { data: verificationToken, error } = await supabase
    .from("VerificationToken")
    .select("*")
    .eq("identifier", normalizedEmail)
    .eq("token", token)
    .maybeSingle();

  if (error || !verificationToken) {
    return null;
  }

  if (new Date(verificationToken.expires).getTime() < Date.now()) {
    await supabase
      .from("VerificationToken")
      .delete()
      .eq("identifier", normalizedEmail)
      .eq("token", token);

    return null;
  }

  await supabase
    .from("VerificationToken")
    .delete()
    .eq("identifier", normalizedEmail)
    .eq("token", token);

  return {
    email: normalizedEmail,
  };
}

export async function findOrCreateMagicLinkUser(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const supabase = createAdminClient();

  const { data: existingUser } = await supabase
    .from("User")
    .select("id, email, name, image")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingUser) {
    return existingUser;
  }

  const fallbackName = normalizedEmail.split("@")[0];
  const userId = cuid();

  const { data: createdUser, error } = await supabase
    .from("User")
    .insert({
      id: userId,
      email: normalizedEmail,
      name: fallbackName,
      updatedAt: new Date().toISOString(),
    })
    .select("id, email, name, image")
    .single();

  if (error || !createdUser) {
    throw error || new Error("Failed to create user from magic link");
  }

  return createdUser;
}
