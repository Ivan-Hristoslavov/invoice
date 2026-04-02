import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const userId = session.user.id;

    // Fetch invoices first so we can use their IDs for invoice items
    const invoicesResult = await supabase
      .from("Invoice")
      .select("*")
      .eq("userId", userId);

    const invoiceIds = invoicesResult.data?.map((i) => i.id) ?? [];

    // Fetch all remaining user data in parallel
    const [
      userResult,
      companiesResult,
      clientsResult,
      productsResult,
      invoiceItemsResult,
      documentsResult,
      subscriptionsResult,
      auditLogsResult,
      creditNotesResult,
    ] = await Promise.allSettled([
      // User profile (without password)
      supabase
        .from("User")
        .select("id, name, email, emailVerified, image, createdAt, updatedAt, defaultLocale, defaultVatRate")
        .eq("id", userId)
        .single(),

      // Companies
      supabase
        .from("Company")
        .select("*")
        .eq("userId", userId),

      // Clients
      supabase
        .from("Client")
        .select("*")
        .eq("userId", userId),

      // Products with translations
      supabase
        .from("Product")
        .select("*, translations:ProductTranslation(*)")
        .eq("userId", userId),

      // Invoice items (joined via already-fetched invoice IDs — no extra query needed)
      invoiceIds.length > 0
        ? supabase.from("InvoiceItem").select("*").in("invoiceId", invoiceIds)
        : Promise.resolve({ data: [], error: null }),

      // Documents (metadata only, not the actual files)
      supabase
        .from("Document")
        .select("id, name, size, type, invoiceId, createdAt")
        .eq("userId", userId),

      // Subscriptions with payment history
      supabase
        .from("Subscription")
        .select("*, payments:SubscriptionPayment(*), history:SubscriptionHistory(*)")
        .eq("userId", userId),

      // Audit logs
      supabase
        .from("AuditLog")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false })
        .limit(1000),

      // Credit notes
      supabase
        .from("CreditNote")
        .select("*, items:CreditNoteItem(*)")
        .eq("userId", userId),
    ]);

    // Extract data from settled results (use empty fallback on failure)
    const settled = <T>(r: PromiseSettledResult<{ data: T | null; error: unknown }>): T | null =>
      r.status === "fulfilled" ? r.value.data : null;

    const userData = settled(userResult);
    const companiesData = settled(companiesResult) ?? [];
    const clientsData = settled(clientsResult) ?? [];
    const productsData = settled(productsResult) ?? [];
    const invoiceItemsData = settled(invoiceItemsResult) ?? [];
    const documentsData = settled(documentsResult) ?? [];
    const subscriptionsData = settled(subscriptionsResult) ?? [];
    const auditLogsData = settled(auditLogsResult) ?? [];
    const creditNotesData = settled(creditNotesResult) ?? [];

    // Combine invoice items with their invoices
    const invoices = (invoicesResult.data ?? []).map(invoice => ({
      ...invoice,
      items: invoiceItemsData.filter((item: { invoiceId: string }) => item.invoiceId === invoice.id),
    }));

    // Build the export object
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email,
        format: "JSON",
        gdprCompliant: true,
        description: "Пълен експорт на всички ваши лични данни съгласно GDPR Член 20 (Право на преносимост)",
      },
      user: userData ? {
        ...userData,
        // Remove sensitive fields
        stripeCustomerId: undefined,
      } : null,
      companies: companiesData,
      clients: clientsData,
      products: productsData,
      invoices,
      creditNotes: creditNotesData,
      documents: documentsData.map((doc: Record<string, unknown>) => ({
        ...doc,
        // Don't include actual file URLs for security
        url: "[URL скрит за сигурност]",
      })),
      subscriptions: subscriptionsData,
      auditLogs: auditLogsData,
      statistics: {
        totalCompanies: companiesData.length,
        totalClients: clientsData.length,
        totalProducts: productsData.length,
        totalInvoices: invoicesResult.data?.length ?? 0,
        totalCreditNotes: creditNotesData.length,
        totalDocuments: documentsData.length,
        totalAuditLogs: auditLogsData.length,
      },
    };

    // Log the export action
    await supabase.from("AuditLog").insert({
      userId,
      action: "EXPORT_DATA",
      entityType: "USER",
      entityId: userId,
      changes: JSON.stringify({
        exportedAt: exportData.exportInfo.exportedAt,
        statistics: exportData.statistics,
      }),
    });

    // Return as downloadable JSON file
    const jsonString = JSON.stringify(exportData, null, 2);
    const filename = `gdpr-export-${session.user.email}-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(jsonString, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { error: "Възникна грешка при експорт на данните" },
      { status: 500 }
    );
  }
}
