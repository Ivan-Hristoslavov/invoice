const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding database...');
  
  // Create a demo user
  const hashedPassword = await hash('password123', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@example.com',
      password: hashedPassword,
    },
  });
  
  console.log(`Created demo user: ${demoUser.name} (${demoUser.email})`);

  // Create a company for the demo user
  const company = await prisma.company.upsert({
    where: {
      id: 'company-demo-1',
    },
    update: {},
    create: {
      id: 'company-demo-1',
      name: 'InvoiceNinja Demo Company',
      email: 'company@example.com',
      phone: '555-123-4567',
      address: '123 Business St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94103',
      country: 'United States',
      vatNumber: 'US123456789',
      userId: demoUser.id,
    },
  });
  
  console.log(`Created company: ${company.name}`);

  // Create some clients
  const clients = [
    {
      name: 'Acme Corporation',
      email: 'info@acme.example',
      phone: '555-111-2222',
      address: '100 Main St',
      city: 'New York',
      state: 'NY',
      country: 'United States',
      userId: demoUser.id,
    },
    {
      name: 'Wayne Enterprises',
      email: 'info@wayne.example',
      phone: '555-333-4444',
      address: '1 Wayne Tower',
      city: 'Gotham',
      state: 'NJ',
      country: 'United States',
      userId: demoUser.id,
    },
    {
      name: 'Stark Industries',
      email: 'info@stark.example',
      phone: '555-555-6666',
      address: '200 Park Ave',
      city: 'New York',
      state: 'NY',
      country: 'United States',
      userId: demoUser.id,
    },
  ];

  for (const clientData of clients) {
    const client = await prisma.client.upsert({
      where: { 
        // Create a unique compound key based on name and email
        id: Buffer.from(`${clientData.name}-${clientData.email}`).toString('base64').substring(0, 24),
      },
      update: {},
      create: {
        id: Buffer.from(`${clientData.name}-${clientData.email}`).toString('base64').substring(0, 24),
        ...clientData,
      },
    });
    
    console.log(`Created client: ${client.name}`);
  }

  // Create some products
  const products = [
    {
      name: 'Web Development',
      description: 'Custom website development services',
      price: 150.00,
      unit: 'hour',
      taxRate: 0.00,
      userId: demoUser.id,
    },
    {
      name: 'Logo Design',
      description: 'Professional logo design with unlimited revisions',
      price: 500.00,
      unit: 'project',
      taxRate: 0.00,
      userId: demoUser.id,
    },
    {
      name: 'SEO Consulting',
      description: 'Search engine optimization consulting services',
      price: 100.00,
      unit: 'hour',
      taxRate: 0.00,
      userId: demoUser.id,
    },
    {
      name: 'Domain Registration',
      description: 'Domain name registration for 1 year',
      price: 15.00,
      unit: 'domain',
      taxRate: 0.00,
      userId: demoUser.id,
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { 
        // Create a unique key based on name and user ID
        id: Buffer.from(`${productData.name}-${demoUser.id}`).toString('base64').substring(0, 24),
      },
      update: {},
      create: {
        id: Buffer.from(`${productData.name}-${demoUser.id}`).toString('base64').substring(0, 24),
        ...productData,
      },
    });
    
    console.log(`Created product: ${product.name} (${product.price} per ${product.unit})`);
  }

  // Create some invoices with line items
  const createdClients = await prisma.client.findMany({
    where: { userId: demoUser.id },
  });
  
  const createdProducts = await prisma.product.findMany({
    where: { userId: demoUser.id },
  });
  
  // Helper function to create an invoice
  const createInvoice = async (number, client, issueDate, dueDate, status, items) => {
    // Calculate subtotal, tax amount and total
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice * item.taxRate / 100), 0);
    const total = subtotal + taxAmount;
    
    // Create the invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: number,
        clientId: client.id,
        companyId: company.id,
        userId: demoUser.id,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        status,
        subtotal,
        taxAmount,
        total,
        currency: 'USD',
        items: {
          create: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            subtotal: item.quantity * item.unitPrice,
            taxAmount: item.quantity * item.unitPrice * item.taxRate / 100,
            total: (item.quantity * item.unitPrice) + (item.quantity * item.unitPrice * item.taxRate / 100),
            productId: item.productId,
          })),
        },
      },
    });
    
    console.log(`Created invoice: ${invoice.invoiceNumber} (${invoice.status}) - $${invoice.total}`);
    return invoice;
  };
  
  // Create sample invoices
  await createInvoice(
    'INV-001',
    createdClients[0],
    '2023-10-15',
    '2023-10-30',
    'PAID',
    [
      {
        description: 'Web Development Services',
        quantity: 10,
        unitPrice: 120.00,
        taxRate: 0,
        productId: createdProducts[0].id,
      },
      {
        description: 'Logo Design',
        quantity: 1,
        unitPrice: 500.00,
        taxRate: 0,
        productId: createdProducts[1].id,
      },
    ]
  );
  
  await createInvoice(
    'INV-002',
    createdClients[1],
    '2023-10-20',
    '2023-11-05',
    'UNPAID',
    [
      {
        description: 'SEO Consulting',
        quantity: 20,
        unitPrice: 100.00,
        taxRate: 0,
        productId: createdProducts[2].id,
      },
      {
        description: 'Domain Registration',
        quantity: 5,
        unitPrice: 15.00,
        taxRate: 0,
        productId: createdProducts[3].id,
      },
    ]
  );
  
  await createInvoice(
    'INV-003',
    createdClients[2],
    '2023-10-25',
    '2023-11-10',
    'PAID',
    [
      {
        description: 'Web Development Services',
        quantity: 15,
        unitPrice: 120.00,
        taxRate: 0,
        productId: createdProducts[0].id,
      },
    ]
  );
  
  await createInvoice(
    'INV-004',
    createdClients[0],
    '2023-10-30',
    '2023-11-15',
    'OVERDUE',
    [
      {
        description: 'SEO Consulting',
        quantity: 8,
        unitPrice: 100.00,
        taxRate: 0,
        productId: createdProducts[2].id,
      },
      {
        description: 'Logo Design',
        quantity: 1,
        unitPrice: 500.00,
        taxRate: 0,
        productId: createdProducts[1].id,
      },
    ]
  );

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 