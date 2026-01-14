const { PrismaClient } = require('@prisma/client');

// App name
const APP_NAME = "InvoiceNinja";

async function testConnection() {
  console.log(`${APP_NAME} - Database Connection Test`);
  console.log('-'.repeat(40));
  
  const prisma = new PrismaClient();
  
  try {
    console.log('Attempting to connect to the database...');
    
    // Test the connection by querying the database
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    console.log('✅ Connection successful!');
    console.log('Database details:');
    
    // Get database version
    const versionResult = await prisma.$queryRaw`SELECT version() as version`;
    console.log(`- PostgreSQL version: ${versionResult[0].version}`);
    
    // Get database size
    const sizeResult = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    console.log(`- Database size: ${sizeResult[0].size}`);
    
    // Count number of tables in the database
    const tablesResult = await prisma.$queryRaw`
      SELECT count(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log(`- Number of tables: ${tablesResult[0].table_count}`);
    
    // List the tables if there are any
    if (parseInt(tablesResult[0].table_count) > 0) {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      console.log('- Tables:');
      tables.forEach(table => {
        console.log(`  • ${table.table_name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(error);
    
    // Provide more specific error messages based on error type
    if (error.code === 'P1001') {
      console.log('\nCan\'t reach database server:');
      console.log('- Check if your database server is running');
      console.log('- Verify that the database host and port are correct');
      console.log('- Make sure network connectivity to the database is available');
    } else if (error.code === 'P1003') {
      console.log('\nDatabase does not exist:');
      console.log('- Create the database first');
      console.log('- Check NEXT_PUBLIC_SUPABASE_URL environment variable');
    } else if (error.code === 'P1017') {
      console.log('\nServer rejected the connection:');
      console.log('- Check your database username and password');
      console.log('- Verify database user permissions');
    }
    
    console.log('\nCheck your .env file and make sure the NEXT_PUBLIC_SUPABASE_URL is correctly set.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection(); 