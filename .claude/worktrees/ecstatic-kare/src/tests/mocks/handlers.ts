import { http, HttpResponse } from 'msw';
import { formatApiResponse } from '@/lib/api-utils';

// Mock invoice data
const mockInvoices = [
  {
    id: '1',
    invoiceNumber: 'INV-2023-00001',
    clientId: '1',
    companyId: '1',
    userId: '1',
    issueDate: new Date('2023-01-01'),
    dueDate: new Date('2023-01-15'),
    status: 'UNPAID',
    subtotal: 1000,
    taxAmount: 200,
    total: 1200,
    client: {
      id: '1',
      name: 'Тестов Клиент ООД',
      email: 'client@example.com',
    },
    company: {
      id: '1',
      name: 'Моята Компания ООД',
    },
    items: [
      {
        id: '1',
        description: 'Услуга 1',
        quantity: 1,
        price: 1000,
        taxRate: 20,
        total: 1200,
        productId: '1',
      },
    ],
  },
];

// Define handlers
export const handlers = [
  // GET /api/invoices - List invoices
  http.get('/api/invoices', () => {
    return HttpResponse.json(
      formatApiResponse(mockInvoices, true, {
        page: 1,
        pageSize: 10,
        totalPages: 1,
        totalItems: mockInvoices.length,
      })
    );
  }),
  
  // GET /api/invoices/:id - Get invoice by ID
  http.get('/api/invoices/:id', ({ params }) => {
    const { id } = params;
    const invoice = mockInvoices.find(inv => inv.id === id);
    
    if (!invoice) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Фактурата не е намерена',
          },
        },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(
      formatApiResponse(invoice)
    );
  }),
  
  // POST /api/invoices - Create invoice
  http.post('/api/invoices', async ({ request }) => {
    const body = await request.json() as Record<string, any>;

    // Here you would normally validate the body
    const newInvoice = {
      id: '2',
      invoiceNumber: 'INV-2023-00002',
      ...body,
      issueDate: new Date(body.issueDate),
      dueDate: new Date(body.dueDate),
      status: body.status || 'DRAFT',
      subtotal: 500,
      taxAmount: 100,
      total: 600,
      client: {
        id: body.clientId,
        name: 'Нов Клиент ООД',
        email: 'newclient@example.com',
      },
      company: {
        id: body.companyId,
        name: 'Моята Компания ООД',
      },
      items: body.items.map((item: any, idx: number) => ({
        id: `item-${idx}`,
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        taxRate: item.taxRate || 20,
        total: item.quantity * item.price * (1 + (item.taxRate || 20) / 100),
        productId: item.productId || null,
      })),
    };
    
    return HttpResponse.json(
      formatApiResponse(newInvoice),
      { status: 201 }
    );
  }),
  
  // Authentication mocks
  http.post('/api/auth/signin', async ({ request }) => {
    const { email, password } = await request.json() as { email: string; password: string };
    
    if (email === 'test@example.com' && password === 'Password123!') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
          },
          accessToken: 'mock-access-token',
        },
      });
    }
    
    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Невалидно потребителско име или парола',
        },
      },
      { status: 401 }
    );
  }),
  
  // Payment mocks
  http.post('/api/payments', async ({ request }) => {
    const body = await request.json() as Record<string, any>;

    const payment = {
      id: '1',
      invoiceId: body.invoiceId,
      amount: body.amount,
      paymentDate: new Date(body.paymentDate),
      paymentMethod: body.paymentMethod,
      status: 'COMPLETED',
      transactionId: 'mock-transaction-id',
    };
    
    return HttpResponse.json(
      formatApiResponse(payment),
      { status: 201 }
    );
  }),
  
  // Client mocks
  http.get('/api/clients', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const page = parseInt(url.searchParams.get('page') || '0');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '12');

    const allClients = [
      { id: '1', name: 'Тестов Клиент ООД', email: 'client@example.com', city: 'София' },
      { id: '2', name: 'Втори Клиент', email: 'second@example.com', city: 'Пловдив' },
    ];

    const filtered = query
      ? allClients.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
      : allClients;

    if (page > 0) {
      const start = (page - 1) * pageSize;
      return HttpResponse.json({
        data: filtered.slice(start, start + pageSize),
        meta: { page, pageSize, totalItems: filtered.length, totalPages: Math.ceil(filtered.length / pageSize) },
      });
    }

    return HttpResponse.json(filtered);
  }),

  http.post('/api/clients', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const client = { id: '1', ...body, createdAt: new Date(), updatedAt: new Date() };
    return HttpResponse.json(formatApiResponse(client), { status: 201 });
  }),

  // Product mocks
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const page = parseInt(url.searchParams.get('page') || '0');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '12');

    const allProducts = [
      { id: '1', name: 'Услуга 1', description: 'Описание', price: 100, unit: 'piece', taxRate: 20 },
      { id: '2', name: 'Продукт 2', description: null, price: 50, unit: 'hour', taxRate: 0 },
    ];

    const filtered = query
      ? allProducts.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      : allProducts;

    if (page > 0) {
      const start = (page - 1) * pageSize;
      return HttpResponse.json({
        data: filtered.slice(start, start + pageSize),
        meta: { page, pageSize, totalItems: filtered.length, totalPages: Math.ceil(filtered.length / pageSize) },
      });
    }

    return HttpResponse.json(filtered);
  }),

  // Company mocks
  http.get('/api/companies', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '12');

    const allCompanies = [
      { id: '1', name: 'Моята Компания ООД', email: 'office@company.bg', bulstatNumber: '123456789', vatRegistered: true },
    ];

    if (page > 0) {
      return HttpResponse.json({
        data: allCompanies,
        meta: { page, pageSize, totalItems: allCompanies.length, totalPages: 1 },
      });
    }

    return HttpResponse.json(allCompanies);
  }),
]; 