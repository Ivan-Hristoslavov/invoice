import { createAdminClient } from '@/lib/supabase/server';
import { cache } from 'react';
import {
  getDatabaseStatusesForAppStatus,
  isIssuedLikeStatus,
  normalizeInvoiceStatus,
} from '@/lib/invoice-status';

// Кеширане на заявката за един invoice с всички related данни
export const getInvoiceWithDetails = cache(async (invoiceId: string, userId: string) => {
  try {
    const supabase = createAdminClient();
    
    const { data: invoice, error } = await supabase
      .from("Invoice")
      .select(`
        *,
        client:Client(id, name, email, phone, address, city, country, bulstatNumber, mol, vatNumber, vatRegistrationNumber, vatRegistered),
        company:Company(id, name, email, phone),
        items:InvoiceItem(*),
        payments:Payment(*)
      `)
      .eq("id", invoiceId)
      .eq("userId", userId)
      .single();

    if (error || !invoice) {
      return null;
    }

    // Sort payments by date descending
    if (invoice.payments && Array.isArray(invoice.payments)) {
      invoice.payments.sort((a: any, b: any) => {
        const dateA = new Date(a.paymentDate || 0).getTime();
        const dateB = new Date(b.paymentDate || 0).getTime();
        return dateB - dateA;
      });
    }

    return {
      ...invoice,
      status: normalizeInvoiceStatus(invoice.status),
      persistedStatus: invoice.status,
    };
  } catch (error) {
    console.error('Error fetching invoice with details:', error);
    // Return null if database is unavailable
    return null;
  }
});

// Оптимизирана заявка за списък с фактури с пагинация
export const getInvoicesList = cache(async (
  userId: string,
  page = 1,
  limit = 10,
  status?: string,
  searchTerm?: string
) => {
  try {
    const skip = (page - 1) * limit;
    const supabase = createAdminClient();
    
    // Build base query
    let query = supabase
      .from("Invoice")
      .select(`
        *,
        client:Client(id, name, email),
        company:Company(id, name),
        payments:Payment(amount, status)
      `, { count: 'exact' })
      .eq("userId", userId);

    // Apply filters
    if (status) {
      const matchingStatuses = getDatabaseStatusesForAppStatus(status);
      query =
        matchingStatuses.length > 1
          ? query.in("status", matchingStatuses)
          : query.eq("status", matchingStatuses[0]);
    }

    if (searchTerm) {
      // For Supabase, we need to use text search or filter on client/company names
      // This is a simplified version - you might want to use full-text search
      query = query.or(`invoiceNumber.ilike.%${searchTerm}%`);
    }

    // Apply sorting
    query = query.order("createdAt", { ascending: false });

    // Apply pagination
    query = query.range(skip, skip + limit - 1);

    const { data: invoices, count, error } = await query;

    if (error) {
      throw error;
    }

    return {
      invoices: (invoices || []).map((invoice: any) => ({
        ...invoice,
        status: normalizeInvoiceStatus(invoice.status),
        persistedStatus: invoice.status,
      })),
      total: count || 0,
    };
  } catch (error) {
    console.error('Error fetching invoices list:', error);
    // Return empty list if database is unavailable
    return { invoices: [], total: 0 };
  }
});

// Оптимизирана заявка за статистика на дашборда
export const getInvoiceStats = cache(async (userId: string) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    const supabase = createAdminClient();

    // Outstanding issued invoices. Older environments still persist legacy statuses.
    const { data: unpaidInvoices, count: unpaidCount } = await supabase
      .from("Invoice")
      .select("*", { count: 'exact', head: false })
      .eq("userId", userId)
      .in("status", getDatabaseStatusesForAppStatus("ISSUED"));

    const unpaidTotal = (unpaidInvoices || [])
      .filter((inv: any) => isIssuedLikeStatus(inv.status))
      .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

    // Фактури за текущия месец
    const { data: monthInvoices, count: monthCount } = await supabase
      .from("Invoice")
      .select("*", { count: 'exact', head: false })
      .eq("userId", userId)
      .gte("createdAt", startOfMonth)
      .lte("createdAt", endOfMonth);

    const monthInvoicesTotal = (monthInvoices || []).reduce((sum, inv) => sum + Number(inv.total || 0), 0);

    // Плащания за текущия месец - get all payments for user's invoices in this month
    const invoiceIds = (monthInvoices || []).map((inv: any) => inv.id);
    let monthPaymentsTotal = 0;
    
    if (invoiceIds.length > 0) {
      const { data: monthPayments } = await supabase
        .from("Payment")
        .select("amount")
        .eq("status", "COMPLETED")
        .gte("paymentDate", startOfMonth)
        .lte("paymentDate", endOfMonth)
        .in("invoiceId", invoiceIds);
      
      monthPaymentsTotal = (monthPayments || []).reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);
    }

    return {
      unpaidInvoices: {
        count: unpaidCount || 0,
        total: unpaidTotal,
      },
      currentMonth: {
        invoicesCount: monthCount || 0,
        invoicesTotal: monthInvoicesTotal,
        paymentsTotal: monthPaymentsTotal,
      },
    };
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    // Return empty stats if database is unavailable
    return {
      unpaidInvoices: {
        count: 0,
        total: 0,
      },
      currentMonth: {
        invoicesCount: 0,
        invoicesTotal: 0,
        paymentsTotal: 0,
      },
    };
  }
}); 