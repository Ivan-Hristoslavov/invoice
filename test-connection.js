require('dotenv').config({ path: '.env' });
const { PrismaClient } = require('@prisma/client');

const connectionStrings = [
  process.env.DATABASE_URL,
  process.env.DB_COONECTION?.replace('[', '%5B').replace(']', '%5D'),
  `postgresql://postgres.ydkkciowyhgawxvrllse:i5r2GxNFZDNzwdt6@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require`,
  `postgresql://postgres:i5r2GxNFZDNzwdt6@db.ydkkciowyhgawxvrllse.supabase.co:5432/postgres?sslmode=require`,
];

async function testConnection(url, name) {
  try {
    const prisma = new PrismaClient({
      datasources: { db: { url } }
    });
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    await prisma.$disconnect();
    console.log(`✅ ${name}: SUCCESS`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message.split('\n')[0]}`);
    return false;
  }
}

async function main() {
  console.log('Testing connection strings...\n');
  for (const [index, url] of connectionStrings.entries()) {
    if (url) {
      await testConnection(url, `Connection ${index + 1}`);
    }
  }
}

main();
