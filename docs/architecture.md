# Architecture — KukkutPro

> This document is a technical contract. The coding agent must not redesign any layer without an explicit instruction from the product owner. Deviations require a written approval note.

---

## Architecture Principles

1. **Mobile-first** — The primary device is a mid-range Android phone. Every decision defaults to the lowest-spec target.
2. **Offline-tolerant** — MVP is online-only, but architecture must not actively block offline support in v2.
3. **Single source of truth** — All derived values (egg stock, customer balance, cash balance) are computed by the backend, never stored as editable flat values.
4. **No silent deletes** — Every financial record is soft-deleted or reversed. Hard delete is prohibited at the service layer.
5. **Self-contained modules** — Each domain (Eggs, Sales, Customers, Cash, Labour, Expenses) has its own service and route set. No cross-module direct DB access.

---

## System Overview

```
┌─────────────────────────────────────────┐
│              React Frontend              │
│         (Vite · TypeScript · PWA)        │
└───────────────┬─────────────────────────┘
                │ HTTPS REST API
┌───────────────▼─────────────────────────┐
│             Node.js + Express            │
│          (TypeScript · REST API)         │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  Routes  │  │ Services │  │ Guards │ │
│  └──────────┘  └──────────┘  └────────┘ │
└───────────────┬─────────────────────────┘
                │ Prisma ORM
┌───────────────▼─────────────────────────┐
│             PostgreSQL                   │
│          (Hosted on Railway/Supabase)    │
└─────────────────────────────────────────┘
```

---

## Frontend

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 18 | Ecosystem maturity; component model fits the form-heavy UI |
| Build tool | Vite | Fast dev server; optimised production bundles |
| Language | TypeScript (strict mode) | Prevents entire class of runtime bugs in financial calculations |
| Styling | Tailwind CSS | Utility-first; no runtime CSS-in-JS overhead on mobile |
| Component library | shadcn/ui | Accessible, unstyled primitives; fully owned in the codebase |
| State management | Zustand | Lightweight; no Redux boilerplate for this app's complexity |
| Server state | TanStack Query (React Query) | Caching, background refetch, loading/error states built in |
| Forms | React Hook Form + Zod | Schema-validated forms with minimal re-renders |
| Routing | React Router v6 | Standard; nested routes for detail screens |
| PWA | Vite PWA plugin | Installable on Android home screen; manifest + service worker |
| Date handling | date-fns | Lightweight; no moment.js |
| Number formatting | Intl.NumberFormat (native) | ₹ formatting with Indian locale (en-IN) |

**Frontend folder structure:**
```
src/
├── components/
│   ├── ui/              # shadcn/ui primitives
│   └── shared/          # App-level shared components
├── features/
│   ├── dashboard/
│   ├── production/
│   ├── sales/
│   ├── customers/
│   ├── cashbook/
│   ├── labour/
│   └── expenses/
├── hooks/               # Custom hooks
├── lib/
│   ├── api.ts           # Axios instance + interceptors
│   ├── utils.ts
│   └── constants.ts     # PETI_SIZE = 210, TRAY_SIZE = 30, etc.
├── stores/              # Zustand stores (UI state only)
├── types/               # Shared TypeScript interfaces
└── routes/              # Route definitions
```

---

## Backend / API Layer

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20 LTS | Stable; matches frontend language (TypeScript) |
| Framework | Express 5 | Lightweight; sufficient for this API surface area |
| Language | TypeScript | Type safety across the stack |
| ORM | Prisma | Type-safe DB client; auto-generated types from schema |
| Validation | Zod | Same schema library as frontend; reusable types |
| API style | REST | Simple; no GraphQL complexity needed for this app |
| Error handling | Centralized error middleware | Consistent error shape: `{ error: string, code: string }` |
| Logging | Pino | Fast structured logging; JSON output |

