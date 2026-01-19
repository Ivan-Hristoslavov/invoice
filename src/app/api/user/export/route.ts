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

    // Fetch all user data in parallel for better performance
    const [
      userResult,
      companiesResult,
      clientsResult,
      productsResult,
      invoicesResult,
      invoiceItemsResult,
      documentsResult,
      subscriptionsResult,
      auditLogsResult,
      creditNotesResult,
    ] = await Promise.all([
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
      
      // Invoices
      supabase
        .from("Invoice")
        .select("*")
        .eq("userId", userId),
      
      // Invoice items (we'll match them to invoices later)
      supabase
        .from("InvoiceItem")
        .select("*")
        .in("invoiceId", 
          // Get invoice IDs for this user
          (await supabase.from("Invoice").select("id").eq("userId", userId)).data?.map(i => i.id) || []
        ),
      
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
        .limit(1000), // Limit to last 1000 entries
      
      // Credit notes
      supabase
        .from("CreditNote")
        .select("*, items:CreditNoteItem(*)")
        .eq("userId", userId),
    ]);

    // Combine invoice items with their invoices
    const invoices = invoicesResult.data?.map(invoice => ({
      ...invoice,
      items: invoiceItemsResult.data?.filter(item => item.invoiceId === invoice.id) || [],
    })) || [];

    // Build the export object
    const exportData = {
      exportInfo: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email,
        format: "JSON",
        gdprCompliant: true,
        description: "Пълен експорт на всички ваши лични данни съгласно GDPR Член 20 (Право на преносимост)",
      },
      user: userResult.data ? {
        ...userResult.data,
        // Remove sensitive fields
        stripeCustomerId: undefined,
      } : null,
      companies: companiesResult.data?.map(company => ({
        ...company,
        // Remove sensitive fields
        napPassword: undefined,
      })) || [],
      clients: clientsResult.data || [],
      products: productsResult.data || [],
      invoices,
      creditNotes: creditNotesResult.data || [],
      documents: documentsResult.data?.map(doc => ({
        ...doc,
        // Don't include actual file URLs for security
        url: "[URL скрит за сигурност]",
      })) || [],
      subscriptions: subscriptionsResult.data || [],
      auditLogs: auditLogsResult.data || [],
      statistics: {
        totalCompanies: companiesResult.data?.length || 0,
        totalClients: clientsResult.data?.length || 0,
        totalProducts: productsResult.data?.length || 0,
        totalInvoices: invoicesResult.data?.length || 0,
        totalCreditNotes: creditNotesResult.data?.length || 0,
        totalDocuments: documentsResult.data?.length || 0,
        totalAuditLogs: auditLogsResult.data?.length || 0,
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
