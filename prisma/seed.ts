import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function seedCategory() {
  await prisma.category.createMany({
    data: [
      { name: "Electronics", description: "Electronic devices and gadgets" },
      {
        name: "Home & Kitchen",
        description: "Home appliances and kitchen essentials",
      },
    ],
    skipDuplicates: true,
  });
}

async function seedRolesandPermissions() {
  await prisma.roles.createMany({
    data: [
      { id: Role.USER, roleName: "User" },
      { id: Role.ADMIN, roleName: "Admin" },
      { id: Role.SUPERADMIN, roleName: "SuperAdmin" },
    ],
    skipDuplicates: true,
  });

  await prisma.routes.createMany({
    data: [
      { path: "/api/seller/:path*", isWildcard: true },
      { path: "/api/user/:path*", isWildcard: true },
      { path: "/api/shiprocket/:path*", isWildcard: true },
      { path: "/api/seller", isWildcard: false },
      { path: "/api/user", isWildcard: false },
    ],
    skipDuplicates: true,
  });

  await prisma.$transaction([
    prisma.roleRoutes.createMany({
      data: [
        {
          roleId: Role.USER,
          routeId: (await prisma.routes.findUnique({
            where: { path: "/api/seller/:path*" },
          }))!.id,
        },
        {
          roleId: Role.USER,
          routeId: (await prisma.routes.findUnique({
            where: { path: "/api/user/:path*" },
          }))!.id,
        },
        {
          roleId: Role.USER,
          routeId: (await prisma.routes.findUnique({
            where: { path: "/api/shiprocket/:path*" },
          }))!.id,
        },
        {
          roleId: Role.USER,
          routeId: (await prisma.routes.findUnique({
            where: { path: "/api/seller" },
          }))!.id,
        },
        {
          roleId: Role.USER,
          routeId: (await prisma.routes.findUnique({
            where: { path: "/api/user" },
          }))!.id,
        },
      ],
      skipDuplicates: true,
    }),
  ]);
}

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  await seedRolesandPermissions();

  await seedCategory();

  console.log("🌱 Seeding Completed!");
}

seedDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
