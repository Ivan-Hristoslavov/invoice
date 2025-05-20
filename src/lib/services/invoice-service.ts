import { prisma } from '@/lib/db/prisma';
import { cache } from 'react';

// Кеширане на заявката за един invoice с всички related данни
export const getInvoiceWithDetails = cache(async (invoiceId: string, userId: string) => {
  return prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: true,
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
      },
    },
  });
});

// Оптимизирана заявка за списък с фактури с пагинация
export const getInvoicesList = cache(async (
  userId: string,
  page = 1,
  limit = 10,
  status?: string,
  searchTerm?: string
) => {
  const skip = (page - 1) * limit;
  
  // Създаваме базовото where условие
  const where = {
    userId,
    ...(status && { status }),
    ...(searchTerm && {
      OR: [
        { invoiceNumber: { contains: searchTerm } },
        { client: { name: { contains: searchTerm } } },
        { company: { name: { contains: searchTerm } } },
      ],
    }),
  };

  // Изпълняваме двете заявки паралелно
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        payments: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return { invoices, total };
});

// Оптимизирана заявка за статистика на дашборда
export const getInvoiceStats = cache(async (userId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const stats = await prisma.$transaction([
    // Общо неплатени фактури
    prisma.invoice.aggregate({
      where: {
        userId,
        status: 'UNPAID',
      },
      _sum: {
        total: true,
      },
      _count: true,
    }),
    
    // Фактури за текущия месец
    prisma.invoice.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        total: true,
      },
      _count: true,
    }),
    
    // Плащания за текущия месец
    prisma.payment.aggregate({
      where: {
        invoice: {
          userId,
        },
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        status: 'COMPLETED',
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    unpaidInvoices: {
      count: stats[0]._count,
      total: stats[0]._sum.total || 0,
    },
    currentMonth: {
      invoicesCount: stats[1]._count,
      invoicesTotal: stats[1]._sum.total || 0,
      paymentsTotal: stats[2]._sum.amount || 0,
    },
  };
}); 