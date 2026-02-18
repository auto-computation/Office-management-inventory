# SaaS ERP Transformation Plan

## Executive Summary

This document outlines the strategic roadmap to convert the existing "Office App V3.0" (Single-Tenant) into a **Centralized SaaS (Software-as-a-Service) ERP System**.

**Current State**: Single organization, hardcoded roles, direct database access.
**Target State**: Multi-tenant architecture (supporting infinite organizations), dynamic permissions, subscription billing (SaaS), and centralized management.

---

## 1. Database Architecture: Multi-Tenancy (Detailed)

The most critical change is implementing **Multi-Tenancy**. We will adopt a **Row-Level Security (RLS) / Shared Schema** approach for cost efficiency and scalability.

### 1.1 New Tables Required

Add these tables to manage the SaaS platform level.

- **`organizations` (Tenants)**
  - `id` (UUID, PK)
  - `name`, `subdomain` (unique), `logo_url`
  - `billing_email`, `status` (active, suspended, deleted)
  - `created_at`

- **`usage_limits` (Per Org)**
  - `organization_id` (FK)
  - `max_users`, `storage_limit_gb`
  - `features_enabled` (JSONB)

- **`subscriptions` (SaaS)**
  - `id`, `organization_id` (FK)
  - `plan_id` (FK) - 'Basic', 'Pro', 'Enterprise'
  - `status` (active, past_due, canceled)
  - `period_start`, `period_end`
  - `stripe_subscription_id`

### 1.2 Schema Modifications (Crucial)

Every existing table (except system-wide tables like `plans`) MUST have an `organization_id`.

**Tables to Modify:**

- `users`
- `departments`
- `attendance`
- `leaves`
- `payroll`
- `tasks`
- `projects`
- `chats`
- `messages`
- `audit_logs`
- `notifications`

```sql
-- Example Modification
ALTER TABLE users ADD COLUMN organization_id UUID REFERENCES organizations(id);
-- Add Index for performance and security
CREATE INDEX idx_users_org ON users(organization_id);
```

**Refactoring Roles:**
Convert the hardcoded `ENUM` for roles into a dynamic permissions model or keep standardized SaaS roles.
New Table: `organization_roles` (id, organization_id, name, permissions [JSONB]).

---

## 2. Backend Architecture (Node.js + Express)

### 2.1 Middleware for Tenancy (The "Key")

Create a global middleware `extractTenant` that identifies the current organization based on the request.
This enables checking `req.tenantId` in every subsequent handler.

**Source of Tenant ID:**

1.  **Subdomain**: `company-a.saas-app.com` (Best for white-labeling)
2.  **Header**: `x-tenant-id` (For mobile apps/API consumers)

```typescript
// Middleware Pseudo-code
const extractTenant = async (req, res, next) => {
  const tenantId =
    req.headers["x-tenant-id"] || getTenantFromSubdomain(req.hostname);
  if (!tenantId) throw new Error("Tenant context missing");
  // Validate if tenant exists and is active
  const tenant = await db.organizations.findById(tenantId);
  if (!tenant || tenant.status !== "active")
    throw new Error("Organization suspended or not found");

  req.tenant = tenant;
  next();
};
```

### 2.2 Data Isolation Layer

Ensure **EVERY** database query includes the `organization_id`.

- **Dangerous**: `SELECT * FROM users WHERE email = ?` (Returns user from ANY company)
- **Safe**: `SELECT * FROM users WHERE email = ? AND organization_id = ?`

### 2.3 Authentication Service (Centralized)

- Users log in via a centralized portal (e.g., `app.your-saas.com` or `login.your-saas.com`).
- JWT Tokens must include `organization_id` and `role` permissions.
- Support "Switch Organization" if a user belongs to multiple companies (optional).

---

## 3. Frontend Architecture (React + Vite)

### 3.1 Authentication Flow

1.  **Landing Page**: Marketing site (Global).
2.  **Sign Up**: Create new Organization + Admin User (One step).
3.  **Login**:
    - Enter Email -> System detects Organization(s).
    - Redirect to Dashboard.

### 3.2 State Management

- Store `currentOrganization` in the global store.
- All API calls via `axios` must send the `x-tenant-id` header if not using subdomains.

### 3.3 Dynamic Branding

- Fetch Organization settings (Logo, Brand Color) on load.
- Apply dynamic CSS variables or Tailwind themes based on the organization's preferences.

---

## 4. Subscription & Billing (SaaS Features)

Integrate **Stripe** or **Razorpay**.

1.  **Free Trial**: Allow 14-day access upon signup (Organization state: `trial`).
2.  **Enforcement**:
    - Middleware to check `organization.subscription_status`.
    - Block access to critical routes if `past_due` or `canceled`.
3.  **Usage Limits**:
    - Check user count vs Plan Limit before adding a new user.

---

## 5. Super Admin Dashboard (The "God Mode")

You need a separate frontend or a special route for **YOU** (the SaaS Owner).

- **Dashboard**: MRR (Monthly Recurring Revenue), Total Users, Active Organizations.
- **Tenants**: View list of all organizations, login as them (impersonation), suspend/ban.
- **Plans**: Create/Edit pricing plans.

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [ ] Create `organizations` table.
- [ ] Migrate `users` to have `organization_id`.
- [ ] Update Login API to return Organization context.

### Phase 2: Isolation (Weeks 3-4)

- [ ] Refactor ALL Controllers/Services to require `organization_id` in WHERE clauses.
- [ ] Update Database Schema for all standard modules (HR, Payroll, etc.).

### Phase 3: Billing (Weeks 5-6)

- [ ] Integrate Stripe Checkout.
- [ ] Implement Webhooks to update subscription status.
- [ ] Create "Billing" page in Frontend Settings.

### Phase 4: Polish & Launch (Weeks 7-8)

- [ ] Super Admin Dashboard.
- [ ] Organization Settings (Logo upload, branding).
- [ ] Security Audit (Ensure cross-tenant data leakage is impossible).
