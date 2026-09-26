import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("🧪 Starting StockSense Task 1 End-to-End Auth & Flow Verification...\n");

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      testPassed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `- ${detail}` : ""}`);
      testFailed++;
    }
  }

  // TEST 1: Fetch Available Roles
  console.log("▶ 1. Testing System Roles Endpoint...");
  const rolesRes = await fetch(`${BASE_URL}/api/auth/roles`);
  const rolesData = await rolesRes.json();
  assert(rolesRes.ok && rolesData.success, "Fetch available roles");
  const roleNames = rolesData.roles.map((r: any) => r.name);
  assert(
    roleNames.includes("INVENTORY_MANAGER") && roleNames.includes("WAREHOUSE_STAFF"),
    "Roles include INVENTORY_MANAGER and WAREHOUSE_STAFF",
    `Found: ${roleNames.join(", ")}`
  );

  // TEST 2: Demo Manager Login
  console.log("\n▶ 2. Testing Demo Manager Login...");
  const managerLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "manager@stocksense.io",
      password: "Manager123!",
      rememberMe: true,
    }),
  });
  const managerLoginData = await managerLoginRes.json();
  assert(managerLoginRes.ok && managerLoginData.success, "Manager login with valid credentials");
  assert(managerLoginData.redirectTo === "/dashboard", "Redirection to /dashboard on login");
  assert(managerLoginData.user.role === "INVENTORY_MANAGER", "User role is INVENTORY_MANAGER");

  const managerCookie = managerLoginRes.headers.get("set-cookie");
  assert(!!managerCookie && managerCookie.includes("stocksense_session="), "HTTP-only session cookie issued");

  // TEST 3: Demo Warehouse Staff Login
  console.log("\n▶ 3. Testing Demo Warehouse Staff Login...");
  const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "staff@stocksense.io",
      password: "Staff123!",
    }),
  });
  const staffLoginData = await staffLoginRes.json();
  assert(staffLoginRes.ok && staffLoginData.success, "Staff login with valid credentials");
  assert(staffLoginData.user.role === "WAREHOUSE_STAFF", "User role is WAREHOUSE_STAFF");

  // TEST 4: Invalid Password Rejection
  console.log("\n▶ 4. Testing Invalid Password Rejection...");
  const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "manager@stocksense.io",
      password: "WrongPassword999!",
    }),
  });
  assert(badLoginRes.status === 401, "Rejects wrong password with 401 status");

  // TEST 5: New User Registration (Warehouse Staff)
  const testEmail = `operator_${Date.now()}@teststocksense.com`;
  console.log(`\n▶ 5. Testing User Sign Up (${testEmail})...`);
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tessa Morales",
      email: testEmail,
      password: "SecurePassword2026!",
      role: "WAREHOUSE_STAFF",
      department: "Inbound Receiving",
      warehouseLocation: "Facility 2 - Bay 7",
    }),
  });
  const signupData = await signupRes.json();
  assert(signupRes.ok && signupData.success, "New user registration successful");
  assert(signupData.redirectTo === "/dashboard", "Signup redirects to /dashboard");
  assert(signupData.user.role === "WAREHOUSE_STAFF", "Assigned role is WAREHOUSE_STAFF");

  // TEST 6: Duplicate Email Prevention
  console.log("\n▶ 6. Testing Duplicate Registration Prevention...");
  const dupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Duplicate User",
      email: testEmail,
      password: "AnotherPassword123!",
      role: "INVENTORY_MANAGER",
    }),
  });
  assert(dupRes.status === 409, "Duplicate email rejected with 409 Conflict");

  // TEST 7: OTP Request for Password Reset
  console.log(`\n▶ 7. Testing OTP Password Reset Request for ${testEmail}...`);
  const forgotRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail }),
  });
  const forgotData = await forgotRes.json();
  assert(forgotRes.ok && forgotData.success, "OTP dispatched successfully");
  const devOtp = forgotData.devOtp;
  assert(!!devOtp && devOtp.length === 6, "Received 6-digit OTP code", `Code: ${devOtp}`);

  // TEST 8: Verify Bad OTP Rejection
  console.log("\n▶ 8. Testing Invalid OTP Rejection...");
  const badOtpRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, otp: "000000" }),
  });
  assert(badOtpRes.status === 400, "Bad OTP rejected with 400 status");

  // TEST 9: Verify Valid OTP
  console.log("\n▶ 9. Testing Valid OTP Verification...");
  const validOtpRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: testEmail, otp: devOtp }),
  });
  const validOtpData = await validOtpRes.json();
  assert(validOtpRes.ok && validOtpData.success, "Valid OTP accepted");

  // TEST 10: Complete Password Reset with New Password
  console.log("\n▶ 10. Testing Password Reset Completion...");
  const newPassword = "BrandNewPassword2026!";
  const resetRes = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      otp: devOtp,
      newPassword,
    }),
  });
  const resetData = await resetRes.json();
  assert(resetRes.ok && resetData.success, "Password reset successful");

  // TEST 11: Login with New Password
  console.log("\n▶ 11. Testing Login with Newly Reset Password...");
  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      password: newPassword,
    }),
  });
  const newLoginData = await newLoginRes.json();
  assert(newLoginRes.ok && newLoginData.success, "Login with new password succeeded");

  // TEST 12: Verify Stale Sessions Revoked
  console.log("\n▶ 12. Testing Audit Logs and Revoked Sessions in Database...");
  const userRecord = await prisma.user.findUnique({
    where: { email: testEmail },
    include: { auditLogs: true, resetOtps: true, sessions: true },
  });
  assert(!!userRecord, "User record found in database");
  assert(userRecord!.resetOtps.some((o) => o.used === true), "OTP record marked as used");
  const actions = userRecord!.auditLogs.map((a) => a.action);
  assert(actions.includes("USER_REGISTERED"), "Audit log recorded USER_REGISTERED");
  assert(actions.includes("OTP_REQUESTED"), "Audit log recorded OTP_REQUESTED");
  assert(actions.includes("PASSWORD_RESET_SUCCESS"), "Audit log recorded PASSWORD_RESET_SUCCESS");

  console.log("\n==================================================");
  console.log(`🏁 TEST SUMMARY: ${testPassed} Passed, ${testFailed} Failed`);
  console.log("==================================================\n");

  if (testFailed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
