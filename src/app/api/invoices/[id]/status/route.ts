import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { resolveSessionUser } from "@/lib/session-user";
import {
  getDatabaseStatusForAppStatus,
  normalizeInvoiceStatus,
  type AppInvoiceStatus,
} from "@/lib/invoice-status";
import { validateInvoiceForIssuing } from "@/lib/validate-invoice-for-issuing";

// Valid status transitions for the current invoice lifecycle.
const VALID_TRANSITIONS: Record<AppInvoiceStatus, AppInvoiceStatus[]> = {
  DRAFT: ["ISSUED", "VOIDED"],
  ISSUED: [],
  VOIDED: [],
  CANCELLED: [],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const supabase = createAdminClient();

    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select("id, userId")
      .eq("id", id)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Фактурата не е намерена" },
        { status: 404 }
      );
    }

    if (invoice.userId !== sessionUser.id) {
      return NextResponse.json({ error: "Достъпът е отказан" }, { status: 403 });
    }

    const { data: fullInvoice, error: fullError } = await supabase
      .from("Invoice")
      .select("*, company:Company(*), client:Client(*), items:InvoiceItem(*)")
      .eq("id", id)
      .single();

    if (fullError || !fullInvoice) {
      console.error("Грешка при зареждане на фактура за валидация:", fullError);
      return NextResponse.json(
        { error: "Неуспешно зареждане на фактурата за валидация" },
        { status: 500 }
      );
    }

    const { validationErrors, warnings } = validateInvoiceForIssuing(fullInvoice);

    return NextResponse.json({
      valid: validationErrors.length === 0,
      errors: validationErrors,
      warnings,
    });
  } catch (error) {
    console.error("Грешка при валидация на фактура за издаване:", error);
    return NextResponse.json(
      { error: "Грешка при валидация на фактурата" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }
    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Невалидно тяло на заявката" },
        { status: 400 }
      );
    }

    const requestedStatus = normalizeInvoiceStatus(body.status);

    if (!body.status) {
      return NextResponse.json(
        { error: "Статусът е задължителен" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch current invoice - first check if it exists
    const { data: invoice, error: invoiceError } = await supabase
      .from("Invoice")
      .select("id, status, userId")
      .eq("id", id)
      .single();

    if (invoiceError) {
      console.error("Грешка при зареждане на фактура:", invoiceError);
      return NextResponse.json(
        { error: "Фактурата не е намерена" },
        { status: 404 }
      );
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Фактурата не е намерена" },
        { status: 404 }
      );
    }

    // Check ownership
    if (invoice.userId !== sessionUser.id) {
      return NextResponse.json(
        { error: "Достъпът е отказан" },
        { status: 403 }
      );
    }

    // Map current status from DB to app status for validation
    const currentAppStatus = normalizeInvoiceStatus(invoice.status);

    // Validate status transition
    const allowedTransitions = VALID_TRANSITIONS[currentAppStatus] || [];
    if (!allowedTransitions.includes(requestedStatus)) {
      return NextResponse.json(
        {
          error: `Не може да се промени статуса от ${currentAppStatus} към ${requestedStatus}. Позволени преходи: ${allowedTransitions.join(", ") || "няма"}`,
        },
        { status: 400 }
      );
    }

    if (requestedStatus === "ISSUED") {
      const { data: fullInvoice, error: fullError } = await supabase
        .from("Invoice")
        .select("*, company:Company(*), client:Client(*), items:InvoiceItem(*)")
        .eq("id", id)
        .single();

      if (fullError || !fullInvoice) {
        console.error("Грешка при зареждане на фактура за валидация:", fullError);
        return NextResponse.json(
          { error: "Неуспешно зареждане на фактурата за валидация" },
          { status: 500 }
        );
      }

      const { validationErrors, warnings } = validateInvoiceForIssuing(fullInvoice);
      if (validationErrors.length > 0) {
        return NextResponse.json(
          {
            error: "Фактурата не може да бъде издадена поради липсващи данни",
            validationErrors,
            warnings,
          },
          { status: 422 }
        );
      }
    }

    const nextDatabaseStatus = getDatabaseStatusForAppStatus(requestedStatus);

    // Update invoice status
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("Invoice")
      .update({
        status: nextDatabaseStatus,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Грешка при обновяване на статуса на фактура:", updateError);
      return NextResponse.json(
        { error: "Грешка при обновяване на статуса" },
        { status: 500 }
      );
    }

    // Try to log audit action (non-blocking)
    try {
      const { logAction } = await import("@/lib/audit-log");
      const headers = request.headers;

      // Determine action type based on new status
      const actionType =
        requestedStatus === "VOIDED"
          ? "VOID"
          : requestedStatus === "ISSUED"
            ? "ISSUE"
            : "UPDATE";

      await logAction({
        userId: sessionUser.id,
        action: actionType,
        entityType: "INVOICE",
        entityId: id,
        invoiceId: id,
        changes: {
          previousStatus: invoice.status,
          newStatus: requestedStatus,
          persistedStatus: nextDatabaseStatus,
          reason: body.reason || undefined,
        },
        ipAddress: headers.get("x-forwarded-for") || headers.get("x-real-ip") || undefined,
        userAgent: headers.get("user-agent") || undefined,
      });
    } catch (auditError) {
      console.error("Неуспешно логване на audit действие:", auditError);
      // Continue - audit logging should not block the response
    }

    revalidatePath(`/invoices/${id}`);
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return NextResponse.json({
      ...updatedInvoice,
      status: normalizeInvoiceStatus(updatedInvoice?.status),
      persistedStatus: updatedInvoice?.status,
    });
  } catch (error) {
    console.error("Грешка при промяна на статуса на фактура:", error);
    return NextResponse.json(
      { error: "Грешка при промяна на статуса" },
      { status: 500 }
    );
  }
}
