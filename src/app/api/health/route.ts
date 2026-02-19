import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const checks: Record<string, string> = {
    status: "ok",
    timestamp: new Date().toISOString(),
  };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("User").select("id").limit(1);
    checks.database = error ? "error" : "ok";
  } catch {
    checks.database = "error";
  }

  checks.smtp = process.env.SMTP_SERVER ? "configured" : "not_configured";
  checks.stripe = process.env.STRIPE_SECRET_KEY ? "configured" : "not_configured";

  const isHealthy = checks.database === "ok";

  return NextResponse.json(checks, { status: isHealthy ? 200 : 503 });
}
