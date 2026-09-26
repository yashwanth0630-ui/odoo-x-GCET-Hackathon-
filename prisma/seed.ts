import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding StockSense database...");

  // 1. Seed Roles
  const managerRole = await prisma.role.upsert({
    where: { name: "INVENTORY_MANAGER" },
    update: {},
    create: {
      name: "INVENTORY_MANAGER",
      label: "Inventory Manager",
      description: "Full oversight of stock levels, inventory transfers, user management, valuation, and executive reports.",
      permissions: JSON.stringify([
        "inventory:read",
        "inventory:write",
        "inventory:adjust",
        "inventory:audit",
        "warehouses:manage",
        "users:read",
        "users:manage",
        "reports:export",
        "settings:manage"
      ]),
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: "WAREHOUSE_STAFF" },
    update: {},
    create: {
      name: "WAREHOUSE_STAFF",
      label: "Warehouse Staff",
      description: "Operational floor access: intake shipments, dispatch orders, scan barcodes, and log stock counts.",
      permissions: JSON.stringify([
        "inventory:read",
        "inventory:scan",
        "stock:intake",
        "stock:dispatch",
        "stock:count",
        "stock:damage_report"
      ]),
    },
  });

  console.log(`✅ Roles seeded: ${managerRole.name}, ${staffRole.name}`);

  // 2. Seed Demo Users
  const salt = await bcrypt.genSalt(10);
  const managerPasswordHash = await bcrypt.hash("Manager123!", salt);
  const staffPasswordHash = await bcrypt.hash("Staff123!", salt);

  const managerUser = await prisma.user.upsert({
    where: { email: "manager@stocksense.io" },
    update: {},
    create: {
      email: "manager@stocksense.io",
      name: "Elena Vance",
      passwordHash: managerPasswordHash,
      roleId: managerRole.id,
      department: "Supply Chain & Operations",
      warehouseLocation: "Central Distribution Center (HQ)",
      isActive: true,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@stocksense.io" },
    update: {},
    create: {
      email: "staff@stocksense.io",
      name: "Marcus Rodriguez",
      passwordHash: staffPasswordHash,
      roleId: staffRole.id,
      department: "Floor Logistics & Fulfillment",
      warehouseLocation: "Fulfillment Hub East - Bay 12",
      isActive: true,
    },
  });

  console.log(`✅ Demo users seeded:`);
  console.log(`   - Inventory Manager: ${managerUser.email} (Password: Manager123!)`);
  console.log(`   - Warehouse Staff:   ${staffUser.email} (Password: Staff123!)`);

  // 3. Seed Initial Audit Log
  await prisma.auditLog.create({
    data: {
      action: "SYSTEM_INITIALIZED",
      details: JSON.stringify({
        message: "Database seeded with initial roles and demo users.",
        timestamp: new Date().toISOString(),
      }),
    },
  });

  console.log("🚀 StockSense seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
