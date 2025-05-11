import prisma from './db';
import { Client, Company, Product, ProductTranslation } from '@prisma/client';

// Types for creating internationalized products
type CreateProductParams = {
  name: string;
  description?: string | null;
  price: number;
  unit?: string;
  taxRate?: number;
  userId: string;
  translations?: ProductTranslationInput[];
};

type ProductTranslationInput = {
  locale: string;
  name: string;
  description?: string | null;
  unit?: string | null;
};

// Create a product with translations
export async function createProduct(data: CreateProductParams) {
  const { translations, ...productData } = data;
  
  return prisma.product.create({
    data: {
      ...productData,
      price: typeof productData.price === 'number' ? productData.price : parseFloat(productData.price as any),
      taxRate: typeof productData.taxRate === 'number' ? productData.taxRate : parseFloat(productData.taxRate as any) || 0,
      translations: translations ? {
        create: translations
      } : undefined
    },
    include: {
      translations: true
    }
  });
}

// Get product with translations for a specific locale
export async function getProductForLocale(productId: string, locale: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      translations: {
        where: { locale }
      }
    }
  });
  
  if (!product) return null;
  
  // Use the translation if available, otherwise use the default product values
  const translation = product.translations[0];
  if (translation) {
    return {
      ...product,
      name: translation.name,
      description: translation.description || product.description,
      unit: translation.unit || product.unit
    };
  }
  
  return product;
}

// Get client with locale support
export async function getClient(clientId: string) {
  return prisma.client.findUnique({
    where: { id: clientId }
  });
}

// Create an invoice with internationalization support
export async function createInvoice(data: any) {
  return prisma.invoice.create({
    data,
    include: {
      items: true,
      client: true,
      company: true
    }
  });
}

// Get invoice with items and related entities
export async function getInvoice(invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: {
        include: {
          product: true
        }
      },
      client: true,
      company: true,
      payments: true
    }
  });
}

// Generate a unique invoice number based on company and sequence
export async function generateInvoiceNumber(companyId: string, prefix = 'INV') {
  // Count existing invoices for this company to create a sequential number
  const count = await prisma.invoice.count({
    where: { companyId }
  });
  
  // Format: INV-{YYYY}-{COUNT+1}
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${(count + 1).toString().padStart(4, '0')}`;
} 