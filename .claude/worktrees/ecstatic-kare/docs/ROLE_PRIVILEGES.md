# Role privileges (роли и привилегии)

Only **one** role has full control: **OWNER**. All other roles have restricted permissions.

## Role overview

| Role        | Description |
|------------|-------------|
| **OWNER**  | Full control. One per company. All permissions including company delete and user management. |
| **ADMIN**  | Almost full: all permissions except `company:delete` and `user:manage`. Cannot delete the company or manage users/roles. |
| **MANAGER**| Create/edit invoices, clients, products, payments; read company. No delete on company; no user management. |
| **ACCOUNTANT** | Invoice create/read/update/send; client and product read-only; payment create/read/update; company read; reports. **Cannot create clients.** |
| **VIEWER** | Read-only: invoices, clients, products, payments, company, reports. |

## Permission matrix

| Permission        | OWNER | ADMIN | MANAGER | ACCOUNTANT | VIEWER |
|-------------------|-------|-------|---------|-------------|--------|
| invoice:create    | ✓     | ✓     | ✓       | ✓           | —      |
| invoice:read     | ✓     | ✓     | ✓       | ✓           | ✓      |
| invoice:update   | ✓     | ✓     | ✓       | ✓           | —      |
| invoice:delete   | ✓     | ✓     | —       | —           | —      |
| invoice:send     | ✓     | ✓     | ✓       | ✓           | —      |
| client:create    | ✓     | ✓     | ✓       | **—**       | —      |
| client:read      | ✓     | ✓     | ✓       | ✓           | ✓      |
| client:update    | ✓     | ✓     | ✓       | —           | —      |
| client:delete    | ✓     | ✓     | —       | —           | —      |
| product:create   | ✓     | ✓     | ✓       | —           | —      |
| product:read     | ✓     | ✓     | ✓       | ✓           | ✓      |
| product:update   | ✓     | ✓     | ✓       | —           | —      |
| product:delete   | ✓     | ✓     | —       | —           | —      |
| payment:*        | ✓     | ✓     | ✓*      | ✓*          | read only |
| company:read     | ✓     | ✓     | ✓       | ✓           | ✓      |
| company:update   | ✓     | ✓     | —       | —           | —      |
| company:delete   | ✓     | **—** | —       | —           | —      |
| user:invite      | ✓     | ✓     | —       | —           | —      |
| user:manage      | ✓     | **—** | —       | —           | —      |
| settings:manage  | ✓     | ✓     | —       | —           | —      |
| reports:view     | ✓     | ✓     | ✓       | ✓           | ✓      |
| reports:export   | ✓     | ✓     | ✓       | ✓           | —      |

\* MANAGER and ACCOUNTANT: payment create/read/update (no delete).

## Summary

- **Who can add clients?** OWNER, ADMIN, MANAGER. Not ACCOUNTANT or VIEWER.
- **Who can add invoices?** OWNER, ADMIN, MANAGER, ACCOUNTANT. Not VIEWER.
- **Who has full permissions?** Only OWNER. ADMIN cannot delete the company or manage users.

Seeding is done via `prisma/seed-permissions.js`. After changing role permissions, re-run the seed (or apply equivalent changes in Supabase for `Permission` and `RolePermission` tables).
