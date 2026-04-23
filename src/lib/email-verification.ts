import { createAdminClient } from "@/lib/supabase/server";
import { generateRawToken, hashToken } from "@/lib/token-hash";

const EMAIL_VERIFICATION_TTL_HOURS = 24;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Create a verification token for email confirmation (e.g. after register).
 * The raw token is returned once (to embed in the email link); only the hash
 * is stored in the DB so a leak does not grant a usable token.
 */
export async function createEmailVerificationToken(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const supabase = createAdminClient();
  const token = generateRawToken(32);
  const tokenHash = hashToken(token);
  const expires = new Date(
    Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000
  ).toISOString();

  await supabase
    .from("VerificationToken")
    .delete()
    .eq("identifier", normalizedEmail);

  const { error } = await supabase.from("VerificationToken").insert({
    identifier: normalizedEmail,
    token: tokenHash,
    expires,
  });

  if (error) throw error;

  return { token, expires };
}

/**
 * Consume token: validate, set User.emailVerified, delete token. Returns email if successful.
 */
export async function consumeEmailVerificationToken(
  token: string
): Promise<string | null> {
  if (!token?.trim()) return null;
  const supabase = createAdminClient();
  const tokenHash = hashToken(token);

  const { data: row, error } = await supabase
    .from("VerificationToken")
    .select("identifier, expires")
    .eq("token", tokenHash)
    .maybeSingle();

  if (error || !row) return null;

  if (new Date(row.expires).getTime() < Date.now()) {
    await supabase.from("VerificationToken").delete().eq("token", tokenHash);
    return null;
  }

  const email = row.identifier as string;

  const { error: updateError } = await supabase
    .from("User")
    .update({
      emailVerified: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("email", email);

  if (updateError) return null;

  await supabase.from("VerificationToken").delete().eq("token", tokenHash);

  return email;
}

const ONE_TIME_LOGIN_PREFIX = "login:";
const ONE_TIME_LOGIN_TTL_MINUTES = 5;

/**
 * Create a one-time login token (e.g. after email confirmation) so the user can sign in without password.
 */
export async function createOneTimeLoginToken(email: string): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  const supabase = createAdminClient();
  const token = generateRawToken(32);
  const tokenHash = hashToken(token);
  const expires = new Date(
    Date.now() + ONE_TIME_LOGIN_TTL_MINUTES * 60 * 1000
  ).toISOString();

  await supabase
    .from("VerificationToken")
    .delete()
    .eq("identifier", ONE_TIME_LOGIN_PREFIX + normalizedEmail);

  const { error } = await supabase.from("VerificationToken").insert({
    identifier: ONE_TIME_LOGIN_PREFIX + normalizedEmail,
    token: tokenHash,
    expires,
  });

  if (error) throw error;

  return token;
}

/**
 * Consume a one-time login token. Returns the email if valid and deletes the token.
 */
export async function consumeOneTimeLoginToken(
  token: string
): Promise<string | null> {
  if (!token?.trim()) return null;
  const supabase = createAdminClient();
  const tokenHash = hashToken(token);

  const { data: row, error } = await supabase
    .from("VerificationToken")
    .select("identifier, expires")
    .eq("token", tokenHash)
    .maybeSingle();

  if (error || !row || !String(row.identifier).startsWith(ONE_TIME_LOGIN_PREFIX))
    return null;

  if (new Date(row.expires).getTime() < Date.now()) {
    await supabase.from("VerificationToken").delete().eq("token", tokenHash);
    return null;
  }

  const email = String(row.identifier).slice(ONE_TIME_LOGIN_PREFIX.length);

  await supabase.from("VerificationToken").delete().eq("token", tokenHash);

  return email;
}
