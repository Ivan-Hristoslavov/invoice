import useSWR from 'swr';
import { Invoice } from '@prisma/client';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch data');
  return res.json();
};

export function useInvoiceData(invoiceId: string) {
  const { data, error, mutate } = useSWR<Invoice>(
    `/api/invoices/${invoiceId}`,
    fetcher,
    {
      revalidateOnFocus: false, // Disable automatic revalidation on window focus
      revalidateOnReconnect: true, // Revalidate when browser regains network connection
      dedupingInterval: 60000, // Dedupe requests with the same key in 1 minute
    }
  );

  return {
    invoice: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useInvoicesList(page = 1, limit = 10, status?: string) {
  const { data, error, mutate } = useSWR(
    `/api/invoices?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
    }
  );

  return {
    invoices: data?.invoices || [],
    total: data?.total || 0,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
} 