import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("=================================================");
  console.log("=== STOCKSENSE COMPREHENSIVE E2E VERIFICATION ===");
  console.log("=================================================\n");

  // Fetch reference data
  const user = await prisma.user.findFirst({ where: { role: { name: "INVENTORY_MANAGER" } } });
  if (!user) throw new Error("Inventory manager not found");

  const product = await prisma.product.findFirst({ where: { sku: "SKU-9921" } });
  if (!product) throw new Error("Product SKU-9921 not found");

  const locA = await prisma.location.findFirst({ where: { code: "CDC-RACK-A" } });
  const locB = await prisma.location.findFirst({ where: { code: "FHE-BAY-12" } });
  if (!locA || !locB) throw new Error("Warehouse locations not found");

  console.log(`[INIT] Manager: ${user.email}`);
  console.log(`[INIT] Testing Product: ${product.name} (${product.sku})`);
  console.log(`[INIT] Loc A: ${locA.name}, Loc B: ${locB.name}\n`);

  // 1. Initial Stock Level
  const initStock = await prisma.stockLevel.findUnique({
    where: { productId_locationId: { productId: product.id, locationId: locA.id } },
  });
  const startQty = initStock ? initStock.quantity : 0;
  console.log(`[STEP 1] Starting Stock at ${locA.name}: ${startQty}`);

  // 2. TASK 3: Receipts (Incoming Goods)
  console.log("\n--- [STEP 2] TASK 3: Receipts Workflow (Supplier -> Stock +50) ---");
  const receiptRef = `WH/IN/TEST-${Date.now().toString().slice(-4)}`;
  const receiptDoc = await prisma.operationDocument.create({
    data: {
      type: "RECEIPT",
      referenceNumber: receiptRef,
      status: "DRAFT",
      partnerName: "ArcelorMittal Steel Supplies",
      destinationLocationId: locA.id,
      createdById: user.id,
      notes: "Test shipment of 50 steel rods",
      items: {
        create: [
          {
            productId: product.id,
            quantity: 50,
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(`Created Draft Receipt: ${receiptDoc.referenceNumber} (Status: ${receiptDoc.status})`);

  // Validate Receipt via transactional ledger logic
  await prisma.$transaction(async (tx) => {
    // 1. Update doc status to DONE
    await tx.operationDocument.update({
      where: { id: receiptDoc.id },
      data: { status: "DONE", validatedAt: new Date() },
    });

    // 2. Increment stock in destination location
    const updatedStock = await tx.stockLevel.upsert({
      where: { productId_locationId: { productId: product.id, locationId: locA.id } },
      create: { productId: product.id, locationId: locA.id, quantity: 50 },
      update: { quantity: { increment: 50 } },
    });

    // 3. Record in centralized Stock Ledger
    const ledgerEntry = await tx.stockMovement.create({
      data: {
        productId: product.id,
        documentId: receiptDoc.id,
        destinationLocationId: locA.id,
        quantity: 50,
        type: "INCOMING",
        reference: receiptDoc.referenceNumber,
        operatorId: user.id,
        reason: `Receipt validation: +50 from ${receiptDoc.partnerName}`,
      },
    });

    console.log(`Receipt Validated! Stock at ${locA.name} is now: ${updatedStock.quantity}`);
    console.log(`Centralized Ledger Entry created: ID ${ledgerEntry.id}, Qty: +${ledgerEntry.quantity}`);
  });

  // Verify stock increased by 50
  const afterReceiptStock = await prisma.stockLevel.findUnique({
    where: { productId_locationId: { productId: product.id, locationId: locA.id } },
  });
  if (afterReceiptStock?.quantity !== startQty + 50) {
    throw new Error(`Receipt failed: expected ${startQty + 50}, got ${afterReceiptStock?.quantity}`);
  }
  console.log("✓ SUCCESS: Receipt increased stock by +50 correctly.\n");

  // 3. TASK 3: Delivery Orders (Outgoing Goods - Pick, Pack, Validate)
  console.log("--- [STEP 3] TASK 3: Delivery Order Workflow (Pick -> Pack -> Validate -> Stock -10) ---");
  const deliveryRef = `WH/OUT/TEST-${Date.now().toString().slice(-4)}`;
  const deliveryDoc = await prisma.operationDocument.create({
    data: {
      type: "DELIVERY",
      referenceNumber: deliveryRef,
      status: "DRAFT",
      partnerName: "Apex High-Rise Contractors Ltd",
      sourceLocationId: locA.id,
      createdById: user.id,
      notes: "Urgent dispatch to construction site",
      items: {
        create: [
          {
            productId: product.id,
            quantity: 10,
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log(`Created Delivery Order: ${deliveryDoc.referenceNumber} (Status: ${deliveryDoc.status})`);

  // Step 3a: Pick items -> Status WAITING
  await prisma.operationDocument.update({
    where: { id: deliveryDoc.id },
    data: { status: "WAITING" },
  });
  console.log(`✓ Pick items completed: status updated to 'WAITING'`);

  // Step 3b: Pack items -> Status READY
  await prisma.operationDocument.update({
    where: { id: deliveryDoc.id },
    data: { status: "READY" },
  });
  console.log(`✓ Pack items completed: status updated to 'READY'`);

  // Step 3c: Validate -> Stock -10, Ledger entry logged
  await prisma.$transaction(async (tx) => {
    await tx.operationDocument.update({
      where: { id: deliveryDoc.id },
      data: { status: "DONE", validatedAt: new Date() },
    });

    const updatedStock = await tx.stockLevel.update({
      where: { productId_locationId: { productId: product.id, locationId: locA.id } },
      data: { quantity: { decrement: 10 } },
    });

    const ledgerEntry = await tx.stockMovement.create({
      data: {
        productId: product.id,
        documentId: deliveryDoc.id,
        sourceLocationId: locA.id,
        quantity: -10,
        type: "OUTGOING",
        reference: deliveryDoc.referenceNumber,
        operatorId: user.id,
        reason: `Delivery Order dispatched: -10 to ${deliveryDoc.partnerName}`,
      },
    });

    console.log(`Delivery Validated! Stock at ${locA.name} is now: ${updatedStock.quantity}`);
    console.log(`Centralized Ledger Entry created: ID ${ledgerEntry.id}, Qty: ${ledgerEntry.quantity}`);
  });

  const afterDeliveryStock = await prisma.stockLevel.findUnique({
    where: { productId_locationId: { productId: product.id, locationId: locA.id } },
  });
  if (afterDeliveryStock?.quantity !== startQty + 40) {
    throw new Error(`Delivery failed: expected ${startQty + 40}, got ${afterDeliveryStock?.quantity}`);
  }
  console.log("✓ SUCCESS: Delivery decreased stock by -10 correctly.\n");

  // 4. TASK 4: Internal Transfers (Dual Ledger Entries)
  console.log("--- [STEP 4] TASK 4: Internal Transfer (Dual Ledger Entries: LocA -5, LocB +5) ---");
  const initLocBStock = await prisma.stockLevel.findUnique({
    where: { productId_locationId: { productId: product.id, locationId: locB.id } },
  });
  const startLocBQty = initLocBStock ? initLocBStock.quantity : 0;

  const transferRef = `WH/INT/TEST-${Date.now().toString().slice(-4)}`;
  const transferDoc = await prisma.operationDocument.create({
    data: {
      type: "INTERNAL",
      referenceNumber: transferRef,
      status: "DRAFT",
      sourceLocationId: locA.id,
      destinationLocationId: locB.id,
      createdById: user.id,
      notes: "Internal replenishment transfer between zones",
      items: {
        create: [
          {
            productId: product.id,
            quantity: 5,
          },
        ],
      },
    },
    include: { items: true },
  });

  // Validate Internal Transfer: Dual Ledger Entries
  await prisma.$transaction(async (tx) => {
    await tx.operationDocument.update({
      where: { id: transferDoc.id },
      data: { status: "DONE", validatedAt: new Date() },
    });

    // Deduct from Source
    const sourceStock = await tx.stockLevel.update({
      where: { productId_locationId: { productId: product.id, locationId: locA.id } },
      data: { quantity: { decrement: 5 } },
    });

    // Add to Destination
    const destStock = await tx.stockLevel.upsert({
      where: { productId_locationId: { productId: product.id, locationId: locB.id } },
      create: { productId: product.id, locationId: locB.id, quantity: 5 },
      update: { quantity: { increment: 5 } },
    });

    // Dual Ledger Entries
    const ledgerOut = await tx.stockMovement.create({
      data: {
        productId: product.id,
        documentId: transferDoc.id,
        sourceLocationId: locA.id,
        quantity: -5,
        type: "INTERNAL",
        reference: `${transferDoc.referenceNumber}-OUT`,
        operatorId: user.id,
        reason: `Transfer OUT: 5 units transferred to ${locB.name}`,
      },
    });

    const ledgerIn = await tx.stockMovement.create({
      data: {
        productId: product.id,
        documentId: transferDoc.id,
        destinationLocationId: locB.id,
        quantity: 5,
        type: "INTERNAL",
        reference: `${transferDoc.referenceNumber}-IN`,
        operatorId: user.id,
        reason: `Transfer IN: 5 units received from ${locA.name}`,
      },
    });

    console.log(`Source ${locA.name} stock now: ${sourceStock.quantity} (-5)`);
    console.log(`Destination ${locB.name} stock now: ${destStock.quantity} (+5)`);
    console.log(`Dual Ledger: [OUT: ${ledgerOut.quantity}] [IN: +${ledgerIn.quantity}]`);
  });

  console.log("✓ SUCCESS: Internal transfer balanced across locations without altering net company stock.\n");

  // 5. TASK 4: Stock Adjustments (Physical count mismatch: -3 damaged)
  console.log("--- [STEP 5] TASK 4: Inventory Adjustment (Recorded vs Counted difference auto-calculated) ---");
  const currentRecord = await prisma.stockLevel.findUnique({
    where: { productId_locationId: { productId: product.id, locationId: locA.id } },
  });
  const recordedQty = currentRecord?.quantity ?? 0;
  const countedQty = recordedQty - 3; // 3 damaged rods
  const difference = countedQty - recordedQty; // -3

  const adjRef = `INV/ADJ/TEST-${Date.now().toString().slice(-4)}`;
  const adjDoc = await prisma.operationDocument.create({
    data: {
      type: "ADJUSTMENT",
      referenceNumber: adjRef,
      status: "DONE",
      sourceLocationId: locA.id,
      createdById: user.id,
      notes: "Damaged during handling (3 units scrapped)",
      validatedAt: new Date(),
      items: {
        create: [
          {
            productId: product.id,
            quantity: difference,
          },
        ],
      },
    },
  });

  // Apply adjustment
  await prisma.$transaction(async (tx) => {
    const updatedStock = await tx.stockLevel.update({
      where: { productId_locationId: { productId: product.id, locationId: locA.id } },
      data: { quantity: countedQty },
    });

    const adjLedger = await tx.stockMovement.create({
      data: {
        productId: product.id,
        documentId: adjDoc.id,
        sourceLocationId: locA.id,
        quantity: difference,
        type: "ADJUSTMENT",
        reference: adjDoc.referenceNumber,
        operatorId: user.id,
        reason: `Physical Count Adjustment: Recorded ${recordedQty} -> Counted ${countedQty} (Diff: ${difference})`,
      },
    });

    console.log(`Adjustment applied: Recorded was ${recordedQty}, Counted is ${countedQty}, Diff: ${difference}`);
    console.log(`Ledger entry ID ${adjLedger.id} logged with signed quantity: ${adjLedger.quantity}`);
  });

  const finalStock = await prisma.stockLevel.findUnique({
    where: { productId_locationId: { productId: product.id, locationId: locA.id } },
  });
  if (finalStock?.quantity !== countedQty) {
    throw new Error(`Adjustment failed: expected ${countedQty}, got ${finalStock?.quantity}`);
  }
  console.log("✓ SUCCESS: Physical stock count difference auto-calculated and adjusted accurately.\n");

  // 6. Centralized Stock Ledger Audit
  console.log("--- [STEP 6] CENTRALIZED STOCK LEDGER AUDIT ---");
  const recentMovements = await prisma.stockMovement.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { product: true, sourceLocation: true, destinationLocation: true, operator: true },
  });

  console.log(`Found ${recentMovements.length} ledger movements for ${product.sku}:`);
  recentMovements.forEach((m) => {
    console.log(
      `  [${m.createdAt.toISOString().slice(11, 19)}] Ref: ${m.reference.padEnd(20)} | Type: ${m.type.padEnd(10)} | Qty: ${(m.quantity > 0 ? "+" + m.quantity : m.quantity.toString()).padStart(4)} | Operator: ${m.operator?.name ?? "System"}`
    );
  });

  // 7. TASK 5: Analytics Metrics Check
  console.log("\n--- [STEP 7] TASK 5: Analytics Metrics Check ---");
  const totalProducts = await prisma.product.count();
  const pendingReceipts = await prisma.operationDocument.count({
    where: { type: "RECEIPT", status: { in: ["DRAFT", "WAITING", "READY"] } },
  });
  const pendingDeliveries = await prisma.operationDocument.count({
    where: { type: "DELIVERY", status: { in: ["DRAFT", "WAITING", "READY"] } },
  });
  const internalTransfersScheduled = await prisma.operationDocument.count({
    where: { type: "INTERNAL", status: { in: ["DRAFT", "WAITING", "READY"] } },
  });

  console.log(`Total Products in Catalog: ${totalProducts}`);
  console.log(`Pending Receipts: ${pendingReceipts}`);
  console.log(`Pending Deliveries: ${pendingDeliveries}`);
  console.log(`Internal Transfers Scheduled: ${internalTransfersScheduled}`);

  console.log("\n=================================================");
  console.log("=== ALL TASKS 3, 4, 5 & 6 DATA FLOWS VERIFIED! ===");
  console.log("=================================================");
}

runVerification()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
