const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Attempt to query the database
    const users = await prisma.user.findMany({ take: 1 });
    console.log('Database connection successful!');
    console.log('Users found:', users.length);
    return { success: true };
  } catch (error) {
    console.error('Error connecting to database:', error);
    return { success: false, error };
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(result => {
    console.log('Test completed:', result.success ? 'SUCCESS' : 'FAILED');
    process.exit(result.success ? 0 : 1);
  })
  .catch(e => {
    console.error('Unhandled error in test script:', e);
    process.exit(1);
  }); 