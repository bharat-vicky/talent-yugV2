# Identity Platform Architecture & Phase 2 Foundation

This document outlines the core architectural principles, workflows, and standards established during Phase 2. All future modules must adhere strictly to these foundations.

## 1. Authentication Flow
Identity uses `next-auth` (v4) with a custom MongoDB adapter to handle authentication.
- **Provider:** Google OAuth
- **Session:** JWT strategy
- **Enforcement:** `src/middleware.ts` protects all routes except `/login`, `/signup`, and public APIs.
- **Audit Logging:** Every successful login fires an `AuditService` log (`USER_LOGIN`).

## 2. Workspace Lifecycle
Workspaces are the root tenant entity in the platform. No workspace should ever exist without its required configuration documents.
Creating a workspace automatically provisions:
1. The **Workspace** entity.
2. An **Owner Membership** for the creator.
3. **WorkspaceSettings** (theme, features).
4. **BrandingSettings** (primary colors).
5. **ScannerSettings** (offline defaults).
6. **RegistrationSettings** (approval workflows).
7. Initial **Audit Log** (`WORKSPACE_CREATED`).

If a user authenticates but has 0 Memberships, they are automatically forced to `/onboarding`.

## 3. Event Lifecycle
Events belong to a Workspace. Similar to Workspaces, creating an event provisions all child schemas.
Creating an event automatically provisions:
1. The **Event** entity.
2. **EventSettings** (visibility, capacity).
3. **ScannerSettings** (event-specific overrides).
4. **RegistrationSettings** (event-specific overrides).
5. **BrandingSettings** (event-specific overrides).
6. **QRConfiguration** (default style, fg/bg color).
7. **GuestConfiguration** (custom fields, required fields).
8. Initial **Audit Log** (`EVENT_CREATED`).

## 4. Dashboard Architecture
The Dashboard Shell (`src/components/dashboard/DashboardShell.tsx`) is the permanent application shell.
It provides:
- Responsive Sidebar & Mobile Navigation Sheet.
- Workspace Switcher.
- Global Search foundation.
- User Profile Menu & Logout capabilities.
- Inherited context for all pages under `(dashboard)/layout.tsx`.

## 5. RBAC Overview
Role-Based Access Control (RBAC) relies on the `Membership` collection linking a `UserId` to a `WorkspaceId`.
Available roles:
- `owner`: Full control, billing, deletion.
- `admin`: Can manage settings and users, cannot delete workspace.
- `manager`: Can manage events and guests.
- `member`: Can view and execute operational tasks (e.g., scanning).
- `viewer`: Read-only access to analytics.

*Permission evaluation should be centralized as we expand features.*

## 6. API Standards
Every API endpoint MUST return a standardized JSON response format.
- Success payloads use HTTP 200/201 and return:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "errors": null
}
```
- Error payloads use HTTP 400/401/403/500 and return:
```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "errors": [ ... ]
}
```

## 7. Performance & Tooling
- We heavily favor **Server Components** for data fetching and layout structure.
- **Client Components** (`"use client"`) are isolated to interactive elements (forms, toggles, sheets).
- Next.js 16 App Router handles all routing.
- The UI relies on Tailwind CSS v4, Lucide React, and Radix/Shadcn primitives.
