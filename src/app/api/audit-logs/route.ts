import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    
    const invoiceId = searchParams.get("invoiceId");
    const entityType = searchParams.get("entityType");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query
    let query = supabase
      .from("AuditLog")
      .select("*")
      .eq("userId", session.user.id)
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (invoiceId) {
      query = query.eq("invoiceId", invoiceId);
    }
    
    if (entityType) {
      query = query.eq("entityType", entityType);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json(
        { error: "Грешка при зареждане на логовете" },
        { status: 500 }
      );
    }

    // Parse changes JSON for each log
    const parsedLogs = (logs || []).map(log => ({
      ...log,
      changes: log.changes ? (() => {
        try {
          return JSON.parse(log.changes);
        } catch {
          return log.changes;
        }
      })() : null,
    }));

    // Get total count
    const { count } = await supabase
      .from("AuditLog")
      .select("*", { count: "exact", head: true })
      .eq("userId", session.user.id);

    return NextResponse.json({
      logs: parsedLogs,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error in audit logs API:", error);
    return NextResponse.json(
      { error: "Грешка при обработка на заявката" },
      { status: 500 }
    );
  }
}
