import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";

/**
 * API route to retrieve webhook events
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminAllowlist = (process.env.WEBHOOK_EVENTS_ADMIN_EMAILS || "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
    const sessionEmail =
      sessionUser.email?.trim().toLowerCase() ||
      session.user.email?.trim().toLowerCase() ||
      "";
    const isAllowed =
      sessionEmail.length > 0 && adminAllowlist.includes(sessionEmail);

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : 100;
    const limit =
      Number.isFinite(parsedLimit) && parsedLimit > 0
        ? Math.min(parsedLimit, 500)
        : 100;
    const status = searchParams.get('status');
    const eventType = searchParams.get('eventType');
    const eventId = searchParams.get('eventId');

    const supabase = createAdminClient();
    let query = supabase
      .from("WebhookEventLog")
      .select("*")
      .order("processedAt", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }
    
    if (eventType) {
      query = query.eq("eventType", eventType);
    }
    
    if (eventId) {
      query = query.eq("eventId", eventId);
    }

    const { data: events, error } = await query;
    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      events: events || [],
      count: events?.length || 0
    });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}