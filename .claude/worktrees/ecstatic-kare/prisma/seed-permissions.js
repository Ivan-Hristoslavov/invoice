const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding permissions and role permissions...');

  // Define all permissions
  const permissions = [
    // Invoice permissions
    { name: 'invoice:create', description: 'Create invoices' },
    { name: 'invoice:read', description: 'View invoices' },
    { name: 'invoice:update', description: 'Edit invoices' },
    { name: 'invoice:delete', description: 'Delete invoices' },
    { name: 'invoice:send', description: 'Send invoices to clients' },
    
    // Client permissions
    { name: 'client:create', description: 'Create clients' },
    { name: 'client:read', description: 'View clients' },
    { name: 'client:update', description: 'Edit clients' },
    { name: 'client:delete', description: 'Delete clients' },
    
    // Product permissions
    { name: 'product:create', description: 'Create products' },
    { name: 'product:read', description: 'View products' },
    { name: 'product:update', description: 'Edit products' },
    { name: 'product:delete', description: 'Delete products' },
    
    // Payment permissions
    { name: 'payment:create', description: 'Record payments' },
    { name: 'payment:read', description: 'View payments' },
    { name: 'payment:update', description: 'Edit payments' },
    { name: 'payment:delete', description: 'Delete payments' },
    
    // Company permissions
    { name: 'company:create', description: 'Create company' },
    { name: 'company:read', description: 'View company details' },
    { name: 'company:update', description: 'Edit company details' },
    { name: 'company:delete', description: 'Delete company' },
    
    // User management permissions
    { name: 'user:invite', description: 'Invite users' },
    { name: 'user:manage', description: 'Manage users and their roles' },
    
    // Settings permissions
    { name: 'settings:manage', description: 'Manage application settings' },
    
    // Reports permissions
    { name: 'reports:view', description: 'View reports' },
    { name: 'reports:export', description: 'Export reports' },
  ];

  // Create all permissions
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: { description: permission.description },
      create: {
        name: permission.name,
        description: permission.description,
      },
    });
  }

  console.log(`Created ${permissions.length} permissions`);

  // Define role permissions (only one role has full control: OWNER)
  const rolePermissions = {
    // Owner: single full-control role (all permissions). One per company.
    OWNER: permissions.map(p => p.name),

    // Admin: almost full, but cannot delete company or manage users (only OWNER can)
    ADMIN: permissions.map(p => p.name).filter(
      (name) => name !== 'company:delete' && name !== 'user:manage'
    ),
    
    // Manager has operational permissions but not deletion or company management
    MANAGER: [
      'invoice:create', 'invoice:read', 'invoice:update', 'invoice:send',
      'client:create', 'client:read', 'client:update',
      'product:create', 'product:read', 'product:update',
      'payment:create', 'payment:read', 'payment:update',
      'company:read',
      'reports:view', 'reports:export'
    ],
    
    // Accountant focuses on financial operations
    ACCOUNTANT: [
      'invoice:create', 'invoice:read', 'invoice:update', 'invoice:send',
      'client:read',
      'product:read',
      'payment:create', 'payment:read', 'payment:update',
      'company:read',
      'reports:view', 'reports:export'
    ],
    
    // Viewer has read-only access
    VIEWER: [
      'invoice:read',
      'client:read',
      'product:read',
      'payment:read',
      'company:read',
      'reports:view'
    ]
  };

  // Create role permissions
  for (const [role, permissionNames] of Object.entries(rolePermissions)) {
    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            role,
            permissionId: permission.id,
          },
        });
      }
    }
    console.log(`Created permissions for role: ${role}`);
  }

  console.log('✅ Permissions and role permissions seeded successfully');
}

main()
  .catch((e) => {
    console.error('Error seeding permissions:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 