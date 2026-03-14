"use server";

import { createAdminClient } from "@/lib/supabase/server";

interface SessionUserLike {
  id?: string | null;
  email?: string | null;
}

export async function resolveSessionUser(sessionUser?: SessionUserLike | null) {
  if (!sessionUser) return null;

  const supabase = createAdminClient();

  if (sessionUser.id) {
    const { data: byId } = await supabase
      .from("User")
      .select("id, email")
      .eq("id", sessionUser.id)
      .maybeSingle();

    if (byId) return byId;
  }

  const normalizedEmail = sessionUser.email?.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const { data: byEmail } = await supabase
    .from("User")
    .select("id, email")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  return byEmail ?? null;
}
