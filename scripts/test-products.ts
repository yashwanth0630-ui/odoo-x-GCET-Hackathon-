const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("🧪 Starting StockSense Task 2: Product & Location Management Tests...\n");

  let passed = 0;
  let failed = 0;

  function assert(cond: boolean, name: string, detail?: string) {
    if (cond) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // 0. Authenticate as Inventory Manager for CRUD operations
  console.log("▶ 0. Authenticating as Inventory Manager...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "manager@stocksense.io",
      password: "Manager123!",
    }),
  });
  const setCookie = loginRes.headers.get("set-cookie") || "";
  const authCookie = setCookie.split(";")[0];
  assert(loginRes.ok && !!authCookie, "Manager authenticated with session cookie");

  const authHeaders = {
    "Content-Type": "application/json",
    Cookie: authCookie,
  };

  // 1. Categories Endpoint
  console.log("\n▶ 1. Testing Categories Endpoint...");
  const catRes = await fetch(`${BASE_URL}/api/categories`);
  const catData = await catRes.json();
  assert(catRes.ok && catData.success, "Fetch categories");
  assert(catData.categories.length >= 5, "Categories populated with seeded data", `Count: ${catData.categories.length}`);
  const sampleCategory = catData.categories[0];

  // 2. Locations Endpoint
  console.log("\n▶ 2. Testing Locations Endpoint (Warehouses & Sub-Locations)...");
  const locRes = await fetch(`${BASE_URL}/api/locations`);
  const locData = await locRes.json();
  assert(locRes.ok && locData.success, "Fetch warehouses and sub-locations");
  assert(locData.warehouses.length >= 2, "Warehouses found (CDC & FHE)", `Count: ${locData.warehouses.length}`);
  const cdcWarehouse = locData.warehouses.find((w: any) => w.code === "CDC-01");
  assert(!!cdcWarehouse && cdcWarehouse.locations.length >= 3, "CDC-01 has sub-locations (Rack A, Rack B, Dock 01)");
  const sampleLocation = cdcWarehouse.locations[0];

  // 3. Products List Endpoint
  console.log("\n▶ 3. Testing Products List Endpoint...");
  const prodRes = await fetch(`${BASE_URL}/api/products`);
  const prodData = await prodRes.json();
  assert(prodRes.ok && prodData.success, "Fetch all products");
  assert(prodData.products.length >= 6, "Products found in catalog", `Count: ${prodData.products.length}`);

  // Verify stock availability per location breakdown
  const servoMotor = prodData.products.find((p: any) => p.sku === "SKU-9921");
  assert(!!servoMotor, "Find seeded product SKU-9921");
  assert(servoMotor.stockLevels.length >= 2, "SKU-9921 has multi-location stock levels", `Locations: ${servoMotor.stockLevels.length}`);
  const expectedSum = servoMotor.stockLevels.reduce((a: number, s: any) => a + s.quantity, 0);
  assert(servoMotor.totalStock === expectedSum, "Total stock is correctly aggregated across locations", `Total: ${servoMotor.totalStock}`);

  // 4. Smart Search Filter by SKU
  console.log("\n▶ 4. Testing Smart Search Filter by SKU...");
  const searchSkuRes = await fetch(`${BASE_URL}/api/products?search=SKU-9921`);
  const searchSkuData = await searchSkuRes.json();
  assert(searchSkuRes.ok && searchSkuData.products.length === 1, "Smart search by exact SKU returned 1 match");
  assert(searchSkuData.products[0].sku === "SKU-9921", "Match is SKU-9921");

  // 5. Smart Search Filter by Category
  console.log("\n▶ 5. Testing Filter by Category...");
  const catFilterRes = await fetch(`${BASE_URL}/api/products?categoryId=${sampleCategory.id}`);
  const catFilterData = await catFilterRes.json();
  assert(catFilterRes.ok && catFilterData.products.length > 0, "Filter by Category returns matched products");

  // 6. Reordering Rules & Low Stock Filter
  console.log("\n▶ 6. Testing Low Stock Filter (Reordering Rules)...");
  const lowStockRes = await fetch(`${BASE_URL}/api/products?lowStock=true`);
  const lowStockData = await lowStockRes.json();
  assert(lowStockRes.ok, "Low stock filter identifies items below minimum threshold");
  assert(lowStockData.products.every((p: any) => p.isLowStock), "All returned items satisfy isLowStock === true");

  // 7. Full CRUD: CREATE New Product
  const newTestSku = `SKU-TEST-${Date.now().toString().slice(-4)}`;
  console.log(`\n▶ 7. Testing Product Creation (POST /api/products) - ${newTestSku}...`);
  const createRes = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: "Pneumatic Gripper Angular 20mm",
      sku: newTestSku,
      barcode: "8909988776655",
      categoryId: sampleCategory.id,
      uom: "Units",
      minThreshold: 12,
      idealStock: 50,
      costPrice: 95.0,
      sellingPrice: 165.0,
      initialStock: 30,
      initialLocationId: sampleLocation.id,
      description: "Dual-acting pneumatic angular gripper with magnetic sensor slots.",
    }),
  });
  const createData = await createRes.json();
  assert(createRes.ok && createData.success, "Product created successfully");
  const createdProductId = createData.product.id;

  // 8. Duplicate SKU Prevention
  console.log("\n▶ 8. Testing Duplicate SKU Prevention...");
  const dupRes = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: "Duplicate Product",
      sku: newTestSku,
      categoryId: sampleCategory.id,
      uom: "Units",
      minThreshold: 10,
    }),
  });
  assert(dupRes.status === 409, "Duplicate SKU rejected with 409 Conflict");

  // 9. Full CRUD: READ Detailed Product (Stock availability per location)
  console.log("\n▶ 9. Testing Product Detail View (GET /api/products/[id])...");
  const detailRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`);
  const detailData = await detailRes.json();
  assert(detailRes.ok && detailData.success, "Fetch product detail view");
  assert(detailData.product.sku === newTestSku, "Correct product retrieved");
  assert(detailData.product.stockLevels.length === 1, "Initial stock allocated to location");
  assert(detailData.product.stockLevels[0].quantity === 30, "Initial stock is 30 units at specified location");
  assert(detailData.product.totalStock === 30, "Total stock is 30 units");

  // 10. Stock Availability Adjustment per Location
  console.log("\n▶ 10. Testing Location-Level Stock Adjustment...");
  const stockAdjustRes = await fetch(`${BASE_URL}/api/products/${createdProductId}/stock`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      locationId: sampleLocation.id,
      quantity: 15,
      operation: "ADD",
    }),
  });
  const stockAdjustData = await stockAdjustRes.json();
  assert(stockAdjustRes.ok && stockAdjustData.success, "Location stock adjusted (+15 units)");
  assert(stockAdjustData.stockLevel.quantity === 45, "Updated stock level is 45 units", `Found: ${stockAdjustData.stockLevel.quantity}`);

  // 11. Full CRUD: UPDATE Product Metadata & Reordering Rules
  console.log("\n▶ 11. Testing Product Update (PUT /api/products/[id])...");
  const updateRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      name: "Pneumatic Gripper Angular 20mm (Revised V2)",
      minThreshold: 18,
      idealStock: 75,
    }),
  });
  const updateData = await updateRes.json();
  assert(updateRes.ok && updateData.success, "Product updated successfully");
  assert(updateData.product.name.includes("Revised V2"), "Product name updated");
  assert(updateData.product.minThreshold === 18, "Reordering min threshold updated to 18");

  // 12. Full CRUD: DELETE Product
  console.log("\n▶ 12. Testing Product Deletion (DELETE /api/products/[id])...");
  const deleteRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  const deleteData = await deleteRes.json();
  assert(deleteRes.ok && deleteData.success, "Product deleted successfully");

  // Verify it no longer exists
  const checkRes = await fetch(`${BASE_URL}/api/products/${createdProductId}`);
  assert(checkRes.status === 404, "Deleted product returns 404 Not Found");

  console.log("\n==================================================");
  console.log(`🏁 TASK 2 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================\n");

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
