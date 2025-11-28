import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PERMISSIONS = {
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_PRODUCTS: 'MANAGE_PRODUCTS',
  VIEW_PRODUCTS: 'VIEW_PRODUCTS',
  CREATE_SALE: 'CREATE_SALE',
  VIEW_SALES: 'VIEW_SALES',
  DELETE_SALE: 'DELETE_SALE',
  CREATE_PURCHASE: 'CREATE_PURCHASE',
  VIEW_PURCHASES: 'VIEW_PURCHASES',
} as const;

type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_DEFINITIONS: Record<string, PermissionCode[]> = {
  SUPER_USER: Object.values(PERMISSIONS),
  ADMIN: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_SALE,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.DELETE_SALE,
    PERMISSIONS.CREATE_PURCHASE,
    PERMISSIONS.VIEW_PURCHASES,
  ],
  NORMAL_USER: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_SALE,
    PERMISSIONS.VIEW_SALES,
    PERMISSIONS.CREATE_PURCHASE,
    PERMISSIONS.VIEW_PURCHASES,
  ],
  CASHIER: [
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_SALE,
    PERMISSIONS.VIEW_SALES,
  ],
};

async function main() {
  console.log('Seeding database...');

  // Ensure permissions exist
  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({
      where: { code },
      update: {},
      create: {
        code,
        description: code.replace(/_/g, ' ').toLowerCase(),
      },
    });
  }

  // Ensure roles and role permissions exist
  for (const [roleName, permissions] of Object.entries(ROLE_DEFINITIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: `${roleName.replace(/_/g, ' ')} role` },
      create: {
        name: roleName,
        description: `${roleName.replace(/_/g, ' ')} role`,
      },
    });

    for (const permissionCode of permissions) {
      const permission = await prisma.permission.findUnique({ where: { code: permissionCode } });
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  const superUserUsername = 'superuser';
  const superUserPassword = 'ChangeMe123!';

  const passwordHash = await bcrypt.hash(superUserPassword, 12);

  const superUser = await prisma.user.upsert({
    where: { username: superUserUsername },
    update: {
      displayName: 'Super User',
      isActive: true,
      isSystem: true,
      passwordHash,
    },
    create: {
      username: superUserUsername,
      displayName: 'Super User',
      isActive: true,
      isSystem: true,
      passwordHash,
    },
  });

  const superRole = await prisma.role.findUnique({ where: { name: 'SUPER_USER' } });
  if (superRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: superUser.id,
          roleId: superRole.id,
        },
      },
      update: {},
      create: {
        userId: superUser.id,
        roleId: superRole.id,
      },
    });
  }

  console.log('Seeding complete. Default Super User credentials:');
  console.log(`Username: ${superUserUsername}`);
  console.log(`Password: ${superUserPassword}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
