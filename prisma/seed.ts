import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding StockSense database (Users, Roles, Warehouses, Locations, Categories, Products, Operations & Stock Ledger)...");

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
        "products:manage",
        "operations:manage",
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

  // 3. Seed Warehouses
  const cdcWarehouse = await prisma.warehouse.upsert({
    where: { code: "CDC-01" },
    update: {},
    create: {
      name: "Central Distribution Center (HQ)",
      code: "CDC-01",
      address: "740 Industrial Parkway, Chicago, IL 60607",
    },
  });

  const fheWarehouse = await prisma.warehouse.upsert({
    where: { code: "FHE-02" },
    update: {},
    create: {
      name: "Fulfillment Hub East",
      code: "FHE-02",
      address: "102 Logistics Boulevard, Newark, NJ 07114",
    },
  });

  console.log(`✅ Warehouses seeded: ${cdcWarehouse.name}, ${fheWarehouse.name}`);

  // 4. Seed Sub-Locations
  const locRackA = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: cdcWarehouse.id, code: "CDC-RACK-A" } },
    update: {},
    create: {
      name: "Rack A - High Velocity",
      code: "CDC-RACK-A",
      type: "STORAGE",
      warehouseId: cdcWarehouse.id,
    },
  });

  const locRackB = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: cdcWarehouse.id, code: "CDC-RACK-B" } },
    update: {},
    create: {
      name: "Rack B - Heavy Components",
      code: "CDC-RACK-B",
      type: "STORAGE",
      warehouseId: cdcWarehouse.id,
    },
  });

  const locDock01 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: cdcWarehouse.id, code: "CDC-DOCK-01" } },
    update: {},
    create: {
      name: "Dock 01 - Receiving Inbound",
      code: "CDC-DOCK-01",
      type: "RECEIVING",
      warehouseId: cdcWarehouse.id,
    },
  });

  const locBay12 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: fheWarehouse.id, code: "FHE-BAY-12" } },
    update: {},
    create: {
      name: "Bay 12 - Bulk Staging",
      code: "FHE-BAY-12",
      type: "STORAGE",
      warehouseId: fheWarehouse.id,
    },
  });

  const locShelf04 = await prisma.location.upsert({
    where: { warehouseId_code: { warehouseId: fheWarehouse.id, code: "FHE-SH-04" } },
    update: {},
    create: {
      name: "Shelf 04 - Micro-Electronics",
      code: "FHE-SH-04",
      type: "STORAGE",
      warehouseId: fheWarehouse.id,
    },
  });

  console.log(`✅ Sub-locations seeded across warehouses.`);

  // 5. Seed Categories
  const catDrive = await prisma.category.upsert({
    where: { code: "DRV-AUTO" },
    update: {},
    create: {
      name: "Drive & Automation",
      code: "DRV-AUTO",
      description: "Servo drives, stepping motors, inverters, and motion controllers",
    },
  });

  const catBearings = await prisma.category.upsert({
    where: { code: "MCH-BRG" },
    update: {},
    create: {
      name: "Mechanical Bearings",
      code: "MCH-BRG",
      description: "Ceramic bearings, linear rails, ball bushings, and high-temp components",
    },
  });

  const catNetwork = await prisma.category.upsert({
    where: { code: "NET-TEL" },
    update: {},
    create: {
      name: "Network & Telemetry",
      code: "NET-TEL",
      description: "Industrial Ethernet switches, wireless gateways, and telemetry modules",
    },
  });

  const catPneumatics = await prisma.category.upsert({
    where: { code: "PNU-PWR" },
    update: {},
    create: {
      name: "Pneumatics & Fluid Power",
      code: "PNU-PWR",
      description: "Solenoid valves, pneumatic pistons, regulators, and tubing",
    },
  });

  const catSensors = await prisma.category.upsert({
    where: { code: "SNS-RLY" },
    update: {},
    create: {
      name: "Sensors & Relays",
      code: "SNS-RLY",
      description: "Solid state relays, optical encoders, proximity sensors",
    },
  });

  // 6. Seed Products
  const productsData = [
    {
      name: "Industrial Servo Motor 48V",
      sku: "SKU-9921",
      barcode: "8901234567891",
      description: "Brushless DC high-torque servo motor for automated guided vehicles and Cartesian robots.",
      categoryId: catDrive.id,
      uom: "Units",
      initialStock: 155,
      minThreshold: 25,
      idealStock: 100,
      costPrice: 280.0,
      sellingPrice: 420.0,
      stocks: [
        { locationId: locRackA.id, quantity: 120 },
        { locationId: locBay12.id, quantity: 35 },
      ],
    },
    {
      name: "High-Temp Ceramic Bearings 608-CE",
      sku: "SKU-4402",
      barcode: "8901234567892",
      description: "Silicon nitride (Si3N4) non-conductive bearings resistant to thermal expansion up to 800°C.",
      categoryId: catBearings.id,
      uom: "Units",
      initialStock: 220,
      minThreshold: 50,
      idealStock: 250,
      costPrice: 45.0,
      sellingPrice: 85.0,
      stocks: [
        { locationId: locRackB.id, quantity: 180 },
        { locationId: locBay12.id, quantity: 40 },
      ],
    },
    {
      name: "Managed Ethernet Switch 24P DIN-Rail",
      sku: "SKU-1088",
      barcode: "8901234567893",
      description: "Hardened gigabit switch with redundant 24V power input and Modbus/PROFINET integration.",
      categoryId: catNetwork.id,
      uom: "Units",
      initialStock: 57,
      minThreshold: 15,
      idealStock: 60,
      costPrice: 350.0,
      sellingPrice: 580.0,
      stocks: [
        { locationId: locShelf04.id, quantity: 45 },
        { locationId: locRackA.id, quantity: 12 },
      ],
    },
    {
      name: "Pneumatic Solenoid Valve 5/2-Way",
      sku: "SKU-7731",
      barcode: "8901234567894",
      description: "Direct-acting spool valve with LED indicator and manual override switch.",
      categoryId: catPneumatics.id,
      uom: "Units",
      initialStock: 18,
      minThreshold: 30, // LOW STOCK ALERT
      idealStock: 80,
      costPrice: 65.0,
      sellingPrice: 110.0,
      stocks: [
        { locationId: locRackA.id, quantity: 14 },
        { locationId: locBay12.id, quantity: 4 },
      ],
    },
    {
      name: "Solid State Relay 25A 240VAC",
      sku: "SKU-5501",
      barcode: "8901234567895",
      description: "Opto-isolated zero-cross solid state relay with integrated heatsink mounting plate.",
      categoryId: catSensors.id,
      uom: "Units",
      initialStock: 100,
      minThreshold: 40,
      idealStock: 120,
      costPrice: 22.0,
      sellingPrice: 42.0,
      stocks: [
        { locationId: locShelf04.id, quantity: 75 },
        { locationId: locRackA.id, quantity: 25 },
      ],
    },
    {
      name: "Heavy-Duty Linear Actuator 200mm",
      sku: "SKU-3120",
      barcode: "8901234567896",
      description: "12V 1500N linear positioning drive with built-in limit switches and IP65 rating.",
      categoryId: catDrive.id,
      uom: "Units",
      initialStock: 5,
      minThreshold: 12, // CRITICAL LOW STOCK
      idealStock: 35,
      costPrice: 140.0,
      sellingPrice: 240.0,
      stocks: [
        { locationId: locRackB.id, quantity: 5 },
      ],
    },
  ];

  const seededProducts: Record<string, any> = {};

  for (const item of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        categoryId: item.categoryId,
        uom: item.uom,
        minThreshold: item.minThreshold,
        idealStock: item.idealStock,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
      },
      create: {
        name: item.name,
        sku: item.sku,
        barcode: item.barcode,
        description: item.description,
        categoryId: item.categoryId,
        uom: item.uom,
        initialStock: item.initialStock,
        minThreshold: item.minThreshold,
        idealStock: item.idealStock,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
      },
    });

    seededProducts[item.sku] = product;

    for (const stock of item.stocks) {
      await prisma.stockLevel.upsert({
        where: {
          productId_locationId: {
            productId: product.id,
            locationId: stock.locationId,
          },
        },
        update: {
          quantity: stock.quantity,
        },
        create: {
          productId: product.id,
          locationId: stock.locationId,
          quantity: stock.quantity,
        },
      });
    }
  }

  console.log(`✅ Products seeded.`);

  // 7. Seed Operation Documents (Receipts, Deliveries, Internal Transfers, Adjustments)
  // A. Receipt (Incoming Goods) - Validated
  const receiptDoc = await prisma.operationDocument.upsert({
    where: { referenceNumber: "WH/IN/0001" },
    update: {},
    create: {
      referenceNumber: "WH/IN/0001",
      type: "RECEIPT",
      status: "DONE",
      partnerName: "Kuka Robotics Supply Co.",
      destinationLocationId: locRackA.id,
      createdById: staffUser.id,
      notes: "PO-9912 inbound supplier delivery",
      validatedAt: new Date(Date.now() - 3 * 3600 * 1000),
      items: {
        create: [
          {
            productId: seededProducts["SKU-9921"].id,
            quantity: 50,
            picked: true,
            packed: true,
          },
        ],
      },
    },
  });

  // Corresponding Stock Ledger Entry for Receipt
  await prisma.stockMovement.upsert({
    where: { id: "sm-init-rec-1" },
    update: {},
    create: {
      id: "sm-init-rec-1",
      reference: "WH/IN/0001",
      documentId: receiptDoc.id,
      productId: seededProducts["SKU-9921"].id,
      destinationLocationId: locRackA.id,
      quantity: 50,
      type: "INCOMING",
      reason: "Supplier receipt PO-9912 verified and placed into Rack A",
      operatorId: staffUser.id,
    },
  });

  // B. Delivery Order (Outgoing Goods) - Validated
  const deliveryDoc = await prisma.operationDocument.upsert({
    where: { referenceNumber: "WH/OUT/0001" },
    update: {},
    create: {
      referenceNumber: "WH/OUT/0001",
      type: "DELIVERY",
      status: "DONE",
      partnerName: "Apex Manufacturing Labs",
      sourceLocationId: locRackB.id,
      createdById: managerUser.id,
      notes: "Sales Order SO-4402 - Priority freight dispatch",
      validatedAt: new Date(Date.now() - 2 * 3600 * 1000),
      items: {
        create: [
          {
            productId: seededProducts["SKU-4402"].id,
            quantity: 20,
            picked: true,
            packed: true,
          },
        ],
      },
    },
  });

  // Corresponding Stock Ledger Entry for Delivery
  await prisma.stockMovement.upsert({
    where: { id: "sm-init-del-1" },
    update: {},
    create: {
      id: "sm-init-del-1",
      reference: "WH/OUT/0001",
      documentId: deliveryDoc.id,
      productId: seededProducts["SKU-4402"].id,
      sourceLocationId: locRackB.id,
      quantity: -20,
      type: "OUTGOING",
      reason: "Dispatched to Apex Manufacturing Labs via FedEx Freight",
      operatorId: managerUser.id,
    },
  });

  // C. Internal Transfer - Validated (Dual ledger entries!)
  const transferDoc = await prisma.operationDocument.upsert({
    where: { referenceNumber: "WH/INT/0001" },
    update: {},
    create: {
      referenceNumber: "WH/INT/0001",
      type: "INTERNAL_TRANSFER",
      status: "DONE",
      sourceLocationId: locRackA.id,
      destinationLocationId: locBay12.id,
      createdById: staffUser.id,
      notes: "Rebalance stock: High Velocity Rack A to Bulk Staging Bay 12",
      validatedAt: new Date(Date.now() - 1 * 3600 * 1000),
      items: {
        create: [
          {
            productId: seededProducts["SKU-9921"].id,
            quantity: 10,
            picked: true,
            packed: true,
          },
        ],
      },
    },
  });

  // Dual Ledger Entries for Internal Transfer
  await prisma.stockMovement.upsert({
    where: { id: "sm-init-int-out" },
    update: {},
    create: {
      id: "sm-init-int-out",
      reference: "WH/INT/0001-OUT",
      documentId: transferDoc.id,
      productId: seededProducts["SKU-9921"].id,
      sourceLocationId: locRackA.id,
      destinationLocationId: locBay12.id,
      quantity: -10,
      type: "INTERNAL",
      reason: "Internal relocation outbound from Rack A",
      operatorId: staffUser.id,
    },
  });

  await prisma.stockMovement.upsert({
    where: { id: "sm-init-int-in" },
    update: {},
    create: {
      id: "sm-init-int-in",
      reference: "WH/INT/0001-IN",
      documentId: transferDoc.id,
      productId: seededProducts["SKU-9921"].id,
      sourceLocationId: locRackA.id,
      destinationLocationId: locBay12.id,
      quantity: +10,
      type: "INTERNAL",
      reason: "Internal relocation inbound to Bay 12",
      operatorId: staffUser.id,
    },
  });

  // D. Pending Operations for Dashboard Widgets
  await prisma.operationDocument.upsert({
    where: { referenceNumber: "WH/IN/0002" },
    update: {},
    create: {
      referenceNumber: "WH/IN/0002",
      type: "RECEIPT",
      status: "WAITING",
      partnerName: "Global Sensors Consortium",
      destinationLocationId: locShelf04.id,
      createdById: staffUser.id,
      notes: "Incoming pallet arriving at 15:00",
      items: {
        create: [
          {
            productId: seededProducts["SKU-5501"].id,
            quantity: 40,
            picked: false,
            packed: false,
          },
        ],
      },
    },
  });

  await prisma.operationDocument.upsert({
    where: { referenceNumber: "WH/OUT/0002" },
    update: {},
    create: {
      referenceNumber: "WH/OUT/0002",
      type: "DELIVERY",
      status: "READY",
      partnerName: "Cyberdyne Systems",
      sourceLocationId: locShelf04.id,
      createdById: managerUser.id,
      notes: "Awaiting final shipping label scan",
      items: {
        create: [
          {
            productId: seededProducts["SKU-1088"].id,
            quantity: 5,
            picked: true,
            packed: true,
          },
        ],
      },
    },
  });

  await prisma.operationDocument.upsert({
    where: { referenceNumber: "WH/INT/0002" },
    update: {},
    create: {
      referenceNumber: "WH/INT/0002",
      type: "INTERNAL_TRANSFER",
      status: "READY",
      sourceLocationId: locRackB.id,
      destinationLocationId: locBay12.id,
      createdById: staffUser.id,
      notes: "Scheduled transfer of heavy actuators",
      items: {
        create: [
          {
            productId: seededProducts["SKU-3120"].id,
            quantity: 2,
            picked: true,
            packed: false,
          },
        ],
      },
    },
  });

  // E. Stock Adjustment Entry
  await prisma.stockMovement.upsert({
    where: { id: "sm-init-adj-1" },
    update: {},
    create: {
      id: "sm-init-adj-1",
      reference: "INV/ADJ/0001",
      productId: seededProducts["SKU-7731"].id,
      sourceLocationId: locRackA.id,
      quantity: -3,
      type: "ADJUSTMENT",
      reason: "Cycle count discrepancy: 3 units damaged due to moisture exposure",
      operatorId: managerUser.id,
    },
  });

  console.log(`✅ Operation documents and Centralized Stock Ledger seeded successfully.`);
  console.log("🚀 StockSense Complete Seed Finished!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
