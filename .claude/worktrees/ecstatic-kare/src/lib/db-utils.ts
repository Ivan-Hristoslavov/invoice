import { supabaseAdmin } from './supabase';

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
  const cuid = require('cuid');
  
  const productId = cuid();
  
  // Create product
  const { data: product, error: productError } = await supabaseAdmin
    .from('Product')
    .insert({
      id: productId,
      ...productData,
      price: typeof productData.price === 'number' ? productData.price : parseFloat(productData.price as any),
      taxRate: typeof productData.taxRate === 'number' ? productData.taxRate : parseFloat(productData.taxRate as any) || 0,
    })
    .select()
    .single();
  
  if (productError) throw productError;
  
  // Create translations if provided
  if (translations && translations.length > 0) {
    const translationData = translations.map(t => ({
      id: cuid(),
      productId,
      ...t
    }));
    
    await supabaseAdmin
      .from('ProductTranslation')
      .insert(translationData);
  }
  
  // Return product with translations
  const { data: result } = await supabaseAdmin
    .from('Product')
    .select('*, translations:ProductTranslation(*)')
    .eq('id', productId)
    .single();
  
  return result;
}

// Get product with translations for a specific locale
export async function getProductForLocale(productId: string, locale: string) {
  const { data: product, error } = await supabaseAdmin
    .from('Product')
    .select('*')
    .eq('id', productId)
    .single();
  
  if (error || !product) return null;
  
  // Get translation for locale
  const { data: translations } = await supabaseAdmin
    .from('ProductTranslation')
    .select('*')
    .eq('productId', productId)
    .eq('locale', locale);
  
  // Use the translation if available, otherwise use the default product values
  const translation = translations?.[0];
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
  const { data, error } = await supabaseAdmin
    .from('Client')
    .select('*')
    .eq('id', clientId)
    .single();
  
  return error ? null : data;
}

// Create an invoice with internationalization support
export async function createInvoice(data: any) {
  const cuid = require('cuid');
  const invoiceId = data.id || cuid();
  
  const { items, ...invoiceData } = data;
  
  // Create invoice
  const { data: invoice, error: invoiceError } = await supabaseAdmin
    .from('Invoice')
    .insert({
      id: invoiceId,
      ...invoiceData
    })
    .select()
    .single();
  
  if (invoiceError) throw invoiceError;
  
  // Create items if provided
  if (items && items.length > 0) {
    const itemData = items.map((item: any) => ({
      id: cuid(),
      invoiceId,
      ...item
    }));
    
    await supabaseAdmin
      .from('InvoiceItem')
      .insert(itemData);
  }
  
  // Return invoice with related data
  const { data: result } = await supabaseAdmin
    .from('Invoice')
    .select(`
      *,
      items:InvoiceItem(*),
      client:Client(*),
      company:Company(*)
    `)
    .eq('id', invoiceId)
    .single();
  
  return result;
}

// Get invoice with items and related entities
export async function getInvoice(invoiceId: string) {
  const { data, error } = await supabaseAdmin
    .from('Invoice')
    .select(`
      *,
      items:InvoiceItem(*, product:Product(*)),
      client:Client(*),
      company:Company(*)
    `)
    .eq('id', invoiceId)
    .single();
  
  return error ? null : data;
}

// Generate a unique invoice number based on company and sequence
export async function generateInvoiceNumber(companyId: string, prefix = 'INV') {
  // Count existing invoices for this company to create a sequential number
  const { count, error } = await supabaseAdmin
    .from('Invoice')
    .select('*', { count: 'exact', head: true })
    .eq('companyId', companyId);
  
  // Format: INV-{YYYY}-{COUNT+1}
  const year = new Date().getFullYear();
  const nextNumber = ((count || 0) + 1).toString().padStart(4, '0');
  return `${prefix}-${year}-${nextNumber}`;
}
