"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface SubscriptionData {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface PaymentItem {
  id: string;
  subscriptionId: string;
  stripeInvoiceId: string;
  amount: string;
  currency: string;
  status: string;
  paymentMethod?: string;
  paymentIntentId?: string;
  createdAt: string;
}

interface StatusHistoryItem {
  id: string;
  subscriptionId: string;
  status: string;
  event: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasMore: boolean;
}

interface SubscriptionHistoryResponse {
  subscription: SubscriptionData | null;
  payments: PaymentItem[];
  history: StatusHistoryItem[];
  pagination: PaginationData;
  message?: string;
}

export function useSubscriptionHistory(initialPage = 1, itemsPerPage = 10) {
  const { data: session, status: sessionStatus } = useSession();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryItem[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: initialPage,
    limit: itemsPerPage,
    totalPages: 0,
    totalItems: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Function to fetch subscription history with pagination
  const fetchHistory = useCallback(async (page: number, limit: number) => {
    if (sessionStatus === 'loading') return;
    if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
      return;
    }
    
    try {
      const isInitialLoad = page === 1;
      if (isInitialLoad) {
        setIsLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const response = await fetch(`/api/subscription/history?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching subscription history: ${response.statusText}`);
      }
      
      const data: SubscriptionHistoryResponse = await response.json();
      
      if (data.message === "No active subscription found") {
        setSubscription(null);
        setPayments([]);
        setStatusHistory([]);
        setPagination({
          page,
          limit,
          totalPages: 0,
          totalItems: 0,
          hasMore: false,
        });
        return;
      }
      
      setSubscription(data.subscription);
      
      // If loading more, append to existing data, otherwise replace
      if (page > 1) {
        setPayments(prev => [...prev, ...data.payments]);
        setStatusHistory(prev => [...prev, ...data.history]);
      } else {
        setPayments(data.payments);
        setStatusHistory(data.history);
      }
      
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Error fetching subscription history:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, [sessionStatus]);
  
  // Load initial data
  useEffect(() => {
    fetchHistory(initialPage, itemsPerPage);
  }, [fetchHistory, initialPage, itemsPerPage]);
  
  // Function to load more data (next page)
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loadingMore) {
      const nextPage = pagination.page + 1;
      fetchHistory(nextPage, pagination.limit);
    }
  }, [pagination, loadingMore, fetchHistory]);
  
  // Function to refresh data
  const refresh = useCallback(() => {
    fetchHistory(1, pagination.limit);
  }, [fetchHistory, pagination.limit]);
  
  // Function to change page size
  const changePageSize = useCallback((newLimit: number) => {
    fetchHistory(1, newLimit);
  }, [fetchHistory]);
  
  return {
    subscription,
    payments,
    statusHistory,
    pagination,
    isLoading,
    loadingMore,
    error,
    loadMore,
    refresh,
    changePageSize,
  };
} 