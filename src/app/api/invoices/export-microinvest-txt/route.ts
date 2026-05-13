import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { createAdminClient } from "@/lib/supabase/server";
import { canExportFormat, getSubscriptionPlan } from "@/lib/subscription-plans";
import { loadInvoiceExportGraph } from "@/lib/invoice-export-data";
import {
  buildMicroinvestWarehouseTxt,
  buildMicroinvestWarehouseTxtBatch,
} from "@/lib/invoice-export-microinvest";
import iconv from "iconv-lite";

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
    const invoiceId = searchParams.get("invoiceId");
    const txtMode = searchParams.get("txtMode") === "formscript" ? "formscript" : "kv";
    const encoding = searchParams.get("encoding") === "utf8" ? "utf8" : "cp1251";
    if (!invoiceId) {
      return NextResponse.json({ error: "Липсва ID на фактура" }, { status: 400 });
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

    if (!canExportFormat(plan.features.export, "microinvestTxt")) {
      return NextResponse.json(
        {
          error:
            "Експортът за Microinvest Склад Pro е наличен в плановете Про и Бизнес.",
        },
        { status: 403 }
      );
    }

    const { error, fullInvoice, invoice } = await loadInvoiceExportGraph(
      invoiceId,
      sessionUser.id
    );
    if (error || !fullInvoice || !invoice) {
      return NextResponse.json(
        { error: "Фактурата не е намерена или достъпът е отказан" },
        { status: 404 }
      );
    }

    const txt =
      txtMode === "formscript"
        ? buildMicroinvestWarehouseTxtBatch([fullInvoice], { includePrint: false })
        : buildMicroinvestWarehouseTxt(fullInvoice);
    const body = encoding === "cp1251" ? iconv.encode(txt, "cp1251") : txt;
    const safeName = String(invoice.invoiceNumber || invoiceId).replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `WarehouseProExport-${safeName}.txt`;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type":
          encoding === "cp1251"
            ? "text/plain; charset=windows-1251"
            : "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error("Microinvest TXT export error:", e);
    return NextResponse.json({ error: "Неуспешен експорт" }, { status: 500 });
  }
}
