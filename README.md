# 📦 StockSense — Modular Inventory Management System (IMS)

> **Replacing manual paper registers with centralized, real-time inventory telemetry.**

---

## 🚀 Overview & Task 1 Architecture

StockSense is an enterprise-grade modular Inventory Management System designed to eliminate paper logbooks, reconcile stock balances across facilities in real time, and enforce strict Role-Based Access Control (RBAC).

### Technology Stack
- **Framework:** Next.js (App Router, Server & Client Components, Route Handlers)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v3.4 (Custom Industrial/Glassmorphism theme)
- **Database & ORM:** Prisma ORM 6.4.1 (Configured for SQLite zero-config local dev & PostgreSQL production readiness)
- **Security & Auth:** Edge JWT (`jose`), `bcryptjs` password hashing, HTTP-Only secure cookies, SHA-256 hashed 6-digit OTP verification, Brute-force rate limiting
- **Icons & UI:** Lucide React, CSS backdrop filters, micro-animations

---

## 🛡️ Database Schema (Users & Roles)

The database schema is defined in [prisma/schema.prisma](file:///c:/Users/SafetyProtocol/Desktop/odoo%20x%20GCET/prisma/schema.prisma) with production PostgreSQL schema in [prisma/schema.postgresql.prisma](file:///c:/Users/SafetyProtocol/Desktop/odoo%20x%20GCET/prisma/schema.postgresql.prisma).

```mermaid
erDiagram
    ROLE ||--o{ USER : assigns
    USER ||--o{ SESSION : owns
    USER ||--o{ PASSWORD_RESET_OTP : requests
    USER ||--o{ AUDIT_LOG : generates

    ROLE {
        string id PK
        string name UK "INVENTORY_MANAGER | WAREHOUSE_STAFF"
        string label
        string description
        string permissions "JSON granular list"
    }

    USER {
        string id PK
        string email UK
        string passwordHash
        string name
        string roleId FK
        string department
        string warehouseLocation
        boolean isActive
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
    }

    SESSION {
        string id PK
        string token UK
        string userId FK
        datetime expiresAt
        string ipAddress
        string userAgent
        datetime createdAt
    }

    PASSWORD_RESET_OTP {
        string id PK
        string userId FK
        string otpHash "SHA-256"
        datetime expiresAt "10 mins"
        boolean used
        int attempts "max 5"
        datetime createdAt
    }

    AUDIT_LOG {
        string id PK
        string userId FK
        string action
        string details "JSON"
        string ipAddress
        datetime createdAt
    }
```

### Roles Supported:
1. **Inventory Manager (`INVENTORY_MANAGER`)**
   - Full oversight across all regional warehouses and distribution centers
   - Inventory adjustments, stock requisitions, and catalog control
   - Audit trail inspection and valuation reports
   - Team and permissions management
2. **Warehouse Staff (`WAREHOUSE_STAFF`)**
   - Operational floor execution replacing paper registers
   - Barcode scanning for intake receipts & dispatch pickups
   - Physical cycle counts and damaged item quarantine

---

## 🔐 Authentication & Security Implementation

1. **User Sign Up (`POST /api/auth/signup`)**
   - Form fields: Name, Email, Password (min 8 chars), Role (`INVENTORY_MANAGER` or `WAREHOUSE_STAFF`), Department, Assigned Warehouse Hub
   - Validates email format, checks for duplicates, hashes password with `bcryptjs` (salt rounds: 10)
   - Issues JWT session cookie and automatically redirects to `/dashboard`

2. **User Log In (`POST /api/auth/login`)**
   - Verifies credentials, checks `isActive` flag
   - Issues Edge-compatible JWT in an `HTTP-Only`, `SameSite=Lax` cookie (`stocksense_session`)
   - Persists session in database table for centralized revocation
   - Redirects to `/dashboard` upon success

3. **OTP-Based Password Reset Flow**
   - **Step 1 - Request OTP (`POST /api/auth/forgot-password`):** Generates cryptographically secure 6-digit numeric OTP, hashes with SHA-256, sets 10-minute expiry, and logs code.
   - **Step 2 - Verify OTP (`POST /api/auth/verify-otp`):** Validates code, tracks invalid attempts (invalidates after 5 bad tries to prevent brute-force attacks).
   - **Step 3 - Reset Password (`POST /api/auth/reset-password`):** Hashes new password, updates user record, marks OTP as used, and invalidates all existing user sessions in a Prisma transaction.

4. **Middleware Route Protection ([src/middleware.ts](file:///c:/Users/SafetyProtocol/Desktop/odoo%20x%20GCET/src/middleware.ts))**
   - Intercepts requests to `/dashboard/*`
   - Redirects unauthenticated users to `/auth/login?redirect=/dashboard`
   - Redirects authenticated users from `/auth/login` to `/dashboard`

---

## 🧑‍💻 Seeded Demo Credentials

| Role | Email | Password | Assigned Location |
| :--- | :--- | :--- | :--- |
| **Inventory Manager** | `manager@stocksense.io` | `Manager123!` | Central Distribution Center (HQ) |
| **Warehouse Staff** | `staff@stocksense.io` | `Staff123!` | Fulfillment Hub East - Bay 12 |

*(Fast-fill buttons are provided directly on the Login screen for instant one-click testing)*

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup & Seed
```bash
# Push Prisma schema to database (SQLite by default, or PostgreSQL via .env)
npm run db:push

# Seed default roles and demo users
npm run db:seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Automated Test Suite
```bash
npx tsx scripts/test-auth.ts
```

### 5. PostgreSQL Production Setup (Optional)
To use Docker PostgreSQL:
```bash
docker compose up -d
```
Update `DATABASE_URL` in `.env`:
```env
DATABASE_URL="postgresql://stocksense_admin:stocksense_secure_pass_2026@localhost:5432/stocksense_ims?schema=public"
```
And run:
```bash
npx prisma db push --schema=prisma/schema.postgresql.prisma
```
