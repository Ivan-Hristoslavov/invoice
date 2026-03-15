import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

const EMAIL_VERIFICATION_TTL_HOURS = 24;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Create a verification token for email confirmation (e.g. after register).
 * Uses VerificationToken table; identifier = email.
 */
export async function createEmailVerificationToken(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const supabase = createAdminClient();
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(
    Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000
  ).toISOString();

  await supabase
    .from("VerificationToken")
    .delete()
    .eq("identifier", normalizedEmail);

  const { error } = await supabase.from("VerificationToken").insert({
    identifier: normalizedEmail,
    token,
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

  const { data: row, error } = await supabase
    .from("VerificationToken")
    .select("identifier, expires")
    .eq("token", token.trim())
    .maybeSingle();

  if (error || !row) return null;

  if (new Date(row.expires).getTime() < Date.now()) {
    await supabase.from("VerificationToken").delete().eq("token", token.trim());
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

  await supabase.from("VerificationToken").delete().eq("token", token.trim());

  return email;
}