**Backend folder structure:**
```
src/
├── routes/
│   ├── production.ts
│   ├── sales.ts
│   ├── customers.ts
│   ├── cashbook.ts
│   ├── labour.ts
│   ├── expenses.ts
│   └── settings.ts
├── services/
│   ├── production.service.ts
│   ├── inventory.service.ts   # Core: recalculates egg stock
│   ├── sales.service.ts
│   ├── customer.service.ts
│   ├── cashbook.service.ts    # Core: posts cash entries
│   ├── labour.service.ts
│   └── expense.service.ts
├── middleware/
│   ├── auth.ts
│   ├── validate.ts            # Zod schema middleware
│   └── errorHandler.ts
├── prisma/
│   └── schema.prisma
└── lib/
    └── constants.ts
```

---

## Database

| Decision | Choice |
|---|---|
| Database | PostgreSQL 15 |
| ORM | Prisma |
| Hosting (MVP) | Supabase (free tier) or Railway |
| Migrations | Prisma Migrate |

### Core Schema (simplified)

```prisma
model Farm {
  id              String     @id @default(cuid())
  name            String
  openingEggStock Int        @default(0)
  openingCash     Decimal    @default(0)
  createdAt       DateTime   @default(now())
}

model EggProduction {
  id            String   @id @default(cuid())
  date          DateTime @db.Date
  eggsProduced  Int
  brokenEggs    Int      @default(0)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@unique([farmId, date])
}

model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String?
  address   String?
  notes     String?
  isActive  Boolean  @default(true)     // soft delete
  sales     Sale[]
  payments  CustomerPayment[]
}

model Sale {
  id             String    @id @default(cuid())
  date           DateTime  @db.Date
  customerId     String
  customer       Customer  @relation(...)
  eggsQty        Int
  pricePerEgg    Decimal
  totalAmount    Decimal
  amountReceived Decimal
  amountDue      Decimal
  status         SaleStatus  // PAID | PARTIAL | UNPAID | VOIDED
  voidedAt       DateTime?
  voidReason     String?
  cashEntryId    String?
  createdAt      DateTime  @default(now())
}

model CustomerPayment {
  id           String   @id @default(cuid())
  customerId   String
  date         DateTime @db.Date
  amount       Decimal
  isAdvance    Boolean  @default(false)
  notes        String?
  cashEntryId  String?
  createdAt    DateTime @default(now())
}

model CashEntry {
  id          String        @id @default(cuid())
  date        DateTime      @db.Date
  type        CashEntryType // IN | OUT
  amount      Decimal
  source      CashSource    // SALE | CUSTOMER_PAYMENT | LABOUR | EXPENSE | MANUAL
  referenceId String?       // links to the originating record
  notes       String?
  isManual    Boolean       @default(false)
  createdAt   DateTime      @default(now())
}

model Labourer {
  id          String      @id @default(cuid())
  name        String
  phone       String?
  role        String?
  salaryType  SalaryType  // MONTHLY | DAILY | PER_TASK
  salaryAmount Decimal
  joiningDate DateTime    @db.Date
  isActive    Boolean     @default(true)
  payments    LabourPayment[]
}

model LabourPayment {
  id           String       @id @default(cuid())
  labourerId   String
  date         DateTime     @db.Date
  amount       Decimal
  paymentType  PaymentType  // SALARY | ADVANCE
  notes        String?
  cashEntryId  String?
  createdAt    DateTime     @default(now())
}

model Expense {
  id          String    @id @default(cuid())
  date        DateTime  @db.Date
  category    String
  description String
  quantity    Decimal?
  unitCost    Decimal?
  totalAmount Decimal
  notes       String?
  cashEntryId String?
  createdAt   DateTime  @default(now())
}
```

### Key Design Decisions

- **Eggs stored as integers** (raw count). Peti/tray display is always computed: `Math.floor(eggs / 210)` etc.
- **All money stored as `Decimal`** via Prisma's Decimal type (maps to PostgreSQL `NUMERIC`). Never use `Float` for money.
- **`CashEntry` is the ledger backbone.** Every financial event posts here. Closing cash = sum of all entries up to that date.
- **`EggInventory` is computed on-the-fly** by the `inventory.service.ts` from production + sales records. It is never stored as a separate table — this prevents sync bugs.
- **Soft deletes only** — `isActive: false` + `voidedAt` timestamp. No physical row deletion for financial records.

---

## Authentication

> MVP: Single-owner, no login required for first release. Architecture prepared for auth addition.

