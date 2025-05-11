import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// App name constant
const APP_NAME = "InvoiceNinja";

export async function GET() {
  try {
    // Test the database connection with a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Get PostgreSQL version
    const versionResult = await prisma.$queryRaw`SELECT version() as version`;
    
    // Get database size
    const sizeResult = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    
    // Count tables in the database
    const tablesResult = await prisma.$queryRaw`
      SELECT count(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    
    // Get counts from main tables
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    const clientCount = await prisma.client.count();
    const productCount = await prisma.product.count();
    const invoiceCount = await prisma.invoice.count();
    
    return NextResponse.json({
      status: 'success',
      message: `${APP_NAME} database connection successful`,
      data: {
        postgresql: {
          version: versionResult[0].version,
          size: sizeResult[0].size,
          tables: parseInt(tablesResult[0].table_count),
        },
        counts: {
          users: userCount,
          companies: companyCount,
          clients: clientCount,
          products: productCount,
          invoices: invoiceCount,
        },
      },
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to the database',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 