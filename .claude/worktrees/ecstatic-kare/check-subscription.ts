import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Извличане на абонамента
  const subscription = await prisma.subscription.findFirst({
    where: {
      status: {
        in: ['ACTIVE', 'TRIALING', 'PAST_DUE']
      }
    },
    select: {
      id: true,
      userId: true,
      plan: true,
      status: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: true,
      stripeSubscriptionId: true
    }
  });
  
  console.log('Subscription:', JSON.stringify(subscription, null, 2));
  
  // Затваряне на Prisma клиента
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
}); 