| Layer | Plan |
|---|---|
| MVP | No authentication. App assumes single-user, single-farm. |
| Post-MVP | JWT-based auth. `farmId` added to every request via middleware. |
| Implementation path | Add `User` model, `/auth/login` route, JWT middleware — all other routes add `req.farmId` guard without structural changes. |

---

## State Management

| State Type | Where Managed | Tool |
|---|---|---|
| Server data (API responses) | TanStack Query cache | Automatic caching + background refresh |
| UI state (modals, tabs, form dirty) | Component local state | `useState` |
| Cross-component UI state | Zustand store | Only if shared across 3+ components |
| Form state | React Hook Form | Per-form, not global |
| URL state (filters, pagination) | URL params | `useSearchParams` |

**Rule:** Do not put server data into Zustand. TanStack Query is the server-state layer.

---

## Service Layer Rules

Each service owns its domain and must:

1. Handle all business logic — routes are thin.
2. Call `cashbook.service.postEntry()` whenever a cash event occurs.
3. Call `inventory.service.recalculate(date)` whenever production or sales change.
4. Never directly query another module's tables — use that module's service.
5. Return typed objects, never raw Prisma objects to the route.

**Cascade chain example — recording a sale:**
```
POST /api/sales
  → sales.service.createSale()
    → validate stock availability (inventory.service.getStock(date))
    → create Sale record
    → if amountDue > 0: customer.service.addDue(customerId, amountDue)
    → cashbook.service.postEntry({ type: IN, source: SALE, amount: amountReceived })
    → inventory.service.recalculate(date)
    → return created sale
```

---

## External Integrations

**MVP: None.** The system is fully self-contained with no external APIs.

**Future integrations (architecture must not block):**
- WhatsApp Business API (due reminders)
- Google Drive / S3 (data backup)
- Firebase Cloud Messaging (push notifications)

---

## Security

| Layer | Measure |
|---|---|
| Transport | HTTPS only (TLS 1.2+). HTTP → HTTPS redirect. |
| Input validation | Zod schema validation in middleware before any service call. |
| SQL injection | Prisma ORM exclusively. Raw SQL prohibited. |
| Financial records | Hard delete disabled at service layer. Voiding creates a reversal entry. |
| Audit trail | `createdAt` / `updatedAt` on every model. `userId` added post-auth. |
| CORS | Whitelist frontend domain only. |
| Rate limiting | `express-rate-limit` on all write endpoints (100 req/min per IP). |
| Secrets | `.env` file. Never committed to git. `dotenv` in dev, environment variables in production. |

---

## Performance

| Concern | Approach |
|---|---|
| Dashboard query speed | Aggregate queries on indexed date + farmId columns |
| Inventory recalculation | Recalculate from the edited date forward only, not full history |
| Frontend bundle | Code-split by feature route. Lazy-load non-dashboard routes. |
| Images | None in MVP. No image handling needed. |
| Database indexes | Index on `(farmId, date)` for all date-range queries |
| Mobile rendering | No heavy animations. Tailwind utilities only. |

---

## Deployment

| Service | Choice | Reason |
|---|---|---|
| Frontend hosting | Vercel | Zero-config Vite deployment; CDN edge |
| Backend hosting | Railway | Simple Node.js deploy; auto-deploys from GitHub |
| Database | Supabase (PostgreSQL) | Managed Postgres; free tier sufficient for MVP |
| Environment | Single `production` environment for MVP |
| CI | GitHub Actions — lint + type check on every push |
| Domain | Custom domain post-MVP; Vercel subdomain for MVP |

**Deployment flow:**
```
git push main
  → GitHub Actions: tsc --noEmit + eslint
  → Vercel auto-deploy (frontend)
  → Railway auto-deploy (backend)
  → Prisma migrate deploy (runs on Railway start)
```

---

## What the Coding Agent Must Not Change Without Approval

1. Database schema for financial tables (`Sale`, `CashEntry`, `CustomerPayment`, `LabourPayment`)
2. The "no hard delete" rule for financial records
3. The "inventory is computed, not stored" rule
4. The cascade chain: sale → inventory + cash + dues
5. Decimal type for all monetary values
6. The service-layer ownership boundaries
