const { PrismaClient } = require('@prisma/client');

// Create a new Prisma client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testDatabase() {
  console.log('InvoiceNinja - Direct Database Test');
  console.log('-'.repeat(40));
  
  try {
    console.log('Attempting to connect to the database...');
    
    // Test the connection with a simple query
    const testResult = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Connection test:', testResult);
    
    // Get PostgreSQL version
    const versionResult = await prisma.$queryRaw`SELECT version() as version`;
    console.log('PostgreSQL version:', versionResult[0].version);
    
    // Get all tables
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    console.log('\nDatabase tables:');
    tables.forEach(table => {
      console.log(`- ${table.table_name}`);
    });
    
    // Count records in main tables
    const userCount = await prisma.user.count();
    const companyCount = await prisma.company.count();
    const clientCount = await prisma.client.count();
    const productCount = await prisma.product.count();
    const invoiceCount = await prisma.invoice.count();
    
    console.log('\nRecord counts:');
    console.log(`- Users: ${userCount}`);
    console.log(`- Companies: ${companyCount}`);
    console.log(`- Clients: ${clientCount}`);
    console.log(`- Products: ${productCount}`);
    console.log(`- Invoices: ${invoiceCount}`);
    
    // Get first user details
    const users = await prisma.user.findMany({
      take: 1,
      include: {
        companies: true,
      },
    });
    
    if (users.length > 0) {
      console.log('\nSample user:');
      console.log(`- ID: ${users[0].id}`);
      console.log(`- Name: ${users[0].name}`);
      console.log(`- Email: ${users[0].email}`);
      console.log(`- Created: ${users[0].createdAt}`);
      console.log(`- Companies: ${users[0].companies.length}`);
      
      if (users[0].companies.length > 0) {
        console.log(`  - ${users[0].companies[0].name}`);
      }
    }
    
    console.log('\n✅ Database connection and queries successful!');
  } catch (error) {
    console.error('\n❌ Database error:');
    console.error(error);
  } finally {
    // Close the database connection
    await prisma.$disconnect();
  }
}

testDatabase(); 