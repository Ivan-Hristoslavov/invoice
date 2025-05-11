import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const hashedPassword = await hash('password123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
      defaultLocale: 'en'
    }
  });
  
  console.log(`Created user: ${user.name} (${user.email})`);
  
  // Create company
  const company = await prisma.company.upsert({
    where: { id: 'demo-company' },
    update: {},
    create: {
      id: 'demo-company',
      name: 'Demo Company Ltd.',
      email: 'info@democompany.com',
      phone: '+1 234 567 890',
      address: '123 Business Street',
      city: 'Sofia',
      state: 'Sofia-City',
      zipCode: '1000',
      country: 'Bulgaria',
      vatNumber: 'BG123456789',
      registrationNumber: '12345678',
      bankName: 'Demo Bank',
      bankAccount: '1234567890',
      bankIban: 'BG12DEMO12345678901234',
      userId: user.id
    }
  });
  
  console.log(`Created company: ${company.name}`);
  
  // Create clients in both English and Bulgarian
  const enClient = await prisma.client.upsert({
    where: { id: 'en-client' },
    update: {},
    create: {
      id: 'en-client',
      name: 'English Client Ltd.',
      email: 'info@enclient.com',
      phone: '+44 1234 567890',
      address: '45 London Road',
      city: 'London',
      zipCode: 'SW1A 1AA',
      country: 'United Kingdom',
      vatNumber: 'GB123456789',
      locale: 'en',
      userId: user.id
    }
  });
  
  const bgClient = await prisma.client.upsert({
    where: { id: 'bg-client' },
    update: {},
    create: {
      id: 'bg-client',
      name: 'Български Клиент ООД',
      email: 'info@bgclient.com',
      phone: '+359 2 123 4567',
      address: 'ул. Витоша 123',
      city: 'София',
      zipCode: '1000',
      country: 'България',
      vatNumber: 'BG987654321',
      locale: 'bg',
      userId: user.id
    }
  });
  
  console.log(`Created clients: ${enClient.name}, ${bgClient.name}`);
  
  // Create products with translations
  const productId = 'product-1';
  
  const product = await prisma.product.upsert({
    where: { id: productId },
    update: {},
    create: {
      id: productId,
      name: 'Web Development Services',
      description: 'Professional web development services',
      price: 100.00,
      unit: 'hour',
      taxRate: 20.00, // 20% VAT for Bulgaria
      userId: user.id,
      translations: {
        create: [
          {
            locale: 'bg',
            name: 'Услуги за уеб разработка',
            description: 'Професионални услуги за уеб разработка',
            unit: 'час'
          }
        ]
      }
    },
    include: {
      translations: true
    }
  });
  
  console.log(`Created product: ${product.name} with translations`);
  
  // Create invoices for both clients
  const enInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2023-0001',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
      status: 'UNPAID',
      subtotal: 1000.00,
      taxAmount: 200.00,
      total: 1200.00,
      currency: 'USD',
      locale: 'en',
      notes: 'Thank you for your business!',
      termsAndConditions: 'Payment due within 30 days.',
      userId: user.id,
      clientId: enClient.id,
      companyId: company.id,
      items: {
        create: [
          {
            description: 'Web Development Services',
            quantity: 10,
            unitPrice: 100.00,
            taxRate: 20.00,
            subtotal: 1000.00,
            taxAmount: 200.00,
            total: 1200.00,
            productId: product.id
          }
        ]
      }
    }
  });
  
  const bgInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2023-0002',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Due in 30 days
      status: 'UNPAID',
      subtotal: 1000.00,
      taxAmount: 200.00,
      total: 1200.00,
      currency: 'BGN',
      locale: 'bg',
      notes: 'Благодарим Ви за доверието!',
      termsAndConditions: 'Плащане в рамките на 30 дни.',
      userId: user.id,
      clientId: bgClient.id,
      companyId: company.id,
      items: {
        create: [
          {
            description: 'Услуги за уеб разработка',
            quantity: 10,
            unitPrice: 100.00,
            taxRate: 20.00,
            subtotal: 1000.00,
            taxAmount: 200.00,
            total: 1200.00,
            productId: product.id
          }
        ]
      }
    }
  });
  
  console.log(`Created invoices: ${enInvoice.invoiceNumber}, ${bgInvoice.invoiceNumber}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 