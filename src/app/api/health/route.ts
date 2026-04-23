import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Health check with two surfaces:
 *   - Public: returns only `{status: "ok" | "error"}` so uptime probes work
 *     without leaking component state to attackers.
 *   - Admin: when the request carries `x-health-secret` that matches
 *     `HEALTH_SECRET`, the response includes DB / SMTP / Stripe configuration
 *     flags for internal diagnostics.
 */
export async function GET(request: NextRequest) {
  let databaseOk = false;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("User").select("id").limit(1);
    databaseOk = !error;
  } catch {
    databaseOk = false;
  }

  const status = databaseOk ? "ok" : "error";
  const httpStatus = databaseOk ? 200 : 503;

  const adminSecret = process.env.HEALTH_SECRET;
  const providedSecret = request.headers.get("x-health-secret");
  const isAdmin = Boolean(
    adminSecret && providedSecret && providedSecret === adminSecret
  );

  if (!isAdmin) {
    return NextResponse.json({ status }, { status: httpStatus });
  }

  const checks: Record<string, string> = {
    status,
    timestamp: new Date().toISOString(),
    database: databaseOk ? "ok" : "error",
    smtp: process.env.SMTP_SERVER ? "configured" : "not_configured",
    stripe:
      process.env.STRIPE_SECRET_KEY_FIXED || process.env.STRIPE_SECRET_KEY
        ? "configured"
        : "not_configured",
    ratelimit: process.env.UPSTASH_REDIS_REST_URL ? "configured" : "not_configured",
  };

  return NextResponse.json(checks, { status: httpStatus });
}
