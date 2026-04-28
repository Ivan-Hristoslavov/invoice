import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { createAdminClient } from "@/lib/supabase/server";
import { canExportFormat, getSubscriptionPlan } from "@/lib/subscription-plans";
import { loadInvoiceExportGraph } from "@/lib/invoice-export-data";
import { buildMicroinvestWarehouseXmlBatch } from "@/lib/invoice-export-microinvest";
import { getDatabaseStatusesForAppStatus } from "@/lib/invoice-status";
import type { InvoiceExportLike } from "@/lib/invoice-export-microinvest";

const MAX_INVOICES_PER_RANGE_EXPORT = 400;

function isIsoDateOnly(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const t = Date.parse(`${s}T12:00:00.000Z`);
  return !Number.isNaN(t);
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate") ?? "";
    const endDate = searchParams.get("endDate") ?? "";
    const companyId = searchParams.get("companyId");
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Задайте начална и крайна дата (YYYY-MM-DD)." },
        { status: 400 }
      );
    }
    if (!isIsoDateOnly(startDate) || !isIsoDateOnly(endDate)) {
      return NextResponse.json({ error: "Невалиден формат на дата." }, { status: 400 });
    }
    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Началната дата не може да е след крайната." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: subscriptions } = await supabase
      .from("Subscription")
      .select("plan, status")
      .eq("userId", sessionUser.id)
      .in("status", ["ACTIVE", "TRIALING", "PAST_DUE"])
      .order("createdAt", { ascending: false })
      .limit(1);
    const plan = getSubscriptionPlan(subscriptions?.[0]?.plan);

    if (!canExportFormat(plan.features.export, "microinvestXml")) {
      return NextResponse.json(
        {
          error:
            "Експортът за Microinvest Склад Pro е наличен в плановете Про и Бизнес.",
        },
        { status: 403 }
      );
    }

    let query = supabase
      .from("Invoice")
      .select("id")
      .eq("userId", sessionUser.id)
      .gte("issueDate", startDate)
      .lte("issueDate", endDate);

    if (companyId) {
      query = query.eq("companyId", companyId);
    }
    if (clientId) {
      query = query.eq("clientId", clientId);
    }
    if (status) {
      const matchingStatuses = getDatabaseStatusesForAppStatus(status);
      query =
        matchingStatuses.length > 1
          ? query.in("status", matchingStatuses)
          : query.eq("status", matchingStatuses[0]!);
    }

    query = query.order("issueDate", { ascending: true }).limit(MAX_INVOICES_PER_RANGE_EXPORT + 1);

    const { data: rows, error: listError } = await query;

    if (listError) {
      console.error("Microinvest XML range list error:", listError);
      return NextResponse.json({ error: "Неуспешно зареждане на фактурите" }, { status: 500 });
    }

    const ids = (rows ?? []).map((r) => r.id as string);
    if (ids.length > MAX_INVOICES_PER_RANGE_EXPORT) {
      return NextResponse.json(
        {
          error: `Твърде много фактури за един файл (над ${MAX_INVOICES_PER_RANGE_EXPORT}). Сменете периода или филтрите.`,
        },
        { status: 413 }
      );
    }

    if (ids.length === 0) {
      return NextResponse.json(
        {
          error:
            "Няма операции (фактури) за избрания период и филтри. Проверете датите и филтрите за фирма/клиент/статус.",
        },
        { status: 404 }
      );
    }

    const fullInvoices: InvoiceExportLike[] = [];
    for (const id of ids) {
      const { error, fullInvoice } = await loadInvoiceExportGraph(id, sessionUser.id);
      if (!error && fullInvoice) {
        fullInvoices.push(fullInvoice as InvoiceExportLike);
      }
    }

    if (fullInvoices.length === 0) {
      return NextResponse.json(
        { error: "Неуспешно зареждане на данните за експорт." },
        { status: 500 }
      );
    }

    const xml = buildMicroinvestWarehouseXmlBatch(fullInvoices);
    const safeStart = startDate.replace(/[^0-9-]/g, "");
    const safeEnd = endDate.replace(/[^0-9-]/g, "");
    const filename = `WarehouseProExport-range-${safeStart}-${safeEnd}.xml`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("Microinvest XML range export error:", e);
    return NextResponse.json({ error: "Неуспешен експорт" }, { status: 500 });
  }
}
